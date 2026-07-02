import express from "express";
import { Lead } from "../models/Lead.js";
import { UserContext } from "../models/UserContext.js";
import { scrapeWebsite } from "../services/scraperService.js";
import { analyzeAndPitchLead } from "../services/agentService.js";

const router = express.Router();

// 1. Get all leads (for rendering on our Kanban board)
router.get("/", async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    return res.json(leads);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch leads." });
  }
});

// 2. Add a basic new lead manually (Lands in 'Discovered' column)
router.post("/", async (req, res) => {
  const { companyName, websiteUrl } = req.body;
  try {
    const newLead = await Lead.create({ companyName, websiteUrl });
    return res.status(201).json(newLead);
  } catch (error) {
    return res.status(500).json({ error: "Failed to add lead." });
  }
});

// 3. THE AGENT TRIGGER: Scrape website, run Gemini analysis, and update lead
router.post("/process/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findById(id);
    if (!lead) return res.status(404).json({ error: "Lead not found." });

    const userContext = await UserContext.findOne();
    if (!userContext) {
      return res
        .status(400)
        .json({ error: "Please set up your Product Context first!" });
    }

    // Step A: Update status to 'Researched' to simulate progress
    lead.status = "Researched";
    await lead.save();

    // Step B: Fire up the scraper service
    console.log(`🤖 Scraping target website: ${lead.websiteUrl}...`);
    const scrapedContent = await scrapeWebsite(lead.websiteUrl);

    // Step C: Hand data to Gemini Agent Service
    console.log(
      `🧠 Processing insights and drafting customized pitch via Gemini...`,
    );
    const aiAnalysis = await analyzeAndPitchLead(
      userContext,
      lead.companyName,
      scrapedContent,
    );

    // Step D: Map structured AI keys cleanly directly to database properties
    lead.industry = aiAnalysis.industry;
    lead.companyDescription = aiAnalysis.companyDescription;
    lead.estimatedRoi = aiAnalysis.estimatedRoi;
    lead.generatedPitch = aiAnalysis.generatedPitch;
    lead.status = "Drafted"; // Automatically advance status to Drafted stage

    await lead.save();
    return res.json({ message: "Agent processing complete!", lead });
  } catch (error) {
    console.error("Agent route error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Agent processing execution failed." });
  }
});

// 4. Update lead status manually (e.g., when drag-and-dropping across Kanban columns)
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params; // <-- ADDED THIS LINE TO FIX THE BUG
    const { status } = req.body;

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: "after" },
    );

    if (!updatedLead) {
      return res.status(404).json({ error: "Lead not found." });
    }

    return res.json(updatedLead);
  } catch (error) {
    console.error("Status update error:", error);
    return res.status(500).json({ error: "Failed to update stage status." });
  }
});

export default router;
