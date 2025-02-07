const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { User } = require("../models");

class SubscriptionService {
  constructor() {
    this.plans = {
      free: {
        features: [
          "Basic SEO",
          "5 descriptions/month",
          "Basic analytics",
          "1 project",
        ],
        limits: {
          descriptions: 5,
          projects: 1,
        },
      },
      pro: {
        features: [
          "Advanced SEO",
          "50 descriptions/month",
          "Advanced analytics",
          "Unlimited projects",
          "Priority support",
        ],
        limits: {
          descriptions: 50,
          projects: Infinity,
        },
      },
      business: {
        features: [
          "Enterprise SEO",
          "Unlimited descriptions",
          "Custom analytics",
          "Unlimited projects",
          "Dedicated support",
          "Custom AI training",
        ],
        limits: {
          descriptions: Infinity,
          projects: Infinity,
        },
      },
    };
  }

  // ... rest of the subscription service code ...
}
