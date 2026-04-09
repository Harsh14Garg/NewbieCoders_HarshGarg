const { db } = require('../config/firebase');
const COLLECTIONS = require('../models/collections');
const AppError = require('../utils/AppError');

class RecommendationService {
  /**
   * getPersonalizedRecommendations
   * Fetches events matching user's interests, excluding already-booked events.
   */
  async getPersonalizedRecommendations(userId, limit = 10) {
    // Get user profile
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (!userDoc.exists) throw new AppError('User not found', 404);

    const user = userDoc.data();
    const userInterests = user.interests || [];
    const bookedEvents = user.bookedEvents || [];

    let events = [];

    // Fetch events by interest categories
    if (userInterests.length > 0) {
      // Firestore "in" operator supports up to 10 values
      const interestBatch = userInterests.slice(0, 10);
      const snapshot = await db
        .collection(COLLECTIONS.EVENTS)
        .where('isPublished', '==', true)
        .where('category', 'in', interestBatch)
        .orderBy('startDate', 'asc')
        .limit(limit * 2)
        .get();

      events = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((e) => !bookedEvents.includes(e.id));
    }

    // Fallback to trending if no interests or insufficient results
    if (events.length < limit) {
      const trending = await this.getTrendingRecommendations(limit - events.length);
      const existingIds = new Set(events.map((e) => e.id));
      const newEvents = trending.filter((e) => !existingIds.has(e.id) && !bookedEvents.includes(e.id));
      events = [...events, ...newEvents];
    }

    return events.slice(0, limit);
  }

  /**
   * getTrendingRecommendations — Top events by booking count.
   */
  async getTrendingRecommendations(limit = 10) {
    const snapshot = await db
      .collection(COLLECTIONS.EVENTS)
      .where('isPublished', '==', true)
      .orderBy('bookingCount', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  /**
   * getSimilarEvents — Events in same category as given event.
   */
  async getSimilarEvents(eventId, limit = 6) {
    const eventDoc = await db.collection(COLLECTIONS.EVENTS).doc(eventId).get();
    if (!eventDoc.exists) throw new AppError('Event not found', 404);

    const { category } = eventDoc.data();

    const snapshot = await db
      .collection(COLLECTIONS.EVENTS)
      .where('isPublished', '==', true)
      .where('category', '==', category)
      .orderBy('bookingCount', 'desc')
      .limit(limit + 1)
      .get();

    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((e) => e.id !== eventId)
      .slice(0, limit);
  }
}

module.exports = new RecommendationService();
