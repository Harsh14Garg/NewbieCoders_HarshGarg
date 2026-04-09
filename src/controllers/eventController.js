const catchAsync = require('../utils/catchAsync');
const EventService = require('../services/EventService');
const AppError = require('../utils/AppError');

exports.createEvent = catchAsync(async (req, res) => {
  const event = await EventService.createEvent(req.body, req.userId);

  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: event,
  });
});

exports.getEvent = catchAsync(async (req, res) => {
  const event = await EventService.getEventById(req.params.id);

  // Update view count
  await EventService.updateEventView(req.params.id);

  res.json({
    success: true,
    data: event,
  });
});

exports.updateEvent = catchAsync(async (req, res) => {
  const event = await EventService.updateEvent(req.params.id, req.userId, req.body);

  res.json({
    success: true,
    message: 'Event updated successfully',
    data: event,
  });
});

exports.deleteEvent = catchAsync(async (req, res) => {
  await EventService.deleteEvent(req.params.id, req.userId);

  res.json({
    success: true,
    message: 'Event deleted successfully',
  });
});

exports.listEvents = catchAsync(async (req, res) => {
  const { search, category, startDate, endDate, minPrice, maxPrice, page, limit } = req.query;

  const result = await EventService.listEvents({
    search,
    category,
    startDate,
    endDate,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
  });

  res.json({
    success: true,
    data: result,
  });
});

exports.getNearbyEvents = catchAsync(async (req, res) => {
  const { latitude, longitude, radius, category, page, limit } = req.query;

  if (!latitude || !longitude) {
    throw new AppError('Please provide latitude and longitude', 400);
  }

  const coordinates = [parseFloat(longitude), parseFloat(latitude)];

  const result = await EventService.getNearbyEvents(coordinates, parseFloat(radius) || 50, {
    category,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
  });

  res.json({
    success: true,
    data: result,
  });
});

exports.getTrendingEvents = catchAsync(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const events = await EventService.getTrendingEvents(limit);

  res.json({
    success: true,
    data: events,
  });
});

exports.getFeaturedEvents = catchAsync(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const events = await EventService.getFeaturedEvents(limit);

  res.json({
    success: true,
    data: events,
  });
});

exports.getOrganizerEvents = catchAsync(async (req, res) => {
  const { status, page, limit } = req.query;

  const result = await EventService.getOrganizerEvents(req.userId, {
    status,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
  });

  res.json({
    success: true,
    data: result,
  });
});

exports.getEventStats = catchAsync(async (req, res) => {
  const stats = await EventService.getEventStats(req.params.id, req.userId);

  res.json({
    success: true,
    data: stats,
  });
});
