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
const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/email");
const { authenticateToken } = require("../middleware/auth");

// Add to the beginning of your routes that require authentication
router.use(authenticateToken);

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
router.post("/login", rateLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

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
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
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

// Quick signup endpoint
router.post("/quick-signup", validateRegistration, async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        error: "Email already registered",
        isVerified: user.isVerified,
      });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create new user
    user = new User({
      email,
      verificationToken,
      generationsRemaining: 5,
      plan: "free",
      isVerified: false,
    });

    await user.save();

    res.json({
      success: true,
      redirectUrl: "/generator",
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Signup failed" });
  }
});

// Resend verification endpoint
router.post("/resend-verification", async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    // Send new verification email
    await sendVerificationEmail(user.email, verificationToken);

    res.json({ success: true });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ error: "Failed to resend verification email" });
  }
});

// Email verification endpoint
router.get("/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) {
      return res.redirect("/verification-failed");
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.redirect("/generator");
  } catch (error) {
    console.error("Verification error:", error);
    res.redirect("/verification-failed");
  }
});

module.exports = router;
