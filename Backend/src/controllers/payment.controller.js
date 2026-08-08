const Stripe = require('stripe');
const eventModel = require('../models/event.model');

const handleStripeWebhook = (req, res) => {
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const stripeSessionId = session.id;
    const paymentIntentId = session.payment_intent || null;

    eventModel.updateRegistrationPaymentStatus(
      stripeSessionId,
      paymentIntentId,
      'PAID',
      'REGISTERED',
      (err) => {
        if (err) {
          console.error('Webhook DB update error (completed):', err);
        }
        return res.status(200).json({ received: true });
      },
    );
  } else if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    const stripeSessionId = session.id;

    eventModel.updateRegistrationPaymentStatus(
      stripeSessionId,
      null,
      'FAILED',
      'FAILED',
      (err) => {
        if (err) {
          console.error('Webhook DB update error (expired):', err);
        }
        return res.status(200).json({ received: true });
      },
    );
  } else {
    return res.status(200).json({ received: true });
  }
};

module.exports = {
  handleStripeWebhook,
};
