import mongoose from "mongoose";

const userContextSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  productName: { type: String, required: true },
  productDescription: { type: String, required: true },
  keyBenefits: [{ type: String }], // Array of selling points
  updatedAt: { type: Date, default: Date.now },
});

export const UserContext = mongoose.model("UserContext", userContextSchema);
