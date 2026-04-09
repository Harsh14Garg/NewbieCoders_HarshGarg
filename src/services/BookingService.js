const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');
const COLLECTIONS = require('../models/collections');
const AppError = require('../utils/AppError');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

class BookingService {
  /**
   * createBooking — Atomically creates a booking and decrements availableSeats.
   */
  async createBooking(userId, bookingData) {
    const { eventId, numberOfTickets, ticketType } = bookingData;

    if (!eventId || !numberOfTickets) {
      throw new AppError('eventId and numberOfTickets are required', 400);
    }

    const eventRef = db.collection(COLLECTIONS.EVENTS).doc(eventId);

    return db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);

      if (!eventDoc.exists) {
        throw new AppError('Event not found', 404);
      }

      const event = eventDoc.data();

      if (event.status === 'cancelled') {
        throw new AppError('This event has been cancelled', 400);
      }

      if (event.availableSeats < numberOfTickets) {
        throw new AppError(
          `Only ${event.availableSeats} seat(s) available`,
          400
        );
      }

      // Find ticket type details
      const selectedTicketType = event.ticketTypes?.find(
        (t) => t.name === (ticketType || 'General')
      ) || event.ticketTypes?.[0] || { name: 'General', price: 0 };

      const totalAmount = selectedTicketType.price * numberOfTickets;
      const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc();

      const booking = {
        id: bookingRef.id,
        userId,
        eventId,
        eventTitle: event.title,
        eventDate: event.startDate,
        venue: event.venue,
        ticketType: selectedTicketType.name,
        pricePerTicket: selectedTicketType.price,
        numberOfTickets,
        totalAmount,
        status: totalAmount === 0 ? 'confirmed' : 'pending_payment',
        paymentStatus: totalAmount === 0 ? 'free' : 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Decrement available seats
      transaction.update(eventRef, {
        availableSeats: FieldValue.increment(-numberOfTickets),
        bookingCount: FieldValue.increment(1),
      });

      // Create booking document
      transaction.set(bookingRef, booking);

      // Add booking to user's bookedEvents
      const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
      transaction.update(userRef, {
        bookedEvents: FieldValue.arrayUnion(eventId),
      });

      return booking;
    });
  }

  /**
   * getUserBookings — All bookings for a user.
   */
  async getUserBookings(userId, { status, page = 1, limit = 20 } = {}) {
    let query = db
      .collection(COLLECTIONS.BOOKINGS)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    if (status) query = query.where('status', '==', status);

    const snapshot = await query.limit(limit * page).get();
    const bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const offset = (page - 1) * limit;

    return {
      bookings: bookings.slice(offset, offset + limit),
      total: bookings.length,
      page,
      limit,
    };
  }

  /**
   * getBookingById — Single booking fetch with ownership check.
   */
  async getBookingById(bookingId, userId) {
    const doc = await db.collection(COLLECTIONS.BOOKINGS).doc(bookingId).get();

    if (!doc.exists) throw new AppError('Booking not found', 404);

    const booking = { id: doc.id, ...doc.data() };

    if (booking.userId !== userId) {
      throw new AppError('Not authorized to view this booking', 403);
    }

    return booking;
  }

  /**
   * confirmPayment — Confirms booking payment and generates QR-coded tickets.
   */
  async confirmPayment(bookingId, userId, { transactionId, paymentMethod }) {
    const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) throw new AppError('Booking not found', 404);

    const booking = bookingDoc.data();

    if (booking.userId !== userId) {
      throw new AppError('Not authorized', 403);
    }
    if (booking.status === 'confirmed') {
      throw new AppError('Booking already confirmed', 400);
    }

    // Update booking status
    await bookingRef.update({
      status: 'confirmed',
      paymentStatus: 'paid',
      transactionId: transactionId || null,
      paymentMethod: paymentMethod || null,
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Generate tickets
    const tickets = await this._generateTickets(booking, bookingId);

    return { success: true, bookingId, tickets };
  }

  /**
   * cancelBooking — Cancels booking and restores available seats.
   */
  async cancelBooking(bookingId, userId) {
    const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(bookingId);
    const eventRef = db.collection(COLLECTIONS.EVENTS).doc((await bookingRef.get()).data().eventId);

    return db.runTransaction(async (transaction) => {
      const bookingDoc = await transaction.get(bookingRef);

      if (!bookingDoc.exists) throw new AppError('Booking not found', 404);

      const booking = bookingDoc.data();
      if (booking.userId !== userId) throw new AppError('Not authorized', 403);
      if (booking.status === 'cancelled') throw new AppError('Already cancelled', 400);

      transaction.update(bookingRef, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      transaction.update(eventRef, {
        availableSeats: FieldValue.increment(booking.numberOfTickets),
        bookingCount: FieldValue.increment(-1),
      });

      return { success: true };
    });
  }

  /**
   * _generateTickets — Internal: creates ticket documents with QR codes.
   */
  async _generateTickets(booking, bookingId) {
    const batch = db.batch();
    const tickets = [];

    for (let i = 0; i < booking.numberOfTickets; i++) {
      const ticketRef = db.collection(COLLECTIONS.TICKETS).doc();
      const ticketCode = uuidv4();

      const qrPayload = JSON.stringify({
        ticketId: ticketRef.id,
        bookingId,
        eventId: booking.eventId,
        userId: booking.userId,
        code: ticketCode,
      });

      const qrCode = await QRCode.toDataURL(qrPayload);

      const ticket = {
        id: ticketRef.id,
        bookingId,
        eventId: booking.eventId,
        userId: booking.userId,
        ticketType: booking.ticketType,
        ticketCode,
        qrCode,
        status: 'valid',
        isCheckedIn: false,
        checkedInAt: null,
        eventTitle: booking.eventTitle,
        eventDate: booking.eventDate,
        venue: booking.venue,
        createdAt: new Date().toISOString(),
      };

      batch.set(ticketRef, ticket);
      tickets.push(ticket);
    }

    await batch.commit();
    return tickets;
  }
}

module.exports = new BookingService();
