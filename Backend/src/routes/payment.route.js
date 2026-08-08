const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/payment.controller');
const eventController = require('../controllers/event.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// User Payment & Registration History
router.get(
  '/history',
  verifyToken,
  eventController.getUserPaymentHistory,
);

// Stripe Webhook Endpoint
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleStripeWebhook,
);

module.exports = router;
