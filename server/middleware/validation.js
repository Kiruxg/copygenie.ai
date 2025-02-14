const { body, validationResult } = require("express-validator");

const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const productDescriptionRules = [
  body("productName").trim().notEmpty().escape(),
  body("features").trim().notEmpty().escape(),
  body("tone").isIn(["professional", "casual", "fun", "technical"]),
];

const seoKeywordsRules = [
  body("productName").trim().notEmpty().escape(),
  body("category").trim().notEmpty().escape(),
  body("targetMarket").trim().notEmpty().escape(),
];

// Registration validation rules
const validateRegistration = [
  body("email").isEmail().normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  validateInput,
];

// Login validation rules
const validateLogin = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
  validateInput,
];

module.exports = {
  validateInput,
  productDescriptionRules,
  seoKeywordsRules,
  validateRegistration,
  validateLogin,
};
