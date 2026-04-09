const catchAsync = require('../utils/catchAsync');
const AnalyticsService = require('../services/AnalyticsService');
const AppError = require('../utils/AppError');

exports.getOrganizerDashboard = catchAsync(async (req, res) => {
  const dashboard = await AnalyticsService.getOrganizerDashboard(req.userId);

  res.json({
    success: true,
    data: dashboard,
  });
});

exports.getPlatformStats = catchAsync(async (req, res) => {
  const stats = await AnalyticsService.getPlatformStats();

  res.json({
    success: true,
    data: stats,
  });
});

exports.getEventMetrics = catchAsync(async (req, res) => {
  const metrics = await AnalyticsService.getEventMetrics(req.params.eventId);

  res.json({
    success: true,
    data: metrics,
  });
});
