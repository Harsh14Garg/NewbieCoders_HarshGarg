const { auth, db } = require('../config/firebase');
const COLLECTIONS = require('../models/collections');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * protect — Verifies Firebase ID token from Authorization header.
 * Sets req.user (Firestore profile), req.userId (uid), req.userRole.
 */
const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Please login to access this resource', 401);
  }

  try {
    // Demo Mode bypass
    const { isDemoMode } = require('../config/firebase');
    if (isDemoMode && token === 'demo-token') {
      req.user = { id: 'demo-user', name: 'Demo User', email: 'demo@example.com', role: 'attendee' };
      req.userId = 'demo-user';
      req.userRole = 'attendee';
      return next();
    }

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);

    // Fetch Firestore user profile
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      throw new AppError('User not found', 404);
    }

    const userData = userDoc.data();

    if (userData.isBlocked) {
      throw new AppError('Your account has been blocked', 403);
    }

    req.user = { id: decodedToken.uid, ...userData };
    req.userId = decodedToken.uid;
    req.userRole = userData.role || decodedToken.role || 'attendee';

    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    // Firebase auth errors
    if (error.code && error.code.startsWith('auth/')) {
      throw new AppError('Invalid or expired token', 401);
    }
    throw new AppError('Authentication failed', 401);
  }
});

/**
 * restrictTo — Role-based access control middleware.
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

/**
 * optionalAuth — Attaches user if token is present, silently continues otherwise.
 */
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        if (!userData.isBlocked) {
          req.user = { id: decodedToken.uid, ...userData };
          req.userId = decodedToken.uid;
          req.userRole = userData.role || 'attendee';
        }
      }
    } catch (error) {
      // Silent fail — user remains unauthenticated
    }
  }

  next();
});

module.exports = { protect, restrictTo, optionalAuth };
