const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const redis = require("../config/redis");

// Create different limiters based on subscription tier
const createRateLimiter = (tier) => {
  const limits = {
    free: { windowMs: 30 * 24 * 60 * 60 * 1000, max: 5 }, // 5 requests per month
    pro: { windowMs: 30 * 24 * 60 * 60 * 1000, max: 50 }, // 50 requests per month
    business: { windowMs: 30 * 24 * 60 * 60 * 1000, max: Infinity }, // Unlimited requests
  };

  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: `rate-limit:${tier}:`,
    }),
    ...limits[tier],
    message: {
      error: "Monthly description limit reached.",
      upgradeMessage:
        tier === "free"
          ? "Upgrade to Pro for 50 descriptions per month!"
          : tier === "pro"
          ? "Upgrade to Business for unlimited descriptions!"
          : null,
    },
  });
};

// Middleware to apply rate limiting based on user's subscription
const rateLimiter = async (req, res, next) => {
  const tier = req.user?.subscriptionTier || "free";
  const limiter = createRateLimiter(tier);
  return limiter(req, res, next);
};

module.exports = rateLimiter;
