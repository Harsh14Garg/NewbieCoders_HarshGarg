const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/securityMiddleware');
const { validateRequest, schemas } = require('../utils/validation');

const router = express.Router();

// Public routes
router.post(
  '/signup',
  authLimiter,
  validateRequest(schemas.userSignup),
  authController.signup
);

router.post(
  '/login',
  authLimiter,
  validateRequest(schemas.userLogin),
  authController.login
);

// Protected routes
router.use(protect);

router.get('/me', authController.getMe);
router.put('/profile', authController.updateProfile);
router.post('/change-password', authController.changePassword);

module.exports = router;
