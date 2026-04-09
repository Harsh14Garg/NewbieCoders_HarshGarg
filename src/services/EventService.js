const { db, isDemoMode } = require('../config/firebase');
const COLLECTIONS = require('../models/collections');
const AppError = require('../utils/AppError');

// Sample data for Demo Mode
const MOCK_EVENTS = [
  {
    id: 'demo-event-1',
    title: 'Sonic Synthesis: Urban Beats 2024',
    description: 'Join 500+ local creators for the biggest audio-visual experience of the summer. Exclusive sets from neighborhood legends.',
    category: 'Music',
    organizerId: 'demo-organizer',
    startDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    venue: { name: 'Brooklyn Arts District', city: 'New York', coordinates: { latitude: 40.7128, longitude: -74.0060 } },
    ticketTypes: [{ name: 'Early Bird', price: 15, quantity: 100 }, { name: 'General', price: 25, quantity: 400 }],
    totalCapacity: 500,
    availableSeats: 488,
    images: ['https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070&auto=format&fit=crop'],
    isFeatured: true,
    isPublished: true,
    status: 'upcoming',
    viewCount: 1240,
    bookingCount: 12
  },
  {
    id: 'demo-event-2',
    title: 'Tech Frontiers Summit',
    description: 'The premier conference for developers exploring the edge of AI, Web3, and future robotics.',
    category: 'Workshop',
    organizerId: 'demo-organizer',
    startDate: new Date(Date.now() + 86400000 * 14).toISOString(),
    venue: { name: 'Convention Center', city: 'San Francisco', coordinates: { latitude: 37.7749, longitude: -122.4194 } },
    ticketTypes: [{ name: 'Standard', price: 199, quantity: 1000 }],
    totalCapacity: 1000,
    availableSeats: 850,
    images: ['https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=2070&auto=format&fit=crop'],
    isFeatured: true,
    isPublished: true,
    status: 'upcoming',
    viewCount: 3500,
    bookingCount: 150
  },
  {
    id: 'demo-event-3',
    title: 'Mindful Mornings: Yoga & Sound Bath',
    description: 'Reconnect with your breath in this guided morning session featuring immersive Tibetan singing bowls.',
    category: 'Wellness',
    organizerId: 'demo-organizer-2',
    startDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    venue: { name: 'Zen Garden', city: 'Los Angeles', coordinates: { latitude: 34.0522, longitude: -118.2437 } },
    ticketTypes: [{ name: 'Free', price: 0, quantity: 50 }],
    totalCapacity: 50,
    availableSeats: 5,
    images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1920&auto=format&fit=crop'],
    isFeatured: false,
    isPublished: true,
    status: 'upcoming',
    viewCount: 890,
    bookingCount: 45
  }
];

class EventService {
  async createEvent(eventData, organizerId) {
    if (isDemoMode) {
        const newEvent = { id: `demo-${Date.now()}`, ...eventData, organizerId, createdAt: new Date().toISOString() };
        MOCK_EVENTS.push(newEvent);
        return newEvent;
    }
    const { title, startDate, venue } = eventData;
    if (!title || !startDate || !venue) throw new AppError('Title, start date, and venue are required', 400);

    const event = { ...eventData, organizerId, availableSeats: eventData.totalCapacity || 100, createdAt: new Date().toISOString(), status: 'upcoming' };
    const docRef = await db.collection(COLLECTIONS.EVENTS).add(event);
    return { id: docRef.id, ...event };
  }

  async getEventById(eventId) {
    if (isDemoMode) {
      const event = MOCK_EVENTS.find(e => e.id === eventId);
      if (!event) throw new AppError('Event not found', 404);
      return event;
    }
    const doc = await db.collection(COLLECTIONS.EVENTS).doc(eventId).get();
    if (!doc.exists) throw new AppError('Event not found', 404);
    return { id: doc.id, ...doc.data() };
  }

  async listEvents(filters) {
    if (isDemoMode) {
      let events = [...MOCK_EVENTS];
      if (filters.category) events = events.filter(e => e.category === filters.category);
      if (filters.search) {
        const s = filters.search.toLowerCase();
        events = events.filter(e => e.title.toLowerCase().includes(s) || e.description.toLowerCase().includes(s));
      }
      return { events, total: events.length, page: 1, totalPages: 1 };
    }
    // Real Firestore logic
    let query = db.collection(COLLECTIONS.EVENTS).where('isPublished', '==', true);
    if (filters.category) query = query.where('category', '==', filters.category);
    const snapshot = await query.orderBy('startDate', 'asc').get();
    return { events: snapshot.docs.map(d => ({ id: d.id, ...d.data() })), total: snapshot.size };
  }

  async getTrendingEvents(limit = 10) {
    if (isDemoMode) return [...MOCK_EVENTS].sort((a,b) => b.bookingCount - a.bookingCount).slice(0, limit);
    const snapshot = await db.collection(COLLECTIONS.EVENTS).where('isPublished', '==', true).orderBy('bookingCount', 'desc').limit(limit).get();
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async getFeaturedEvents(limit = 10) {
    if (isDemoMode) return [...MOCK_EVENTS].filter(e => e.isFeatured).slice(0, limit);
    const snapshot = await db.collection(COLLECTIONS.EVENTS).where('isPublished', '==', true).where('isFeatured', '==', true).limit(limit).get();
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // Other methods would similar check isDemoMode...
  async getOrganizerEvents(organizerId) {
    if (isDemoMode) return { events: MOCK_EVENTS.filter(e => e.organizerId === organizerId), total: 0 };
    const snapshot = await db.collection(COLLECTIONS.EVENTS).where('organizerId', '==', organizerId).get();
    return { events: snapshot.docs.map(d => ({ id: d.id, ...d.data() })), total: snapshot.size };
  }
}

module.exports = new EventService();
