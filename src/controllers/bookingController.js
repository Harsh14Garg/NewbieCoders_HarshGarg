const catchAsync = require('../utils/catchAsync');
const BookingService = require('../services/BookingService');
const AppError = require('../utils/AppError');

exports.createBooking = catchAsync(async (req, res) => {
  const { eventId, numberOfTickets, ticketType, specialRequests } = req.body;

  const booking = await BookingService.createBooking(
    {
      eventId,
      numberOfTickets,
      ticketType,
      specialRequests,
    },
    req.userId
  );

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: booking,
  });
});

exports.getBooking = catchAsync(async (req, res) => {
  const booking = await BookingService.getBooking(req.params.id, req.userId);

  res.json({
    success: true,
    data: booking,
  });
});

exports.getUserBookings = catchAsync(async (req, res) => {
  const { status, page, limit } = req.query;

  const result = await BookingService.getUserBookings(req.userId, {
    status,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
  });

  res.json({
    success: true,
    data: result,
  });
});

exports.confirmPayment = catchAsync(async (req, res) => {
  const { transactionId, paymentMethod } = req.body;

  if (!transactionId) {
    throw new AppError('Transaction ID is required', 400);
  }

  const booking = await BookingService.confirmPayment(req.params.id, transactionId, paymentMethod);

  res.json({
    success: true,
    message: 'Payment confirmed successfully',
    data: booking,
  });
});

exports.cancelBooking = catchAsync(async (req, res) => {
  const booking = await BookingService.cancelBooking(req.params.id, req.userId);

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: booking,
  });
});
