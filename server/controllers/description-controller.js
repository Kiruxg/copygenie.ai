const OpenAI = require("openai");
const { User, Description } = require("../models");
const checkTrial = require("../middleware/trial-check");

const PERSONALITIES = {
  STEVE_JOBS: {
    prompt:
      "You are Steve Jobs introducing a revolutionary product. Use his iconic style: simple yet powerful words, build anticipation, focus on how it changes everything. Make every feature sound revolutionary.",
    style: "revolutionary, minimalist, visionary",
  },
  GARY_HALBERT: {
    prompt:
      "You are Gary Halbert writing a compelling sales letter. Use his direct response style: strong headlines, emotional triggers, clear benefits, urgent calls to action. Focus on the most compelling unique selling proposition.",
    style: "direct response, persuasive, emotional",
  },
  OGILVY: {
    prompt:
      "You are David Ogilvy writing timeless copy. Use his sophisticated style: research-backed claims, long-form storytelling, and brand building. Focus on facts and unique product qualities.",
    style: "sophisticated, factual, brand-focused",
  },
  KONDO: {
    prompt:
      "You are Marie Kondo describing a product that sparks joy. Focus on how it simplifies life, brings happiness, and creates harmony. Use a gentle, mindful tone.",
    style: "minimalist, joyful, mindful",
  },
  RAMSAY: {
    prompt:
      "You are Gordon Ramsay describing a perfect product. Be passionate, direct, and occasionally use his signature expressions. Focus on quality and excellence.",
    style: "passionate, direct, bold",
  },
};

class DescriptionController {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set in environment variables");
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateDescription(req, res) {
    try {
      // Check trial/subscription status
      const trialStatus = await this.checkTrialStatus(req.user.id);

      if (!trialStatus.active && !req.user.hasActiveSubscription) {
        return res.status(402).json({
          success: false,
          error: trialStatus.trialEnded
            ? "Your trial has ended. Please subscribe to continue."
            : "Please start your free trial to use CopyGenie",
          trialEnded: trialStatus.trialEnded,
          trialDaysLeft: trialStatus.daysLeft,
        });
      }

      // Check monthly generation limit
      const monthlyLimit = 50;
      const currentMonth = new Date().getMonth();
      const userUsage = await this.getUserMonthlyUsage(
        req.user.id,
        currentMonth
      );

      if (userUsage >= monthlyLimit) {
        return res.status(429).json({
          success: false,
          error:
            "Monthly generation limit reached. Resets on the 1st of next month.",
          remainingTokens: monthlyLimit - userUsage,
        });
      }

      console.log("Received request:", req.body);
      const { productName, personality, features } = req.body;

      if (!productName) {
        return res.status(400).json({
          success: false,
          error: "Product name is required",
        });
      }

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `${PERSONALITIES[personality].prompt} Write in a ${PERSONALITIES[personality].style} style.`,
          },
          {
            role: "user",
            content: `Create a complete product listing for: ${productName}
            ${features?.length ? `\nKey Features:\n${features.join("\n")}` : ""}
            
            Provide the following in JSON format:
            {
                "seoTitle": "60 char max title",
                "metaDescription": "155 char max description",
                "productDescription": "300-500 word description",
                "features": ["feature 1", "feature 2", ...],
                "keywords": ["keyword1", "keyword2", ...]
            }`,
          },
        ],
        response_format: { type: "json_object" },
      });

      // Track usage
      await this.incrementUserUsage(req.user.id);

      const generatedContent = JSON.parse(
        completion.choices[0].message.content
      );

      // Add trial info to response
      res.json({
        success: true,
        data: generatedContent,
        remainingTokens: monthlyLimit - (userUsage + 1),
        trial: {
          daysLeft: trialStatus.daysLeft,
          active: trialStatus.active,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate description",
      });
    }
  }

  async generateProductPackage(productName, existingFeatures = [], tone) {
    console.log("Generating product package for:", productName);

    try {
      // First, generate key features if not provided
      let features = existingFeatures;
      if (features.length === 0) {
        console.log("Generating key features for:", productName);
        features = await this.generateKeyFeatures(productName);
      }

      // Generate complete package using features
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert e-commerce copywriter and SEO specialist. Create a complete product listing package using a ${tone} tone.`,
          },
          {
            role: "user",
            content: `Create a complete product listing for: ${productName}

                        Key Features:
                        ${features.join("\n")}

                        Provide:
                        1. SEO-optimized title (max 60 chars)
                        2. Meta description (max 155 chars)
                        3. Product description (300-500 words)
                        4. Key selling points
                        5. Target keywords (primary and secondary)
                        
                        Format the response in JSON.`,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content);
      console.log("Generated product package successfully");

      return result;
    } catch (error) {
      console.error("Error generating product package:", error);
      throw error;
    }
  }

  async generateKeyFeatures(productName) {
    console.log("Generating key features for:", productName);

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert product analyst. Generate compelling key features that would help sell this product.",
          },
          {
            role: "user",
            content: `I need key features that would sell a ${productName}. 
                        Provide 5-7 unique selling points that highlight the product's benefits.
                        Format as a simple array of strings.`,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content);
      console.log("Generated features:", result.features);

      return result.features;
    } catch (error) {
      console.error("Error generating features:", error);
      throw error;
    }
  }

  async saveDescription(userId, productPackage) {
    console.log("Saving description to database");

    try {
      const description = await Description.create({
        userId,
        productName: productPackage.productName,
        seoTitle: productPackage.seoTitle,
        metaDescription: productPackage.metaDescription,
        description: productPackage.productDescription,
        features: productPackage.features,
        keywords: productPackage.keywords,
        generatedAt: new Date(),
      });

      console.log("Description saved successfully:", description.id);
      return description;
    } catch (error) {
      console.error("Error saving description:", error);
      throw error;
    }
  }

  calculateDuration(startTime) {
    const endTime = process.hrtime(startTime);
    return endTime[0] * 1000 + endTime[1] / 1e6;
  }

  async checkUserLimits(userId) {
    console.log("Checking user limits for:", userId);

    try {
      const user = await User.findById(userId);
      const currentMonth = new Date().getMonth();

      const monthlyUsage = await Description.countDocuments({
        userId,
        createdAt: {
          $gte: new Date(new Date().setMonth(currentMonth)),
        },
      });

      console.log("Monthly usage:", {
        userId,
        usage: monthlyUsage,
        tier: user.tier,
      });

      const limits = {
        free: 5,
        pro: 50,
        business: Infinity,
      };

      if (monthlyUsage >= limits[user.tier]) {
        console.warn("User reached limit:", {
          userId,
          tier: user.tier,
          usage: monthlyUsage,
          limit: limits[user.tier],
        });

        throw new Error("Monthly description limit reached");
      }

      // Instead of WebSocket notification, we'll return a warning flag
      // that the frontend can use to show a toast
      return {
        currentUsage: monthlyUsage,
        limit: limits[user.tier],
        remaining: limits[user.tier] - monthlyUsage,
        showWarning: monthlyUsage >= limits[user.tier] - 2,
      };
    } catch (error) {
      console.error("Error checking user limits:", {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async trackUsage(userId) {
    // Track usage for analytics
    console.log(`Usage tracked for user: ${userId}`);
  }

  async getUserMonthlyUsage(userId, month) {
    // TODO: Implement usage tracking
    return 0; // Placeholder
  }

  async incrementUserUsage(userId) {
    // TODO: Implement usage increment
    console.log(`Usage incremented for user: ${userId}`);
  }

  async checkTrialStatus(userId) {
    try {
      const user = await User.findById(userId);

      // If user has never started trial
      if (!user.trialStartDate) {
        return {
          active: false,
          trialEnded: false,
          daysLeft: 7,
        };
      }

      const now = new Date();
      const trialEnd = new Date(user.trialStartDate);
      trialEnd.setDate(trialEnd.getDate() + 7);

      const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

      return {
        active: daysLeft > 0,
        trialEnded: daysLeft <= 0,
        daysLeft: Math.max(0, daysLeft),
      };
    } catch (error) {
      console.error("Error checking trial status:", error);
      throw error;
    }
  }

  async startTrial(userId) {
    try {
      const user = await User.findById(userId);

      // Don't allow restart of trial
      if (user.trialStartDate) {
        throw new Error("Trial has already been started");
      }

      user.trialStartDate = new Date();
      await user.save();

      return {
        success: true,
        trialStartDate: user.trialStartDate,
        daysLeft: 7,
      };
    } catch (error) {
      console.error("Error starting trial:", error);
      throw error;
    }
  }
}

module.exports = DescriptionController;
