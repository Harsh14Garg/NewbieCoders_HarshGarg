const express = require('express');
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest, schemas } = require('../utils/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get user bookings
router.get('/', bookingController.getUserBookings);

// Create booking
router.post('/', validateRequest(schemas.bookingCreate), bookingController.createBooking);

// Get specific booking
router.get('/:id', bookingController.getBooking);

// Confirm payment
router.post('/:id/confirm-payment', bookingController.confirmPayment);

// Cancel booking
router.post('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
