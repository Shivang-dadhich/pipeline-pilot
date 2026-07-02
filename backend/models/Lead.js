import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  websiteUrl: { type: String, required: true },
  industry: { type: String, default: "Unknown" },
  companyDescription: { type: String, default: "" },
  estimatedRoi: { type: Number, default: 0 },
  generatedPitch: { type: String, default: "" },
  status: {
    type: String,
    enum: ["Discovered", "Researched", "Drafted", "Sent"],
    default: "Discovered",
  },
  createdAt: { type: Date, default: Date.now },
});

export const Lead = mongoose.model("Lead", leadSchema);
