const express = require("express");
const router = express.Router();
const AdvancedSEOService = require("../services/advanced-seo-service");
const { authenticateToken, checkSubscription } = require("../middleware/auth");

router.post("/analyze", authenticateToken, async (req, res, next) => {
  try {
    const { description, keywords } = req.body;
    const userTier = req.user.subscriptionTier; // 'free', 'pro', or 'business'

    const analysis = await AdvancedSEOService.analyzeSEO(
      description,
      keywords,
      userTier
    );

    res.json({
      analysis,
      userTier,
      upgradeMessage:
        userTier === "free"
          ? "Upgrade to Pro for advanced SEO features!"
          : null,
    });
  } catch (error) {
    next(error);
  }
});

// Pro and Business features
router.post(
  "/competitor-analysis",
  authenticateToken,
  checkSubscription(["pro", "business"]),
  async (req, res, next) => {
    try {
      const { keywords } = req.body;
      const analysis = await AdvancedSEOService.analyzeCompetitors(keywords);
      res.json(analysis);
    } catch (error) {
      next(error);
    }
  }
);

// Business-only features
router.post(
  "/market-analysis",
  authenticateToken,
  checkSubscription(["business"]),
  async (req, res, next) => {
    try {
      const { keywords } = req.body;
      const analysis = await AdvancedSEOService.analyzeMarket(keywords);
      res.json(analysis);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
