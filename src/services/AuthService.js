const { auth, db, isDemoMode } = require('../config/firebase');
const COLLECTIONS = require('../models/collections');
const AppError = require('../utils/AppError');

class AuthService {
  _checkFirebase() {
    if ((!auth || !db) && !isDemoMode) {
      throw new AppError('Firebase service is not initialized. Please configure credentials in .env file.', 503);
    }
  }

  async signup(userData) {
    if (isDemoMode) {
        return { 
            success: true, 
            user: { uid: 'demo-user', ...userData, createdAt: new Date().toISOString() },
            message: 'DEMO MODE: User profile created locally (non-persistent).'
        };
    }
    this._checkFirebase();
    const { name, email, password, role } = userData;
    try {
      const firebaseUser = await auth.createUser({ email, password, displayName: name });
      await auth.setCustomUserClaims(firebaseUser.uid, { role: role || 'attendee' });
      const userProfile = { uid: firebaseUser.uid, name, email, role: role || 'attendee', createdAt: new Date().toISOString() };
      await db.collection(COLLECTIONS.USERS).doc(firebaseUser.uid).set(userProfile);
      return { success: true, user: userProfile };
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  }

  async getUserById(userId) {
    if (isDemoMode) return { id: userId, name: 'Demo User', email: 'demo@example.com', role: 'attendee' };
    this._checkFirebase();
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (!userDoc.exists) throw new AppError('User not found', 404);
    return { id: userDoc.id, ...userDoc.data() };
  }
}

module.exports = new AuthService();
