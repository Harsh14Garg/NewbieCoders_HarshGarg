const express = require('express');
const eventController = require('../controllers/eventController');
const { protect, restrictTo, optionalAuth } = require('../middlewares/authMiddleware');
const { validateRequest, schemas } = require('../utils/validation');

const router = express.Router();

// Public routes
router.get('/', optionalAuth, eventController.listEvents);
router.get('/trending', eventController.getTrendingEvents);
router.get('/featured', eventController.getFeaturedEvents);
router.get('/nearby', eventController.getNearbyEvents);
router.get('/:id', optionalAuth, eventController.getEvent);

// Protected routes - Organizer only
router.post('/', protect, restrictTo('organizer', 'admin'), validateRequest(schemas.eventCreate), eventController.createEvent);
router.put('/:id', protect, restrictTo('organizer', 'admin'), eventController.updateEvent);
router.delete('/:id', protect, restrictTo('organizer', 'admin'), eventController.deleteEvent);

// Organizer dashboard
router.get('/organizer/events', protect, restrictTo('organizer', 'admin'), eventController.getOrganizerEvents);
router.get('/:id/stats', protect, restrictTo('organizer', 'admin'), eventController.getEventStats);

module.exports = router;
