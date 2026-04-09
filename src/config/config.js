require('dotenv').config();

module.exports = {
  // Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },

  // Server
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    apiUrl: process.env.API_URL || 'http://localhost:5000',
  },

  // Cloudinary (Event image uploads)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Email (Nodemailer)
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
  },

  // CORS — origins allowed to call this API
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5000,http://localhost:3000').split(','),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  },

  // Geolocation
  geo: {
    defaultRadiusKm: process.env.DEFAULT_RADIUS_KM || 50,
  },
};
