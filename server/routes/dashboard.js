const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const PerformanceAnalytics = require("../services/performance-analytics");
const AIPersonalizationEngine = require("../services/ai-personalization.js");

router.get("/overview", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Gather all relevant data for dashboard
    const [usage, performance, recentDescriptions, projectStats, aiInsights] =
      await Promise.all([
        getUsageStats(userId),
        getPerformanceMetrics(userId),
        getRecentDescriptions(userId),
        getProjectStatistics(userId),
        getAIInsights(userId),
      ]);

    res.json({
      usage,
      performance,
      recentDescriptions,
      projectStats,
      aiInsights,
      limits: await checkUserLimits(userId),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/performance-metrics", authenticateToken, async (req, res) => {
  try {
    const { timeframe } = req.query;
    const metrics = await PerformanceAnalytics.getDetailedMetrics(
      req.user.id,
      timeframe
    );
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/ai-insights", authenticateToken, async (req, res) => {
  try {
    const insights = await AIPersonalizationEngine.getUserInsights(req.user.id);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function getUsageStats(userId) {
  // Implementation
}

async function getPerformanceMetrics(userId) {
  // Implementation
}

async function getRecentDescriptions(userId) {
  // Implementation
}

async function getProjectStatistics(userId) {
  // Implementation
}

async function getAIInsights(userId) {
  // Implementation
}

async function checkUserLimits(userId) {
  // Implementation
}

module.exports = router;
