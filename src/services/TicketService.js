const { db } = require('../config/firebase');
const COLLECTIONS = require('../models/collections');
const AppError = require('../utils/AppError');

class TicketService {
  /**
   * getUserTickets — All tickets for a user.
   */
  async getUserTickets(userId, { status, page = 1, limit = 20 } = {}) {
    let query = db
      .collection(COLLECTIONS.TICKETS)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    if (status) query = query.where('status', '==', status);

    const snapshot = await query.limit(limit * page).get();
    const tickets = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const offset = (page - 1) * limit;

    return {
      tickets: tickets.slice(offset, offset + limit),
      total: tickets.length,
      page,
      limit,
    };
  }

  /**
   * validateTicket — Validates a QR-scanned ticket code.
   */
  async validateTicket(qrCode) {
    let payload;
    try {
      payload = JSON.parse(qrCode);
    } catch {
      throw new AppError('Invalid QR code format', 400);
    }

    const { ticketId, code } = payload;
    const doc = await db.collection(COLLECTIONS.TICKETS).doc(ticketId).get();

    if (!doc.exists) throw new AppError('Ticket not found', 404);

    const ticket = { id: doc.id, ...doc.data() };

    if (ticket.ticketCode !== code) {
      throw new AppError('Invalid ticket code', 400);
    }
    if (ticket.status !== 'valid') {
      throw new AppError(`Ticket is ${ticket.status}`, 400);
    }

    return { valid: true, ticket };
  }

  /**
   * checkIn — Marks a ticket as checked in.
   */
  async checkIn(ticketId, organizerId) {
    const ticketRef = db.collection(COLLECTIONS.TICKETS).doc(ticketId);
    const ticketDoc = await ticketRef.get();

    if (!ticketDoc.exists) throw new AppError('Ticket not found', 404);

    const ticket = ticketDoc.data();

    if (ticket.isCheckedIn) {
      throw new AppError('Ticket already checked in', 400);
    }
    if (ticket.status !== 'valid') {
      throw new AppError(`Ticket is ${ticket.status}`, 400);
    }

    // Verify organizer owns the event
    const eventDoc = await db.collection(COLLECTIONS.EVENTS).doc(ticket.eventId).get();
    if (!eventDoc.exists || eventDoc.data().organizerId !== organizerId) {
      throw new AppError('Not authorized to check in for this event', 403);
    }

    await ticketRef.update({
      isCheckedIn: true,
      checkedInAt: new Date().toISOString(),
      status: 'used',
    });

    return { success: true, ticketId, checkedInAt: new Date().toISOString() };
  }

  /**
   * getTicketById — Fetch single ticket (owner or organizer).
   */
  async getTicketById(ticketId, userId) {
    const doc = await db.collection(COLLECTIONS.TICKETS).doc(ticketId).get();

    if (!doc.exists) throw new AppError('Ticket not found', 404);

    const ticket = { id: doc.id, ...doc.data() };

    if (ticket.userId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    return ticket;
  }
}

module.exports = new TicketService();
