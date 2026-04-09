const express = require('express');
const config = require('./config/config');
const { admin } = require('./config/firebase');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const safetyRoutes = require('./routes/safetyRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const {
  corsMiddleware,
  securityHeaders,
  mongoSanitization,
  limiter,
  errorHandler,
} = require('./middlewares/securityMiddleware');
const { requestLogger, notFound } = require('./middlewares/utilityMiddleware');
const AppError = require('./utils/AppError');

const app = express();

// Firebase is initialized in config/firebase.js which is imported above
console.log('✓ Firebase initialized');

// Middleware
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(mongoSanitization);
app.use(limiter);
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// API Documentation
app.get('/api/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SpotOn API Documentation</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border-radius: 8px;
        }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 30px; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .endpoint {
          background: #f9f9f9;
          padding: 15px;
          margin: 15px 0;
          border-left: 4px solid #007bff;
          border-radius: 4px;
        }
        .method {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 3px;
          font-weight: bold;
          margin-right: 10px;
        }
        .get { background: #61affe; color: white; }
        .post { background: #49cc90; color: white; }
        .put { background: #fca130; color: white; }
        .delete { background: #f93e3e; color: white; }
        code {
          background: #eee;
          padding: 2px 5px;
          border-radius: 3px;
          font-family: monospace;
        }
        .required { color: #f93e3e; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎟️ SpotOn API Documentation</h1>
        <p><strong>Base URL:</strong> ${config.server.apiUrl}</p>
        <p><strong>Authentication:</strong> JWT Token (Bearer token in Authorization header)</p>

        <h2>Authentication Endpoints</h2>
        <div class="endpoint">
          <span class="method post">POST</span> <code>/api/auth/signup</code>
          <p>Register a new user</p>
          <strong>Body:</strong> <code>{ name, email, password, role }</code>
        </div>
        <div class="endpoint">
          <span class="method post">POST</span> <code>/api/auth/login</code>
          <p>Login user</p>
          <strong>Body:</strong> <code>{ email, password }</code>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span> <code>/api/auth/me</code>
          <p>Get current user profile</p>
          <strong class="required">Requires Auth</strong>
        </div>

        <h2>Event Endpoints</h2>
        <div class="endpoint">
          <span class="method post">POST</span> <code>/api/events</code>
          <p>Create event (Organizer only)</p>
          <strong class="required">Requires Auth + Organizer Role</strong>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span> <code>/api/events</code>
          <p>List all events with filters</p>
          <strong>Query:</strong> <code>?search=&category=&page=1&limit=20</code>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span> <code>/api/events/:id</code>
          <p>Get single event</p>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span> <code>/api/events/nearby</code>
          <p>Get nearby events</p>
          <strong>Query:</strong> <code>?latitude=&longitude=&radius=50</code>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span> <code>/api/events/trending</code>
          <p>Get trending events</p>
        </div>

        <h2>Booking Endpoints</h2>
        <div class="endpoint">
          <span class="method post">POST</span> <code>/api/bookings</code>
          <p>Create booking</p>
          <strong class="required">Requires Auth</strong>
          <strong>Body:</strong> <code>{ eventId, numberOfTickets, ticketType }</code>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span> <code>/api/bookings</code>
          <p>Get user bookings</p>
          <strong class="required">Requires Auth</strong>
        </div>
        <div class="endpoint">
          <span class="method post">POST</span> <code>/api/bookings/:id/confirm-payment</code>
          <p>Confirm payment</p>
          <strong class="required">Requires Auth</strong>
          <strong>Body:</strong> <code>{ transactionId, paymentMethod }</code>
        </div>

        <h2>Ticket Endpoints</h2>
        <div class="endpoint">
          <span class="method get">GET</span> <code>/api/tickets</code>
          <p>Get user tickets</p>
          <strong class="required">Requires Auth</strong>
        </div>
        <div class="endpoint">
          <span class="method post">POST</span> <code>/api/tickets/validate</code>
          <p>Validate ticket (QR scan)</p>
          <strong class="required">Requires Auth</strong>
          <strong>Body:</strong> <code>{ qrCode }</code>
        </div>
        <div class="endpoint">
          <span class="method post">POST</span> <code>/api/tickets/:id/check-in</code>
          <p>Check in ticket</p>
          <strong class="required">Requires Auth</strong>
        </div>

        <h2>Recommendation Endpoints</h2>
        <div class="endpoint">
          <span class="method get">GET</span> <code>/api/recommendations/personalized</code>
          <p>Get personalized recommendations</p>
          <strong class="required">Requires Auth</strong>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span> <code>/api/recommendations/trending</code>
          <p>Get trending events</p>
          <strong class="required">Requires Auth</strong>
        </div>

        <h2>Safety Features</h2>
        <div class="endpoint">
          <span class="method post">POST</span> <code>/api/safety/sos</code>
          <p>Trigger SOS alert</p>
          <strong class="required">Requires Auth</strong>
          <strong>Body:</strong> <code>{ eventId, severity, description }</code>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span> <code>/api/safety/crowd-density/:eventId</code>
          <p>Get crowd density info</p>
          <strong class="required">Requires Auth</strong>
        </div>
        <div class="endpoint">
          <span class="method post">POST</span> <code>/api/safety/favorites/:eventId</code>
          <p>Add/remove favorite event</p>
          <strong class="required">Requires Auth</strong>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.server.port;
const server = app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════╗
  ║  🎟️  SpotOn Backend Server         ║
  ║  Running on port: ${PORT}            ║
  ║  Environment: ${config.server.nodeEnv}          ║
  ║  API URL: ${config.server.apiUrl}    ║
  ║  Docs: ${config.server.apiUrl}/api/docs      ║
  ╚════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app;
