const express = require('express');
const router = express.Router();

const aiAssistantController = require('../controllers/aiAssistant.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// AI Alumni Search Assistant Query Endpoint
router.post('/query', verifyToken, aiAssistantController.queryAlumniAssistant);

module.exports = router;
