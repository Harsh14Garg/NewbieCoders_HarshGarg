const express = require('express');
const recommendationController = require('../controllers/recommendationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get personalized recommendations
router.get('/personalized', recommendationController.getRecommendations);

// Get trending events
router.get('/trending', recommendationController.getTrendingEvents);

// Get events similar to a specific event
router.get('/similar/:eventId', recommendationController.getSimilarEvents);

// Get friends' recommendations
router.get('/friends', recommendationController.getFriendsRecommendations);

module.exports = router;
