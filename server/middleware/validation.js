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

module.exports = {
  validateInput,
  productDescriptionRules,
  seoKeywordsRules,
};
