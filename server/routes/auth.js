const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { body } = require("express-validator");
const {
  validateInput,
  validateRegistration,
  validateLogin,
} = require("../middleware/validation");
const { rateLimiter } = require("../middleware/rate-limiter");

// Add to the beginning of your routes that require authentication
router.use(require("../middleware/auth").authenticateToken);

// Validation rules
const authRules = {
  register: [
    body("email").isEmail().normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  login: [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
};

// Register new user
router.post(
  "/register",
  rateLimiter,
  validateRegistration,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create new user
      const user = new User({ email, password });
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, plan: user.plan },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(201).json({
        token,
        user: {
          email: user.email,
          plan: user.plan,
          usageCount: user.usageCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Login user
router.post("/login", rateLimiter, validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, plan: user.plan },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        email: user.email,
        plan: user.plan,
        usageCount: user.usageCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get user profile
router.get(
  "/profile",
  require("../middleware/auth").authenticateToken,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.userId).select("-password");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  }
);

router.post("/forgot-password", rateLimiter, async (req, res, next) => {
  try {
    // Password reset logic here
  } catch (error) {
    next(error);
  }
});

module.exports = router;
