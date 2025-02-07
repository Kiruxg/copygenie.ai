const { OpenAI } = require("openai");
const mongoose = require("mongoose");

class AIPersonalizationEngine {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.learningRate = 0.1;
  }

  async personalizeDescription(params) {
    const {
      productData,
      industryMetrics,
      userHistory,
      marketplaceData,
      targetAudience,
    } = params;

    // Get successful patterns from user's history
    const successPatterns = await this.analyzeSuccessPatterns(userHistory);

    // Analyze market performance
    const marketInsights = await this.getMarketInsights(marketplaceData);

    // Generate personalized prompt
    const prompt = this.createPersonalizedPrompt({
      productData,
      successPatterns,
      marketInsights,
      targetAudience,
    });

    // Generate optimized description
    const description = await this.generateOptimizedDescription(prompt);

    // Store learning data
    await this.storeLearningData({
      prompt,
      description,
      successPatterns,
      marketInsights,
    });

    return {
      description,
      insights: {
        targetKeywords: marketInsights.keywords,
        emotionalTriggers: marketInsights.emotionalTriggers,
        conversionOptimizations: marketInsights.conversionPoints,
      },
    };
  }

  async analyzeSuccessPatterns(userHistory) {
    // Analyze patterns in successful descriptions
    const patterns = await this.extractPatterns(userHistory);
    return {
      highPerformingStructures: patterns.structures,
      effectiveKeywords: patterns.keywords,
      conversionTriggers: patterns.triggers,
    };
  }

  async getMarketInsights(marketplaceData) {
    // Analyze current market trends and performance
    return {
      keywords: await this.extractTrendingKeywords(marketplaceData),
      emotionalTriggers: await this.identifyEmotionalTriggers(marketplaceData),
      conversionPoints: await this.analyzeConversionFactors(marketplaceData),
    };
  }

  createPersonalizedPrompt(data) {
    return {
      basePrompt: this.generateBasePrompt(data),
      marketContext: this.addMarketContext(data.marketInsights),
      successElements: this.incorporateSuccessPatterns(data.successPatterns),
      audienceOptimization: this.optimizeForAudience(data.targetAudience),
    };
  }

  async generateOptimizedDescription(prompt) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert in creating highly converting product descriptions that incorporate market insights and emotional triggers.",
          },
          {
            role: "user",
            content: this.formatPrompt(prompt),
          },
        ],
        temperature: 0.7,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error("AI generation error:", error);
      throw error;
    }
  }

  async storeLearningData(data) {
    // Store data for continuous learning
    await mongoose.model("LearningData").create({
      prompt: data.prompt,
      description: data.description,
      patterns: data.successPatterns,
      marketInsights: data.marketInsights,
      timestamp: new Date(),
    });
  }

  formatPrompt(promptData) {
    return `
            Create a product description with these requirements:
            
            Product Context:
            ${promptData.basePrompt}
            
            Market Insights:
            ${promptData.marketContext}
            
            Proven Success Elements:
            ${promptData.successElements}
            
            Target Audience Optimization:
            ${promptData.audienceOptimization}
            
            Additional Requirements:
            - Incorporate emotional triggers: ${promptData.emotionalTriggers}
            - Focus on conversion points: ${promptData.conversionPoints}
            - Use high-performing keywords naturally
            - Maintain brand voice and authenticity
        `;
  }
}

module.exports = new AIPersonalizationEngine();
