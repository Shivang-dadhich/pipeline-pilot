import { GoogleGenAI, Type } from "@google/genai";
import { scrapeWebsite } from "./scraperService.js";
import { Lead } from "../models/Lead.js";
import { AgentMemory } from "../models/AgentMemory.js";
import dotenv from "dotenv";

dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Define the programmatic tools available to the agent
const tools = [
  {
    functionDeclarations: [
      {
        name: "scrapeCompanyWebsite",
        description:
          "Scrapes the text content of a target company website to understand their business model and size.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            url: {
              type: Type.STRING,
              description: "The domain or URL of the target company website.",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "calculateRoiMetrics",
        description:
          "Calculates the estimated annual financial ROI savings based on industry complexity and user scale assumptions.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            targetScale: {
              type: Type.STRING,
              description:
                "The rough scale or size of the prospect company (e.g., small, medium, enterprise).",
            },
            complexityFactor: {
              type: Type.NUMBER,
              description:
                "A scale from 1 to 5 mapping how complex their technical bottleneck is.",
            },
          },
          required: ["targetScale", "complexityFactor"],
        },
      },
    ],
  },
];

// Implementation of the tools
const toolMap = {
  scrapeCompanyWebsite: async ({ url }) => {
    return await scrapeWebsite(url);
  },
  calculateRoiMetrics: async ({ targetScale, complexityFactor }) => {
    let baseSavings = 50000;
    if (targetScale === "medium") baseSavings = 250000;
    if (targetScale === "enterprise") baseSavings = 1500000;
    const finalRoi = baseSavings * complexityFactor;
    return JSON.stringify({ estimatedRoi: finalRoi });
  },
};


/**
 * Core Autonomous Agent execution loop.
 */
export async function runAutonomousAgent(leadId, userContext) {
  const lead = await Lead.findById(leadId);
  
  // 1. Initialize or fetch Agent memory from MongoDB
  let memory = await AgentMemory.findOne({ leadId });
  if (!memory) {
    memory = await AgentMemory.create({
      leadId,
      logs: [{
        role: 'user',
        content: `Task: Analyze target company "${lead.companyName}" with website "${lead.websiteUrl}". Compare them to our product: ${userContext.productName} (${userContext.productDescription}). Utilize your tools to gather data, run ROI calculations, and then generate a structured summary including industry, companyDescription, estimatedRoi, and a 3-paragraph customized email pitch (generatedPitch).`
      }]
    });
  }

  // Convert saved logs array to Gemini chat context history format
  let chatHistory = memory.logs.map(log => ({
    role: log.role,
    parts: [{ text: log.content }]
  }));

  let agentActive = true;
  let loopCount = 0;
  const maxLoops = 5; // Prevent infinity runs

  while (agentActive && loopCount < maxLoops) {
    loopCount++;
    console.log(`🤖 [Agent Loop ${loopCount}]: Analyzing current state and tools...`);

    // Call the Gemini model giving it access to our explicit tool definitions
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: chatHistory,
      config: { tools: tools }
    });

    const candidate = response.candidates?.[0];
    const message = candidate?.content;
    
    // Check if the agent wants to execute a tool function
    if (message?.parts?.[0]?.functionCall) {
      const call = message.parts[0].functionCall;
      console.log(`🛠️ Agent autonomously decided to call tool: ${call.name}`);

      // Run the tool execution mapping
      let toolResultText = "";
      if (toolMap[call.name]) {
        try {
          const result = await toolMap[call.name](call.args);
          toolResultText = typeof result === 'string' ? result : JSON.stringify(result);
        } catch (err) {
          toolResultText = `Tool execution error: ${err.message}`;
        }
      } else {
        toolResultText = `Error: Tool ${call.name} not found.`;
      }

      // Log the Agent's decision and the Tool's output into MongoDB Memory
      memory.logs.push({ role: 'model', content: `I will call ${call.name} to gather missing details.` });
      memory.logs.push({ role: 'tool', content: toolResultText, toolName: call.name });
      await memory.save();

      // Append to running session history
      chatHistory.push({ role: 'model', parts: [{ text: `Calling tool ${call.name}` }] });
      chatHistory.push({ role: 'tool', parts: [{ text: toolResultText }] });

    } else {
      // No tool called means the agent has completed its thought tracking process.
      // Now we request the agent to compile its gathered data into our strict database schema format.
      console.log(`✅ Agent has gathered all data. Compiling final insights structured payload...`);
      
      const structuredResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [...chatHistory, { role: 'user', parts: [{ text: 'Compile your final insights into the required JSON schema format.' }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              industry: { type: Type.STRING },
              companyDescription: { type: Type.STRING },
              estimatedRoi: { type: Type.INTEGER },
              generatedPitch: { type: Type.STRING }
            },
            required: ['industry', 'companyDescription', 'estimatedRoi', 'generatedPitch']
          }
        }
      });

      const finalData = JSON.parse(structuredResponse.text);
      
      // Update our Primary Lead structure document
      lead.industry = finalData.industry;
      lead.companyDescription = finalData.companyDescription;
      lead.estimatedRoi = finalData.estimatedRoi;
      lead.generatedPitch = finalData.generatedPitch;
      lead.status = 'Drafted';
      await lead.save();

      // Log complete termination state to memory
      memory.logs.push({ role: 'model', content: 'Task completed successfully.' });
      await memory.save();

      agentActive = false;
      return lead;
    }
  }
}
