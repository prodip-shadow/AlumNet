const Stripe = require('stripe');
const eventModel = require('../models/event.model');
const userModel = require('../models/user.model');
const db = require('../config/db');
const notificationService = require('../services/notification.service');

// Helper to get Stripe client
const getStripe = () => {
  return Stripe(process.env.STRIPE_SECRET_KEY);
};

// Admin: Grant Event Creator Permission
const grantPermission = (req, res) => {
  const { userId } = req.params;
  const grantedBy = req.user.id;

  userModel.getUserById(userId, (err, userResult) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = userResult[0];

    if (!['ALUMNI', 'STUDENT'].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: 'Permission can only be granted to Student or Alumni users',
      });
    }

    eventModel.grantCreatorPermission(userId, grantedBy, (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(200).json({
            success: true,
            message: 'User already has event creation permission',
          });
        }
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Event creation permission granted successfully',
      });
    });
  });
};

// Admin: Revoke Event Creator Permission
const revokePermission = (req, res) => {
  const { userId } = req.params;

  eventModel.revokeCreatorPermission(userId, (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Event creation permission revoked successfully',
    });
  });
};

// Admin: List All Permitted Users
const listPermittedUsers = (req, res) => {
  eventModel.listPermittedUsers((err, users) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      permittedUsers: users,
    });
  });
};

// Create Event (ADMIN or Permitted ALUMNI)
const createEvent = (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  const proceedCreation = () => {
    const {
      title,
      description,
      location,
      eventDate,
      registrationDeadline,
      registrationFee,
      isFree,
      maxParticipants,
      contactInfo,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Event title is required',
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Event description is required',
      });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Event location is required',
      });
    }

    if (!contactInfo || !contactInfo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Event contact info is required',
      });
    }

    if (!eventDate || isNaN(Date.parse(eventDate))) {
      return res.status(400).json({
        success: false,
        message: 'Valid event date is required',
      });
    }

    if (!registrationDeadline || isNaN(Date.parse(registrationDeadline))) {
      return res.status(400).json({
        success: false,
        message: 'Valid registration deadline is required',
      });
    }

    const freeEvent = Boolean(isFree === true || isFree === 'true');
    const fee = freeEvent ? 0.0 : Math.max(0, parseFloat(registrationFee) || 0);
    const maxPart = maxParticipants ? parseInt(maxParticipants) : null;
    const bannerImageUrl = req.uploadedImageUrl || null;

    const data = [
      userId,
      title.trim(),
      description.trim(),
      location.trim(),
      eventDate,
      registrationDeadline,
      fee,
      freeEvent,
      maxPart,
      contactInfo.trim(),
      bannerImageUrl,
    ];

    eventModel.createEvent(data, (err, createResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      const eventId = createResult?.insertId ? Number(createResult.insertId) : null;

      // Trigger NEW_EVENT Notification to active network users
      db.query(
        "SELECT id FROM users WHERE (isActive = 1 OR isActive IS NULL) AND id != ?",
        [userId],
        (userErr, userRows) => {
          if (!userErr && userRows && userRows.length > 0) {
            const targetUserIds = userRows.map((r) => r.id);
            notificationService.createBulkNotifications(
              targetUserIds,
              userId,
              'NEW_EVENT',
              'EVENT',
              eventId,
              `{actor} created a new event: ${title.trim()}`,
              req.app.get('io')
            );
          }
        }
      );

      return res.status(201).json({
        success: true,
        message: 'Event created successfully',
      });
    });
  };

  if (userRole === 'ADMIN') {
    return proceedCreation();
  }

  if (['ALUMNI', 'STUDENT'].includes(userRole)) {
    eventModel.checkCreatorPermission(userId, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (result.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to create events',
        });
      }

      return proceedCreation();
    });
  } else {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to create events',
    });
  }
};

// Get All Events (Feed - ACTIVE only)
const getAllEvents = (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.max(1, parseInt(req.query.pageSize) || 10);

  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  eventModel.getAllEvents(limit, offset, (err, events) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    const response = events.map((evt) => {
      const currentRegistrationCount = Number(evt.currentRegistrationCount);
      const remainingSeats = evt.maxParticipants
        ? Math.max(0, evt.maxParticipants - currentRegistrationCount)
        : null;

      return {
        ...evt,
        isFree: Boolean(evt.isFree),
        isRegistrationOpen: Boolean(evt.isRegistrationOpen),
        currentRegistrationCount,
        remainingSeats,
      };
    });

    return res.status(200).json({
      success: true,
      events: response,
      page,
      pageSize,
    });
  });
};

// Get My Events (Creator Dashboard)
const getMyEvents = (req, res) => {
  const creatorUserId = req.user.id;

  eventModel.getMyEvents(creatorUserId, (err, events) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    const response = events.map((evt) => ({
      ...evt,
      isFree: Boolean(evt.isFree),
      isRegistrationOpen: Boolean(evt.isRegistrationOpen),
      registrationCount: Number(evt.registrationCount),
      paymentCount: Number(evt.paymentCount),
      totalCollectedAmount: parseFloat(evt.totalCollectedAmount) || 0.0,
    }));

    return res.status(200).json({
      success: true,
      events: response,
    });
  });
};

// Get Single Event By ID
const getEventById = (req, res) => {
  const { id } = req.params;

  eventModel.getEventById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const evt = result[0];
    const currentRegistrationCount = Number(evt.currentRegistrationCount);
    const remainingSeats = evt.maxParticipants
      ? Math.max(0, evt.maxParticipants - currentRegistrationCount)
      : null;

    const event = {
      ...evt,
      isFree: Boolean(evt.isFree),
      isRegistrationOpen: Boolean(evt.isRegistrationOpen),
      currentRegistrationCount,
      remainingSeats,
      creator: {
        id: evt.creatorUserId,
        name: evt.creatorName,
        profileImageUrl: evt.creatorProfileImageUrl,
        role: evt.creatorRole,
      },
    };

    delete event.creatorName;
    delete event.creatorProfileImageUrl;
    delete event.creatorRole;

    return res.status(200).json({
      success: true,
      event,
    });
  });
};

// Update Event
const updateEvent = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  eventModel.getEventById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const event = result[0];

    if (Number(event.creatorUserId) !== Number(userId) && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const {
      title,
      description,
      location,
      eventDate,
      registrationDeadline,
      registrationFee,
      isFree,
      maxParticipants,
      contactInfo,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Event title is required',
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Event description is required',
      });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Event location is required',
      });
    }

    if (!contactInfo || !contactInfo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Event contact info is required',
      });
    }

    const freeEvent = Boolean(isFree === true || isFree === 'true');
    const fee = freeEvent ? 0.0 : Math.max(0, parseFloat(registrationFee) || 0);
    const maxPart = maxParticipants ? parseInt(maxParticipants) : null;
    const bannerImageUrl = req.uploadedImageUrl || event.bannerImageUrl;

    const data = [
      title.trim(),
      description.trim(),
      location.trim(),
      eventDate || event.eventDate,
      registrationDeadline || event.registrationDeadline,
      fee,
      freeEvent,
      maxPart,
      contactInfo.trim(),
      bannerImageUrl,
    ];

    eventModel.updateEvent(id, data, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Event updated successfully',
      });
    });
  });
};

// Update Event Status & Registration Status
const updateEventStatus = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  const { status, isRegistrationOpen } = req.body;

  if (!status || !['ACTIVE', 'CLOSED', 'CANCELLED'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status (ACTIVE, CLOSED, CANCELLED) is required',
    });
  }

  eventModel.getEventById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const event = result[0];

    if (Number(event.creatorUserId) !== Number(userId) && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const regOpen = isRegistrationOpen !== undefined
      ? Boolean(isRegistrationOpen)
      : (status === 'ACTIVE');

    eventModel.updateEventStatus(id, status, regOpen, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (status === 'CANCELLED') {
        // Fetch registered users to send EVENT_CANCELLED notification
        eventModel.getEventRegistrations(id, (regErr, registrations) => {
          if (!regErr && registrations && registrations.length > 0) {
            const registeredUserIds = registrations
              .filter((r) => r.registrationStatus === 'REGISTERED' || r.paymentStatus === 'PAID' || r.paymentStatus === 'FREE')
              .map((r) => r.userId);

            if (registeredUserIds.length > 0) {
              notificationService.createBulkNotifications(
                registeredUserIds,
                userId,
                'EVENT_CANCELLED',
                'EVENT',
                Number(id),
                `${event.title} has been cancelled.`,
                req.app.get('io')
              );
            }
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Event status updated successfully',
      });
    });
  });
};

// Delete Event
const deleteEvent = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  eventModel.getEventById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const event = result[0];

    if (Number(event.creatorUserId) !== Number(userId) && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    eventModel.deleteEvent(id, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Event deleted successfully',
      });
    });
  });
};

// Register for Event (Free or Paid via Stripe)
const registerForEvent = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  eventModel.getEventById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const event = result[0];

    if (event.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'This event is no longer active',
      });
    }

    if (!event.isRegistrationOpen) {
      return res.status(400).json({
        success: false,
        message: 'Registration for this event is currently closed',
      });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline for this event has passed',
      });
    }

    const currentRegCount = Number(event.currentRegistrationCount);
    if (event.maxParticipants && currentRegCount >= event.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Event participant limit reached',
      });
    }

    // Check Duplicate Registration
    eventModel.checkUserRegistration(id, userId, (err, regResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (regResult.length > 0) {
        const existingReg = regResult[0];

        if (
          existingReg.paymentStatus === 'FREE' ||
          existingReg.paymentStatus === 'PAID' ||
          existingReg.registrationStatus === 'REGISTERED'
        ) {
          return res.status(400).json({
            success: false,
            message: 'You are already registered for this event',
          });
        }
      }

      // FREE Event Flow
      if (Boolean(event.isFree) || Number(event.registrationFee) <= 0) {
        eventModel.createFreeRegistration(id, userId, (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Server Error',
            });
          }

          // Trigger EVENT_REGISTRATION Notification for attendee
          notificationService.createNotification(
            {
              userId: Number(userId),
              actorUserId: null,
              type: 'EVENT_REGISTRATION',
              entityType: 'EVENT',
              referenceId: Number(id),
              message: `You successfully registered for ${event.title}.`,
            },
            req.app.get('io')
          );

          // Notify event creator about new registration
          if (Number(event.creatorUserId) !== Number(userId)) {
            notificationService.createNotification(
              {
                userId: Number(event.creatorUserId),
                actorUserId: Number(userId),
                type: 'EVENT_REGISTRATION',
                entityType: 'EVENT',
                referenceId: Number(id),
                message: `{actor} registered for your event ${event.title}.`,
              },
              req.app.get('io')
            );
          }

          return res.status(201).json({
            success: true,
            message: 'Registered successfully for free event',
            isFree: true,
          });
        });

        return;
      }

      // PAID Event Flow via Stripe Checkout
      const stripe = getStripe();
      const feeInCents = Math.round(Number(event.registrationFee) * 100);

      stripe.checkout.sessions
        .create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: event.title,
                  description: `Event Registration Fee for ${event.title}`,
                },
                unit_amount: feeInCents,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${process.env.FRONTEND_URL}/events/${id}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL}/events/${id}/payment-cancel`,
          metadata: {
            eventId: String(id),
            userId: String(userId),
          },
        })
        .then((session) => {
          eventModel.upsertPendingRegistration(
            id,
            userId,
            session.id,
            event.registrationFee,
            (err) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: 'Server Error',
                });
              }

              return res.status(200).json({
                success: true,
                checkoutUrl: session.url,
                sessionId: session.id,
                isFree: false,
              });
            },
          );
        })
        .catch((err) => {
          console.error('Stripe checkout session creation error:', err.message);
          return res.status(500).json({
            success: false,
            message: 'Stripe checkout session creation failed',
          });
        });
    });
  });
};

// Get Event Registered Users (Creator Dashboard)
const getEventRegistrations = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  eventModel.getEventById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const event = result[0];

    if (Number(event.creatorUserId) !== Number(userId) && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    eventModel.getEventRegistrations(id, (err, registrations) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        registrations,
      });
    });
  });
};

// Get User Payment History
const getUserPaymentHistory = (req, res) => {
  const userId = req.user.id;

  eventModel.getUserPaymentHistory(userId, (err, history) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      history,
    });
  });
};

module.exports = {
  grantPermission,
  revokePermission,
  listPermittedUsers,
  createEvent,
  getAllEvents,
  getMyEvents,
  getEventById,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  registerForEvent,
  getEventRegistrations,
  getUserPaymentHistory,
};
