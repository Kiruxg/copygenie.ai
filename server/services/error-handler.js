const Sentry = require("@sentry/node");
const { OpenAI } = require("openai");
const { User } = require("../models");

class ErrorHandler {
  constructor() {
    // Initialize error tracking
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.criticalErrors = new Set([
      "OPENAI_API_ERROR",
      "DATABASE_CONNECTION_ERROR",
      "RATE_LIMIT_EXCEEDED",
      "SUBSCRIPTION_PAYMENT_FAILED",
    ]);
  }

  async handleError(error, userId = null, context = {}) {
    const errorId = this.generateErrorId();
    const errorType = this.categorizeError(error);

    // Log error with context
    const errorLog = {
      id: errorId,
      type: errorType,
      message: error.message,
      stack: error.stack,
      userId,
      context,
      timestamp: new Date(),
      environment: process.env.NODE_ENV,
    };

    // Track in Sentry
    Sentry.captureException(error, {
      user: userId ? { id: userId } : undefined,
      extra: context,
    });

    // Handle based on error type
    await this.handleByType(errorType, errorLog);

    // Return user-friendly response
    return this.getUserResponse(errorType, errorId);
  }

  categorizeError(error) {
    if (error.name === "OpenAIError") return "OPENAI_API_ERROR";
    if (error.name === "MongooseError") return "DATABASE_ERROR";
    if (error.code === 429) return "RATE_LIMIT_EXCEEDED";
    if (error.name === "ValidationError") return "VALIDATION_ERROR";
    if (error.name === "AuthenticationError") return "AUTH_ERROR";
    return "UNKNOWN_ERROR";
  }

  async handleByType(errorType, errorLog) {
    // Handle critical errors
    if (this.criticalErrors.has(errorType)) {
      await this.handleCriticalError(errorType, errorLog);
      return;
    }

    // Store error in database
    await this.storeError(errorLog);

    // Trigger automated recovery if possible
    await this.attemptRecovery(errorType, errorLog);
  }

  async handleCriticalError(errorType, errorLog) {
    // Alert DevOps
    await this.alertDevOps(errorType, errorLog);

    // Attempt failover for critical services
    await this.triggerFailover(errorType);

    // Log critical error
    await this.storeCriticalError(errorLog);
  }

  async attemptRecovery(errorType, errorLog) {
    switch (errorType) {
      case "OPENAI_API_ERROR":
        return await this.handleAIFailover(errorLog);
      case "RATE_LIMIT_EXCEEDED":
        return await this.handleRateLimitRecovery(errorLog);
      case "DATABASE_ERROR":
        return await this.handleDatabaseRecovery(errorLog);
      default:
        return false;
    }
  }

  async handleAIFailover(errorLog) {
    try {
      // Attempt to use backup AI service or different model
      const backupResponse = await this.useBackupAIService(errorLog.context);

      if (backupResponse) {
        await this.updateErrorResolution(errorLog.id, "Failover successful");
        return true;
      }
    } catch (error) {
      await this.updateErrorResolution(errorLog.id, "Failover failed");
      return false;
    }
  }

  getUserResponse(errorType, errorId) {
    const responses = {
      OPENAI_API_ERROR: {
        message:
          "We're experiencing temporary issues with our AI service. Please try again in a moment.",
        code: 503,
      },
      RATE_LIMIT_EXCEEDED: {
        message:
          "You've reached your usage limit. Please upgrade your plan or try again later.",
        code: 429,
      },
      VALIDATION_ERROR: {
        message: "Please check your input and try again.",
        code: 400,
      },
      AUTH_ERROR: {
        message: "Authentication failed. Please log in again.",
        code: 401,
      },
      DATABASE_ERROR: {
        message:
          "We're experiencing technical difficulties. Please try again later.",
        code: 500,
      },
      UNKNOWN_ERROR: {
        message: "An unexpected error occurred. Our team has been notified.",
        code: 500,
      },
    };

    return {
      ...responses[errorType],
      errorId,
      supportReference: this.generateSupportReference(errorId),
    };
  }

  async alertDevOps(errorType, errorLog) {
    // Send alerts through multiple channels
    await Promise.all([
      this.sendSlackAlert(errorType, errorLog),
      this.sendPagerDuty(errorType, errorLog),
      this.sendEmailAlert(errorType, errorLog),
    ]);
  }

  generateSupportReference(errorId) {
    return `CG-${errorId.substring(0, 8).toUpperCase()}`;
  }

  async storeError(errorLog) {
    // Store in database for analysis
    await ErrorLog.create(errorLog);

    // Update error statistics
    await this.updateErrorStats(errorLog.type);
  }
}

module.exports = new ErrorHandler();
