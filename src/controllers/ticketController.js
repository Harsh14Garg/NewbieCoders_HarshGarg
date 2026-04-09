const catchAsync = require('../utils/catchAsync');
const TicketService = require('../services/TicketService');
const AppError = require('../utils/AppError');

exports.getTicket = catchAsync(async (req, res) => {
  const ticket = await TicketService.getTicket(req.params.id, req.userId);

  res.json({
    success: true,
    data: ticket,
  });
});

exports.getUserTickets = catchAsync(async (req, res) => {
  const { status, eventId, page, limit } = req.query;

  const result = await TicketService.getUserTickets(req.userId, {
    status,
    eventId,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
  });

  res.json({
    success: true,
    data: result,
  });
});

exports.validateTicket = catchAsync(async (req, res) => {
  const { qrCode } = req.body;

  if (!qrCode) {
    throw new AppError('QR code is required', 400);
  }

  const result = await TicketService.validateTicket(qrCode);

  res.json({
    success: true,
    data: result,
  });
});

exports.checkInTicket = catchAsync(async (req, res) => {
  const ticket = await TicketService.checkInTicket(req.params.id, req.userId);

  res.json({
    success: true,
    message: 'Ticket checked in successfully',
    data: ticket,
  });
});

exports.transferTicket = catchAsync(async (req, res) => {
  const { transferToEmail } = req.body;

  if (!transferToEmail) {
    throw new AppError('Email is required', 400);
  }

  const ticket = await TicketService.transferTicket(req.params.id, req.userId, transferToEmail);

  res.json({
    success: true,
    message: 'Ticket transferred successfully',
    data: ticket,
  });
});
