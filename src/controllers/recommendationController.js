const catchAsync = require('../utils/catchAsync');
const RecommendationService = require('../services/RecommendationService');

exports.getRecommendations = catchAsync(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;

  const recommendations = await RecommendationService.getRecommendations(req.userId, limit);

  res.json({
    success: true,
    data: recommendations,
  });
});

exports.getTrendingEvents = catchAsync(async (req, res) => {
  const { limit, timeframe } = req.query;

  const events = await RecommendationService.getTrendingEvents(
    limit ? parseInt(limit) : 10,
    timeframe ? parseInt(timeframe) : 24
  );

  res.json({
    success: true,
    data: events,
  });
});

exports.getSimilarEvents = catchAsync(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 5;

  const events = await RecommendationService.getSimilarEvents(req.params.eventId, limit);

  res.json({
    success: true,
    data: events,
  });
});

exports.getFriendsRecommendations = catchAsync(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 5;

  const events = await RecommendationService.getFriendsEventsRecommendations(req.userId, limit);

  res.json({
    success: true,
    message: 'Events from friends',
    data: events,
  });
});
