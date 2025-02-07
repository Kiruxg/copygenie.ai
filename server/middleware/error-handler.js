const { ValidationError } = require("../utils/errors");

// Central error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: err.message,
      fields: err.fields,
    });
  }

  // JWT authentication errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "INVALID_TOKEN",
      message: "Invalid authentication token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "TOKEN_EXPIRED",
      message: "Authentication token has expired",
    });
  }

  // Rate limiting errors
  if (err.type === "TOO_MANY_REQUESTS") {
    return res.status(429).json({
      error: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again later",
      retryAfter: err.retryAfter,
    });
  }

  // Database errors
  if (err.code === "23505") {
    // Unique violation in PostgreSQL
    return res.status(409).json({
      error: "DUPLICATE_ENTRY",
      message: "This record already exists",
    });
  }

  // Default error response
  return res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
};

module.exports = errorHandler;
