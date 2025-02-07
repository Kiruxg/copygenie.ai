const { OpenAI } = require("openai");
const { BrandVoice } = require("../models/brand-voice");

class TieredToneMatcher {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Basic tones available for free users
    this.freeTones = {
      professional: ["formal", "trustworthy"],
      casual: ["friendly", "simple"],
      enthusiastic: ["energetic", "positive"],
    };

    // Additional tones for pro users
    this.proTones = {
      ...this.freeTones,
      luxury: ["sophisticated", "premium"],
      technical: ["precise", "detailed"],
      playful: ["fun", "engaging"],
      minimalist: ["clean", "direct"],
    };

    // Full suite for business users
    this.businessTones = {
      ...this.proTones,
      persuasive: ["compelling", "influential"],
      educational: ["informative", "expert"],
      empathetic: ["understanding", "caring"],
      authoritative: ["confident", "leading"],
    };
  }

  async generateDescription(productData, tone, userTier = "free") {
    // Validate tone availability for user tier
    this.validateToneAccess(tone, userTier);

    // Get tier-specific features
    const tierFeatures = this.getTierFeatures(userTier);

    try {
      const description = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(userTier, tone),
          },
          {
            role: "user",
            content: this.createPrompt(productData, tone, tierFeatures),
          },
        ],
        temperature: 0.7,
      });

      return {
        description: description.choices[0].message.content,
        toneAnalysis:
          userTier !== "free"
            ? await this.analyzeTone(description.choices[0].message.content)
            : null,
        features: tierFeatures,
      };
    } catch (error) {
      console.error("Tone generation error:", error);
      throw error;
    }
  }

  validateToneAccess(tone, userTier) {
    const availableTones = {
      free: this.freeTones,
      pro: this.proTones,
      business: this.businessTones,
    }[userTier];

    if (!availableTones || !Object.keys(availableTones).includes(tone)) {
      throw new Error(
        `Tone '${tone}' not available for ${userTier} tier. Please upgrade or choose from: ${Object.keys(
          availableTones
        ).join(", ")}`
      );
    }
  }

  getTierFeatures(tier) {
    return {
      free: {
        basicToneMatching: true,
        toneOptions: Object.keys(this.freeTones).length,
        customization: false,
      },
      pro: {
        advancedToneMatching: true,
        toneOptions: Object.keys(this.proTones).length,
        customization: true,
        toneAnalysis: true,
      },
      business: {
        smartToneMatching: true,
        toneOptions: Object.keys(this.businessTones).length,
        customization: true,
        toneAnalysis: true,
        brandVoiceLearning: true,
        marketplaceOptimization: true,
      },
    }[tier];
  }

  getSystemPrompt(tier, tone) {
    const basePrompt =
      "You are an expert copywriter specializing in product descriptions.";

    const tierPrompts = {
      free: `${basePrompt} Create a simple, effective description using a ${tone} tone.`,
      pro: `${basePrompt} Create an optimized description using advanced ${tone} tone matching and marketplace best practices.`,
      business: `${basePrompt} Create a highly optimized description using smart tone matching, brand voice analysis, and advanced marketplace optimization for the ${tone} tone.`,
    };

    return tierPrompts[tier];
  }

  createPrompt(productData, tone, features) {
    return `
            Product Information:
            ${JSON.stringify(productData)}

            Tone: ${tone}

            ${
              features.customization
                ? "Custom Requirements: " + productData.customRequirements
                : ""
            }
            ${
              features.marketplaceOptimization
                ? "Marketplace: " + productData.marketplace
                : ""
            }

            Guidelines:
            1. Maintain consistent ${tone} tone
            2. Focus on key product benefits
            3. Use clear, compelling language
            ${
              features.marketplaceOptimization
                ? "4. Optimize for marketplace requirements"
                : ""
            }
            ${
              features.brandVoiceLearning
                ? "5. Incorporate brand voice patterns"
                : ""
            }
        `;
  }

  async analyzeTone(description) {
    if (!description) return null;

    const analysis = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Analyze the tone and style of this product description.",
        },
        {
          role: "user",
          content: description,
        },
      ],
    });

    return {
      toneStrength: this.calculateToneStrength(
        analysis.choices[0].message.content
      ),
      consistency: this.checkConsistency(analysis.choices[0].message.content),
      suggestions: this.generateSuggestions(
        analysis.choices[0].message.content
      ),
    };
  }
}

module.exports = new TieredToneMatcher();
