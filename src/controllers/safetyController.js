const { db } = require('../config/firebase');
const COLLECTIONS = require('../models/collections');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.triggerSOS = catchAsync(async (req, res) => {
  const { eventId, description, severity, latitude, longitude } = req.body;

  if (!db) {
    throw new AppError('Database service unavailable', 503);
  }

  if (!eventId) {
    throw new AppError('Event ID is required', 400);
  }

  if (!severity || !['low', 'medium', 'high', 'critical'].includes(severity)) {
    throw new AppError('Valid severity level is required', 400);
  }

  const eventDoc = await db.collection(COLLECTIONS.EVENTS).doc(eventId).get();
  if (!eventDoc.exists) {
    throw new AppError('Event not found', 404);
  }

  const sosData = {
    userId: req.userId,
    eventId: eventId,
    description,
    severity,
    location: latitude && longitude ? { latitude, longitude } : null,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const docRef = await db.collection(COLLECTIONS.SOS_ALERTS).add(sosData);

  res.status(201).json({
    success: true,
    message: 'SOS alert created successfully',
    data: { id: docRef.id, ...sosData },
  });
});

exports.getCrowdDensity = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  if (!db) {
    throw new AppError('Database service unavailable', 503);
  }

  const eventDoc = await db.collection(COLLECTIONS.EVENTS).doc(eventId).get();
  if (!eventDoc.exists) {
    throw new AppError('Event not found', 404);
  }

  const event = eventDoc.data();
  const occupancyPercentage = event.occupancyPercentage || 0;

  const density = {
    eventId: eventId,
    eventTitle: event.title,
    totalCapacity: event.maxAttendees || event.totalTickets || 0,
    currentAttendance: event.attendeeCount || 0,
    occupancyPercentage: occupancyPercentage,
    estimatedCrowdLevel: getCrowdLevel(occupancyPercentage),
  };

  res.json({
    success: true,
    data: density,
  });
});

exports.remarkEvent = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  if (!db) {
    throw new AppError('Database service unavailable', 503);
  }

  const userRef = db.collection(COLLECTIONS.USERS).doc(req.userId);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    throw new AppError('User not found', 404);
  }

  const userData = userDoc.data();
  let favoriteEvents = userData.favoriteEvents || [];

  const isFavorited = favoriteEvents.includes(eventId);

  if (isFavorited) {
    favoriteEvents = favoriteEvents.filter(id => id !== eventId);
  } else {
    favoriteEvents.push(eventId);
  }

  await userRef.update({ favoriteEvents });

  res.json({
    success: true,
    message: isFavorited ? 'Event removed from favorites' : 'Event added to favorites',
    data: {
      eventId,
      isFavorited: !isFavorited,
    },
  });
});

exports.getFavoriteEvents = catchAsync(async (req, res) => {
  if (!db) {
    throw new AppError('Database service unavailable', 503);
  }

  const userDoc = await db.collection(COLLECTIONS.USERS).doc(req.userId).get();
  if (!userDoc.exists) {
    throw new AppError('User not found', 404);
  }

  const userData = userDoc.data();
  const favoriteEventIds = userData.favoriteEvents || [];

  if (favoriteEventIds.length === 0) {
    return res.json({ success: true, data: [] });
  }

  // Fetch event details for each favorite ID
  const events = [];
  for (const id of favoriteEventIds) {
    const evDoc = await db.collection(COLLECTIONS.EVENTS).doc(id).get();
    if (evDoc.exists) {
      events.push({ id: evDoc.id, ...evDoc.data() });
    }
  }

  res.json({
    success: true,
    data: events,
  });
});

function getCrowdLevel(occupancyPercentage) {
  if (occupancyPercentage < 25) return 'LOW';
  if (occupancyPercentage < 50) return 'MODERATE';
  if (occupancyPercentage < 75) return 'HIGH';
  if (occupancyPercentage < 90) return 'VERY_HIGH';
  return 'CRITICAL';
}
