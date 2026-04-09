const express = require('express');
const safetyController = require('../controllers/safetyController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Trigger SOS alert
router.post('/sos', safetyController.triggerSOS);

// Get crowd density for an event
router.get('/crowd-density/:eventId', safetyController.getCrowdDensity);

// Add/remove favorite event
router.post('/favorites/:eventId', safetyController.remarkEvent);

// Get favorite events
router.get('/favorites', safetyController.getFavoriteEvents);

module.exports = router;
