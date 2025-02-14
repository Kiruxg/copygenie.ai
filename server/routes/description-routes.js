const express = require('express');
const router = express.Router();
const DescriptionController = require('../controllers/description-controller');
const descriptionController = new DescriptionController();

// Use the instance in your routes
router.post('/generate', (req, res) => descriptionController.generateDescription(req, res));

module.exports = router; 