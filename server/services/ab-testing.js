class ABTestingService {
  constructor() {
    this.tests = new Map();
  }

  async createTest(projectId, variants) {
    const test = {
      id: Date.now().toString(),
      projectId,
      variants: variants.map((variant) => ({
        ...variant,
        impressions: 0,
        conversions: 0,
      })),
      startDate: new Date(),
      status: "active",
    };

    this.tests.set(test.id, test);
    return test;
  }

  async trackImpression(testId, variantId) {
    const test = this.tests.get(testId);
    if (test) {
      const variant = test.variants.find((v) => v.id === variantId);
      if (variant) {
        variant.impressions++;
        await this.updateTestStats(testId);
      }
    }
  }

  async trackConversion(testId, variantId) {
    const test = this.tests.get(testId);
    if (test) {
      const variant = test.variants.find((v) => v.id === variantId);
      if (variant) {
        variant.conversions++;
        await this.updateTestStats(testId);
      }
    }
  }

  async getTestResults(testId) {
    const test = this.tests.get(testId);
    if (!test) return null;

    return test.variants.map((variant) => ({
      id: variant.id,
      description: variant.description,
      impressions: variant.impressions,
      conversions: variant.conversions,
      conversionRate:
        variant.impressions > 0
          ? (variant.conversions / variant.impressions) * 100
          : 0,
    }));
  }

  async updateTestStats(testId) {
    // Update test statistics in database
  }
}

module.exports = new ABTestingService();
