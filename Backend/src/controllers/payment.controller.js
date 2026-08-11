const Stripe = require('stripe');
const eventModel = require('../models/event.model');
const notificationService = require('../services/notification.service');

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

  const io = req.app.get('io');

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
          return res.status(500).json({ error: 'Database update failed' });
        }

        // Trigger PAYMENT_SUCCESS and EVENT_REGISTRATION Notifications after DB update succeeds
        eventModel.getRegistrationByStripeSessionId(stripeSessionId, (regErr, regResult) => {
          if (!regErr && regResult && regResult.length > 0) {
            const reg = regResult[0];
            const userId = reg.userId;
            const eventId = reg.eventId;

            eventModel.getEventById(eventId, (evtErr, evtResult) => {
              const eventTitle = !evtErr && evtResult && evtResult.length > 0
                ? evtResult[0].title
                : 'the event';

              notificationService.createNotification(
                {
                  userId: Number(userId),
                  actorUserId: null,
                  type: 'PAYMENT_SUCCESS',
                  entityType: 'PAYMENT',
                  referenceId: Number(eventId),
                  message: `Payment for ${eventTitle} was successful.`,
                },
                io
              );

              notificationService.createNotification(
                {
                  userId: Number(userId),
                  actorUserId: null,
                  type: 'EVENT_REGISTRATION',
                  entityType: 'EVENT',
                  referenceId: Number(eventId),
                  message: `You successfully registered for ${eventTitle}.`,
                },
                io
              );
            });
          }
        });

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
          return res.status(500).json({ error: 'Database update failed' });
        }

        // Trigger PAYMENT_FAILED Notification after DB update succeeds
        eventModel.getRegistrationByStripeSessionId(stripeSessionId, (regErr, regResult) => {
          if (!regErr && regResult && regResult.length > 0) {
            const reg = regResult[0];
            const userId = reg.userId;
            const eventId = reg.eventId;

            eventModel.getEventById(eventId, (evtErr, evtResult) => {
              const eventTitle = !evtErr && evtResult && evtResult.length > 0
                ? evtResult[0].title
                : 'the event';

              notificationService.createNotification(
                {
                  userId: Number(userId),
                  actorUserId: null,
                  type: 'PAYMENT_FAILED',
                  entityType: 'PAYMENT',
                  referenceId: Number(eventId),
                  message: `Payment for ${eventTitle} failed.`,
                },
                io
              );
            });
          }
        });

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
