const express = require('express');
const ticketController = require('../controllers/ticketController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get user tickets
router.get('/', ticketController.getUserTickets);

// Validate ticket (QR scan)
router.post('/validate', ticketController.validateTicket);

// Get specific ticket
router.get('/:id', ticketController.getTicket);

// Check in ticket
router.post('/:id/check-in', ticketController.checkInTicket);

// Transfer ticket
router.post('/:id/transfer', ticketController.transferTicket);

module.exports = router;
