import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize the official Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Compares target company data against user product context using Gemini 2.5 Flash.
 * @param {Object} userContext - The product profile stored in DB.
 * @param {string} companyName - Target company name.
 * @param {string} scrapedContent - Cleaned website text from scraper.
 * @returns {Promise<Object>} Formatted structured analysis matching our database requirements.
 */
export async function analyzeAndPitchLead(
  userContext,
  companyName,
  scrapedContent,
) {
  const prompt = `
    You are an expert enterprise business development agent. Your task is to analyze a prospective company's scraped text, map it against our company's product offering, calculate an estimated ROI impact score, and draft a compelling cold outreach email.

    --- OUR PRODUCT DETAILS ---
    Company Name: ${userContext.companyName}
    Product Name: ${userContext.productName}
    Product Description: ${userContext.productDescription}
    Key Core Benefits: ${userContext.keyBenefits.join(", ")}

    --- TARGET PROSPECT DETAILS ---
    Target Company Name: ${companyName}
    Scraped Website Text: ${scrapedContent}

    --- INSTRUCTIONS ---
    1. Identify the target's industry and summarize their main business description based on the text.
    2. Quantify an abstract "Estimated Annual ROI Value" (integer in USD) that our product could save or generate for them.
    3. Write a highly tailored, conversion-focused 3-paragraph cold email pitch from our product to them. Do not use placeholder brackets like [Your Name]; write it naturally.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        // Enforce strict JSON output matching our expected layout
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            industry: { type: Type.STRING },
            companyDescription: { type: Type.STRING },
            estimatedRoi: { type: Type.INTEGER },
            generatedPitch: { type: Type.STRING },
          },
          required: [
            "industry",
            "companyDescription",
            "estimatedRoi",
            "generatedPitch",
          ],
        },
      },
    });

    // Parse out the clean verified JSON string directly from the response text
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating agent analysis:", error);
    throw new Error("AI Agent processing failed.");
  }
}
