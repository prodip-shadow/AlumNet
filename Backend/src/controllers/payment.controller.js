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
    console.error('Stripe Webhook Signature Verification Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const io = req.app.get('io');

  // 1. Checkout Session Completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const stripeSessionId = session.id;
    const paymentIntentId = session.payment_intent || null;

    eventModel.getRegistrationByStripeSessionId(stripeSessionId, (regErr, regResult) => {
      if (regErr) {
        console.error('Webhook DB lookup error:', regErr);
        return res.status(500).json({ error: 'Database lookup failed' });
      }

      if (regResult && regResult.length > 0) {
        const reg = regResult[0];

        // Idempotency: If already marked PAID, acknowledge without duplicate work
        if (reg.paymentStatus === 'PAID') {
          return res.status(200).json({ received: true, message: 'Already processed' });
        }
      }

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

          eventModel.getRegistrationByStripeSessionId(stripeSessionId, (err2, res2) => {
            if (!err2 && res2 && res2.length > 0) {
              const reg = res2[0];
              const userId = reg.userId;
              const eventId = reg.eventId;

              eventModel.getEventById(eventId, (evtErr, evtResult) => {
                const eventTitle = !evtErr && evtResult && evtResult.length > 0 ? evtResult[0].title : 'the event';
                const creatorUserId = !evtErr && evtResult && evtResult.length > 0 ? evtResult[0].creatorUserId : null;

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

                if (creatorUserId && Number(creatorUserId) !== Number(userId)) {
                  notificationService.createNotification(
                    {
                      userId: Number(creatorUserId),
                      actorUserId: Number(userId),
                      type: 'EVENT_REGISTRATION',
                      entityType: 'EVENT',
                      referenceId: Number(eventId),
                      message: `{actor} paid and registered for your event ${eventTitle}.`,
                    },
                    io
                  );
                }
              });
            }
          });

          return res.status(200).json({ received: true });
        }
      );
    });
  }
  // 2. Payment Intent Succeeded
  else if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const paymentIntentId = paymentIntent.id;

    eventModel.getRegistrationByPaymentIntentId(paymentIntentId, (regErr, regResult) => {
      if (!regErr && regResult && regResult.length > 0) {
        const reg = regResult[0];
        if (reg.paymentStatus === 'PAID') {
          return res.status(200).json({ received: true, message: 'Already processed' });
        }

        eventModel.updateRegistrationByPaymentIntentId(paymentIntentId, 'PAID', 'REGISTERED', (err) => {
          if (err) console.error('Error updating payment intent succeeded:', err);
          return res.status(200).json({ received: true });
        });
      } else {
        return res.status(200).json({ received: true });
      }
    });
  }
  // 3. Payment Intent Failed
  else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    const paymentIntentId = paymentIntent.id;

    eventModel.getRegistrationByPaymentIntentId(paymentIntentId, (regErr, regResult) => {
      if (!regErr && regResult && regResult.length > 0) {
        const reg = regResult[0];
        if (reg.paymentStatus === 'FAILED') {
          return res.status(200).json({ received: true, message: 'Already marked failed' });
        }

        eventModel.updateRegistrationByPaymentIntentId(paymentIntentId, 'FAILED', 'FAILED', (err) => {
          if (err) console.error('Error updating payment intent failed:', err);

          notificationService.createNotification(
            {
              userId: Number(reg.userId),
              actorUserId: null,
              type: 'PAYMENT_FAILED',
              entityType: 'PAYMENT',
              referenceId: Number(reg.eventId),
              message: `Payment for event registration failed.`,
            },
            io
          );

          return res.status(200).json({ received: true });
        });
      } else {
        return res.status(200).json({ received: true });
      }
    });
  }
  // 4. Checkout Session Expired
  else if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    const stripeSessionId = session.id;

    eventModel.updateRegistrationPaymentStatus(
      stripeSessionId,
      null,
      'FAILED',
      'FAILED',
      (err) => {
        if (err) console.error('Webhook DB update error (expired):', err);
        return res.status(200).json({ received: true });
      }
    );
  } else {
    return res.status(200).json({ received: true });
  }
};

module.exports = {
  handleStripeWebhook,
};
