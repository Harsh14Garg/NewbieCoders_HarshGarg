const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');
const COLLECTIONS = require('../models/collections');
const AppError = require('../utils/AppError');

class AnalyticsService {
  /**
   * getPlatformStats — High-level stats for the platform.
   */
  async getPlatformStats() {
    const [eventsSnap, bookingsSnap, usersSnap] = await Promise.all([
      db.collection(COLLECTIONS.EVENTS).where('isPublished', '==', true).get(),
      db.collection(COLLECTIONS.BOOKINGS).get(),
      db.collection(COLLECTIONS.USERS).get(),
    ]);

    const bookings = bookingsSnap.docs.map((d) => d.data());
    const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
    const revenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return {
      totalEvents: eventsSnap.size,
      totalBookings: bookings.length,
      confirmedBookings: confirmedBookings.length,
      totalUsers: usersSnap.size,
      totalRevenue: revenue,
    };
  }

  /**
   * getEventAnalytics — Detailed analytics for a specific event.
   */
  async getEventAnalytics(eventId, organizerId) {
    const eventDoc = await db.collection(COLLECTIONS.EVENTS).doc(eventId).get();
    if (!eventDoc.exists) throw new AppError('Event not found', 404);

    const event = eventDoc.data();
    if (event.organizerId !== organizerId) throw new AppError('Not authorized', 403);

    const bookingsSnap = await db
      .collection(COLLECTIONS.BOOKINGS)
      .where('eventId', '==', eventId)
      .get();

    const bookings = bookingsSnap.docs.map((d) => d.data());
    const confirmed = bookings.filter((b) => b.status === 'confirmed');
    const revenue = confirmed.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const ticketsSnap = await db
      .collection(COLLECTIONS.TICKETS)
      .where('eventId', '==', eventId)
      .get();

    const tickets = ticketsSnap.docs.map((d) => d.data());
    const checkedIn = tickets.filter((t) => t.isCheckedIn).length;

    return {
      event: { id: eventDoc.id, title: event.title, startDate: event.startDate },
      totalBookings: bookings.length,
      confirmedBookings: confirmed.length,
      revenue,
      totalTickets: tickets.length,
      checkedIn,
      checkInRate: tickets.length > 0 ? Math.round((checkedIn / tickets.length) * 100) : 0,
      availableSeats: event.availableSeats,
      totalCapacity: event.totalCapacity,
      occupancyRate:
        event.totalCapacity > 0
          ? Math.round(((event.totalCapacity - event.availableSeats) / event.totalCapacity) * 100)
          : 0,
      viewCount: event.viewCount || 0,
    };
  }

  /**
   * getOrganizerAnalytics — Summary analytics across all organizer events.
   */
  async getOrganizerAnalytics(organizerId) {
    const eventsSnap = await db
      .collection(COLLECTIONS.EVENTS)
      .where('organizerId', '==', organizerId)
      .get();

    const eventIds = eventsSnap.docs.map((d) => d.id);
    const events = eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (eventIds.length === 0) {
      return { totalEvents: 0, totalBookings: 0, revenue: 0, events: [] };
    }

    // Fetch bookings for all organizer events (batch in chunks of 10)
    let allBookings = [];
    for (let i = 0; i < eventIds.length; i += 10) {
      const chunk = eventIds.slice(i, i + 10);
      const snap = await db
        .collection(COLLECTIONS.BOOKINGS)
        .where('eventId', 'in', chunk)
        .get();
      allBookings = [...allBookings, ...snap.docs.map((d) => d.data())];
    }

    const confirmed = allBookings.filter((b) => b.status === 'confirmed');
    const revenue = confirmed.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return {
      totalEvents: events.length,
      totalBookings: allBookings.length,
      confirmedBookings: confirmed.length,
      revenue,
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        status: e.status,
        bookingCount: e.bookingCount || 0,
        availableSeats: e.availableSeats,
        totalCapacity: e.totalCapacity,
      })),
    };
  }

  /**
   * getCrowdDensity — Real-time crowd density / check-in info for an event.
   */
  async getCrowdDensity(eventId) {
    const eventDoc = await db.collection(COLLECTIONS.EVENTS).doc(eventId).get();
    if (!eventDoc.exists) throw new AppError('Event not found', 404);

    const event = eventDoc.data();

    const ticketsSnap = await db
      .collection(COLLECTIONS.TICKETS)
      .where('eventId', '==', eventId)
      .get();

    const tickets = ticketsSnap.docs.map((d) => d.data());
    const checkedIn = tickets.filter((t) => t.isCheckedIn).length;
    const total = event.totalCapacity || tickets.length;
    const density = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    let densityLabel = 'Low';
    if (density > 75) densityLabel = 'Very High';
    else if (density > 50) densityLabel = 'High';
    else if (density > 25) densityLabel = 'Moderate';

    return {
      eventId,
      eventTitle: event.title,
      totalCapacity: total,
      checkedIn,
      density,
      densityLabel,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new AnalyticsService();
