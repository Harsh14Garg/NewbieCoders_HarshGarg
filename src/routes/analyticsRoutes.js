const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

// Organizer dashboard
router.get('/organizer/dashboard', restrictTo('organizer', 'admin'), analyticsController.getOrganizerDashboard);

// Platform wide stats (admin only)
router.get('/platform/stats', restrictTo('admin'), analyticsController.getPlatformStats);

// Event metrics
router.get('/events/:eventId/metrics', analyticsController.getEventMetrics);

module.exports = router;
