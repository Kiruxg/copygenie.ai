class ErrorHandler {
  constructor() {
    this.errorTypes = {
      OPENAI_API_ERROR: "OpenAI API Error",
      VALIDATION_ERROR: "Validation Error",
      SERVER_ERROR: "Server Error",
    };
  }

  async handleError(error, userId = null, context = {}) {
    const errorId = this.generateErrorId();
    const errorType = this.categorizeError(error);

    // Log error details
    console.error("Error occurred:", {
      id: errorId,
      type: errorType,
      message: error.message,
      userId,
      context,
      stack: error.stack,
    });

    // Return user-friendly error response
    return {
      code: this.getHttpStatusCode(errorType),
      message: this.getUserMessage(errorType),
      errorId,
    };
  }

  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  categorizeError(error) {
    if (error.message.includes("OpenAI"))
      return this.errorTypes.OPENAI_API_ERROR;
    if (error.message.includes("validation"))
      return this.errorTypes.VALIDATION_ERROR;
    return this.errorTypes.SERVER_ERROR;
  }

  getHttpStatusCode(errorType) {
    switch (errorType) {
      case this.errorTypes.VALIDATION_ERROR:
        return 400;
      case this.errorTypes.OPENAI_API_ERROR:
        return 503;
      default:
        return 500;
    }
  }

  getUserMessage(errorType) {
    switch (errorType) {
      case this.errorTypes.OPENAI_API_ERROR:
        return "Unable to generate description. Please try again later.";
      case this.errorTypes.VALIDATION_ERROR:
        return "Please check your input and try again.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }
}

module.exports = new ErrorHandler();
