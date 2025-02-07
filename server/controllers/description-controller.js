const { TieredToneMatcher } = require("../services/tiered-tone-matcher");
const { ErrorHandler } = require("../services/error-handler");
const { MonitoringService } = require("../services/monitoring-service");
const { NotificationManager } = require("../services/notification-manager");
const { User, Description } = require("../models");

class DescriptionController {
  async generateDescription(req, res) {
    console.log("Starting description generation request:", {
      userId: req.user?.id,
      productData: req.body,
    });

    const startTime = process.hrtime();

    try {
      // Validate user and input
      if (!req.user) {
        console.error("No user found in request");
        throw new Error("Authentication required");
      }

      if (!req.body.productName || !req.body.features) {
        console.error("Missing required fields:", req.body);
        throw new Error("Product name and features are required");
      }

      // Check user limits
      const userUsage = await this.checkUserLimits(req.user.id);
      console.log("User usage check:", userUsage);

      // Generate description
      const description = await this.processDescription(req.user, req.body);

      // Track successful generation
      await MonitoringService.trackDescription(req.user.id, "success");

      // Calculate response time
      const endTime = process.hrtime(startTime);
      const duration = endTime[0] * 1000 + endTime[1] / 1e6; // in milliseconds

      console.log("Description generated successfully:", {
        userId: req.user.id,
        duration: `${duration}ms`,
        descriptionId: description.id,
      });

      // Send success notification
      await NotificationManager.sendSuccessNotification(
        req.user.id,
        "Description generated successfully!"
      );

      res.json({
        success: true,
        description: description,
      });
    } catch (error) {
      console.error("Description generation failed:", {
        userId: req.user?.id,
        error: error.message,
        stack: error.stack,
      });

      // Track error
      await MonitoringService.trackDescription(req.user?.id, "error");

      // Handle error and get user-friendly response
      const errorResponse = await ErrorHandler.handleError(
        error,
        req.user?.id,
        {
          productData: req.body,
          endpoint: "generateDescription",
        }
      );

      // Send error notification
      await NotificationManager.sendErrorNotification(
        req.user?.id,
        errorResponse
      );

      res.status(errorResponse.code).json({
        success: false,
        error: errorResponse.message,
        errorId: errorResponse.errorId,
      });
    }
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

      // Notify user when approaching limit
      if (monthlyUsage >= limits[user.tier] - 2) {
        await NotificationManager.sendUsageLimitNotification(
          userId,
          monthlyUsage
        );
      }

      return {
        currentUsage: monthlyUsage,
        limit: limits[user.tier],
        remaining: limits[user.tier] - monthlyUsage,
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

  async processDescription(user, productData) {
    console.log("Processing description:", {
      userId: user.id,
      productName: productData.productName,
    });

    try {
      // Get tone matcher instance
      const toneMatcher = new TieredToneMatcher();

      // Generate description with appropriate tier features
      const generatedContent = await toneMatcher.generateDescription(
        productData,
        productData.tone || "professional",
        user.tier
      );

      console.log("Description generated:", {
        userId: user.id,
        descriptionLength: generatedContent.description.length,
        tone: productData.tone,
      });

      // Save to database
      const description = await Description.create({
        userId: user.id,
        productName: productData.productName,
        content: generatedContent.description,
        features: productData.features,
        tone: productData.tone,
        targetMarket: productData.targetMarket,
        metadata: {
          generationTime: new Date(),
          userTier: user.tier,
          toneAnalysis: generatedContent.toneAnalysis,
        },
      });

      console.log("Description saved to database:", {
        userId: user.id,
        descriptionId: description.id,
      });

      return description;
    } catch (error) {
      console.error("Error processing description:", {
        userId: user.id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

module.exports = new DescriptionController();
