const chai = require("chai");
const chaiHttp = require("chai-http");
const expect = chai.expect;
const app = require("../app");
const { User, Description } = require("../models");
const {
  TieredToneMatcher,
  AIPersonalizationEngine,
  AdvancedI18nService,
  AnalyticsDashboard,
} = require("../services");

chai.use(chaiHttp);

describe("CopyGenie Integration Tests", () => {
  // Test user data
  const testUsers = {
    free: { email: "free@test.com", tier: "free" },
    pro: { email: "pro@test.com", tier: "pro" },
    business: { email: "business@test.com", tier: "business" },
  };

  before(async () => {
    // Setup test database
    await setupTestDatabase();
  });

  describe("Core Features", () => {
    it("should generate descriptions with correct tier limitations", async () => {
      for (const [tier, user] of Object.entries(testUsers)) {
        const response = await chai
          .request(app)
          .post("/api/descriptions/generate")
          .send({
            userId: user.id,
            productData: {
              name: "Test Product",
              features: ["Feature 1", "Feature 2"],
            },
          });

        expect(response).to.have.status(200);
        expect(response.body.description).to.exist;
        validateTierFeatures(response.body, tier);
      }
    });

    it("should enforce monthly description limits", async () => {
      const limits = { free: 5, pro: 50, business: Infinity };

      for (const [tier, user] of Object.entries(testUsers)) {
        const results = await generateMultipleDescriptions(
          user.id,
          limits[tier] + 1
        );
        validateUsageLimits(results, tier);
      }
    });
  });

  describe("Smart Tone Matcher", () => {
    it("should provide appropriate tone options per tier", async () => {
      for (const [tier, user] of Object.entries(testUsers)) {
        const response = await chai
          .request(app)
          .get("/api/tones/available")
          .query({ userId: user.id });

        validateToneOptions(response.body, tier);
      }
    });
  });

  describe("Internationalization", () => {
    it("should handle translations appropriately", async () => {
      const testCases = [
        { language: "en", region: "US" },
        { language: "es", region: "ES" },
        { language: "fr", region: "FR" },
      ];

      for (const testCase of testCases) {
        const response = await testTranslation(testCase);
        validateTranslation(response, testCase);
      }
    });
  });

  describe("Analytics Dashboard", () => {
    it("should provide tier-appropriate analytics", async () => {
      for (const [tier, user] of Object.entries(testUsers)) {
        const response = await chai
          .request(app)
          .get("/api/analytics/dashboard")
          .query({ userId: user.id });

        validateAnalytics(response.body, tier);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle rate limiting correctly", async () => {
      const response = await testRateLimiting();
      expect(response).to.have.status(429);
    });

    it("should handle invalid inputs gracefully", async () => {
      const response = await testInvalidInputs();
      expect(response).to.have.status(400);
    });
  });
});

// Test helper functions
async function setupTestDatabase() {
  await User.deleteMany({});
  await Description.deleteMany({});

  for (const [tier, userData] of Object.entries(testUsers)) {
    const user = await User.create({
      email: userData.email,
      tier: tier,
      subscriptionStatus: "active",
    });
    testUsers[tier].id = user._id;
  }
}

function validateTierFeatures(response, tier) {
  const tierFeatures = {
    free: ["basicToneMatching"],
    pro: ["advancedToneMatching", "toneAnalysis"],
    business: ["smartToneMatching", "brandVoiceLearning"],
  };

  for (const feature of tierFeatures[tier]) {
    expect(response.features[feature]).to.be.true;
  }
}

async function generateMultipleDescriptions(userId, count) {
  const results = [];
  for (let i = 0; i < count; i++) {
    try {
      const response = await chai
        .request(app)
        .post("/api/descriptions/generate")
        .send({
          userId,
          productData: { name: `Test Product ${i}` },
        });
      results.push(response);
    } catch (error) {
      results.push(error.response);
    }
  }
  return results;
}

function validateUsageLimits(results, tier) {
  const limits = { free: 5, pro: 50, business: Infinity };
  const successfulRequests = results.filter((r) => r.status === 200);
  expect(successfulRequests.length).to.be.at.most(limits[tier]);
}

function validateToneOptions(response, tier) {
  const expectedCounts = {
    free: 3,
    pro: 7,
    business: 11,
  };
  expect(response.tones.length).to.equal(expectedCounts[tier]);
}

async function testTranslation(testCase) {
  return await chai.request(app).post("/api/descriptions/translate").send({
    description: "Test product description",
    language: testCase.language,
    region: testCase.region,
  });
}

function validateTranslation(response, testCase) {
  expect(response).to.have.status(200);
  expect(response.body.translated).to.exist;
  expect(response.body.language).to.equal(testCase.language);
}

function validateAnalytics(response, tier) {
  const expectedFeatures = {
    free: ["basic"],
    pro: ["basic", "advanced"],
    business: ["basic", "advanced", "predictive"],
  };

  for (const feature of expectedFeatures[tier]) {
    expect(response.analytics[feature]).to.exist;
  }
}
