import mongoose from "mongoose";

const agentMemorySchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },
  logs: [
    {
      role: { type: String, enum: ["user", "model", "tool"], required: true },
      content: { type: String, required: true },
      toolName: { type: String },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});

export const AgentMemory = mongoose.model("AgentMemory", agentMemorySchema);
