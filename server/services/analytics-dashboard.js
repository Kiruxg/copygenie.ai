class AnalyticsDashboard {
  constructor() {
    this.metrics = {
      basic: ["conversionRate", "descriptionsGenerated", "charactersSaved"],
      pro: ["revenueImpact", "marketplacePerformance", "competitorComparison"],
      business: ["aiInsights", "customMetrics", "forecastPredictions"],
    };
  }

  async getDashboardData(userId) {
    const user = await User.findById(userId);
    const tier = user.subscriptionTier;

    const data = {
      overview: await this.getOverviewMetrics(userId),
      timeSaved: await this.calculateTimeSaved(userId),
      roi: await this.calculateROI(userId),
      recentActivity: await this.getRecentActivity(userId),
    };

    // Add tier-specific metrics
    if (tier !== "free") {
      data.advanced = await this.getAdvancedMetrics(userId);
      data.marketplaceInsights = await this.getMarketplaceInsights(userId);
    }

    if (tier === "business") {
      data.predictiveAnalytics = await this.getPredictiveAnalytics(userId);
      data.customReports = await this.getCustomReports(userId);
    }

    return data;
  }

  async getOverviewMetrics(userId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return {
      descriptionsGenerated: await Description.countDocuments({
        userId,
        createdAt: { $gte: thirtyDaysAgo },
      }),
      averageConversionRate: await this.calculateAverageConversion(userId),
      totalTimeSaved: await this.calculateTimeSaved(userId),
      successRate: await this.calculateSuccessRate(userId),
    };
  }

  async calculateROI(userId) {
    const user = await User.findById(userId);
    const descriptions = await Description.find({ userId });

    const metrics = {
      timeSaved: await this.calculateTimeSaved(userId),
      averageHourlyRate: 50, // Default value or user-set
      subscriptionCost: await this.getSubscriptionCost(user),
      revenueIncrease: await this.calculateRevenueIncrease(descriptions),
    };

    return {
      timeSavingsValue: metrics.timeSaved * metrics.averageHourlyRate,
      netRevenue: metrics.revenueIncrease - metrics.subscriptionCost,
      roi: (
        ((metrics.revenueIncrease - metrics.subscriptionCost) /
          metrics.subscriptionCost) *
        100
      ).toFixed(2),
    };
  }

  async getMarketplaceInsights(userId) {
    const descriptions = await Description.find({ userId }).populate(
      "marketplaceData"
    );

    return {
      topPerformingPlatforms: this.analyzeTopPlatforms(descriptions),
      categoryPerformance: await this.analyzeCategoryPerformance(descriptions),
      competitorComparison: await this.getCompetitorComparison(descriptions),
      optimizationOpportunities: await this.findOptimizationOpportunities(
        descriptions
      ),
    };
  }

  async getPredictiveAnalytics(userId) {
    const historicalData = await this.getHistoricalData(userId);

    return {
      projectedGrowth: this.calculateProjectedGrowth(historicalData),
      trendAnalysis: this.analyzeTrends(historicalData),
      seasonalityImpact: this.analyzeSeasonality(historicalData),
      recommendedActions: await this.generateRecommendations(userId),
    };
  }

  async generateRecommendations(userId) {
    const userData = await this.getUserData(userId);
    const marketData = await this.getMarketData(userId);

    return {
      immediate: this.getImmediateActions(userData),
      shortTerm: this.getShortTermStrategy(userData, marketData),
      longTerm: this.getLongTermStrategy(userData, marketData),
    };
  }

  async calculateSuccessRate(userId) {
    const descriptions = await Description.find({ userId });
    const successfulDescriptions = descriptions.filter(
      (desc) => desc.conversionRate > desc.categoryAverage
    );

    return (
      (successfulDescriptions.length / descriptions.length) *
      100
    ).toFixed(2);
  }

  async findOptimizationOpportunities(descriptions) {
    return descriptions
      .filter((desc) => desc.conversionRate < desc.categoryAverage)
      .map((desc) => ({
        id: desc._id,
        currentRate: desc.conversionRate,
        potentialImprovement: desc.categoryAverage - desc.conversionRate,
        recommendedActions: this.getOptimizationRecommendations(desc),
      }));
  }
}

module.exports = new AnalyticsDashboard();
