import express from "express";
import { UserContext } from "../models/UserContext.js";

const router = express.Router();

// Get the current product context configuration
router.get("/", async (req, res) => {
  try {
    let context = await UserContext.findOne();
    if (!context) {
      // Return an empty template configuration if none exists yet
      return res.json({
        companyName: "",
        productName: "",
        productDescription: "",
        keyBenefits: [],
      });
    }
    return res.json(context);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch product context." });
  }
});

// Update or set the product context configuration
router.post("/", async (req, res) => {
  const { companyName, productName, productDescription, keyBenefits } =
    req.body;
  try {
    let context = await UserContext.findOne();
    if (context) {
      context.companyName = companyName;
      context.productName = productName;
      context.productDescription = productDescription;
      context.keyBenefits = keyBenefits;
      context.updatedAt = Date.now();
      await context.save();
    } else {
      context = await UserContext.create({
        companyName,
        productName,
        productDescription,
        keyBenefits,
      });
    }
    return res.json({
      message: "Product context saved successfully!",
      context,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to save product context." });
  }
});

export default router;
