const express = require("express");
const router = express.Router();
const { Configuration, OpenAIApi } = require("openai");
const {
  validateInput,
  productDescriptionRules,
  seoKeywordsRules,
} = require("../middleware/validation");
const { authenticateToken } = require("../middleware/auth");
const aiService = require("../services/ai-service");
const { rateLimiter } = require("../middleware/rate-limiter");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

router.post(
  "/description",
  authenticateToken,
  productDescriptionRules,
  validateInput,
  async (req, res) => {
    try {
      const { productName, features, tone } = req.body;

      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a professional e-commerce product description writer.",
          },
          {
            role: "user",
            content: `Write a ${tone} product description for ${productName}. Features: ${features}`,
          },
        ],
      });

      res.json({ description: completion.data.choices[0].message.content });
    } catch (error) {
      console.error("OpenAI API Error:", error);
      res.status(500).json({ error: "Failed to generate description" });
    }
  }
);

router.post(
  "/seo-keywords",
  authenticateToken,
  seoKeywordsRules,
  validateInput,
  async (req, res) => {
    try {
      const { productName, category, targetMarket } = req.body;

      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an SEO expert.",
          },
          {
            role: "user",
            content: `Generate SEO keywords for: ${productName} in category ${category} targeting ${targetMarket}`,
          },
        ],
      });

      res.json({ keywords: completion.data.choices[0].message.content });
    } catch (error) {
      console.error("OpenAI API Error:", error);
      res.status(500).json({ error: "Failed to generate keywords" });
    }
  }
);

router.post("/", authenticateToken, rateLimiter, async (req, res, next) => {
  try {
    const { productName, category, features, tone, length } = req.body;

    const result = await aiService.generateDescription({
      productName,
      category,
      features,
      tone,
      length,
      userId: req.user.id,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
