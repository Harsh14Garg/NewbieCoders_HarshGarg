const Joi = require('joi');

// Validation schemas
const schemas = {
  userSignup: Joi.object({
    name: Joi.string().required().min(2).max(100).messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
    }),
    password: Joi.string().required().min(8).messages({
      'string.min': 'Password must be at least 8 characters',
    }),
    role: Joi.string().valid('attendee', 'organizer').default('attendee'),
  }),

  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  eventCreate: Joi.object({
    title: Joi.string().required().max(200),
    description: Joi.string().required().max(2000),
    category: Joi.string().required().valid('music', 'sports', 'tech', 'arts', 'food', 'fitness', 'education', 'networking', 'eco', 'other'),
    venue: Joi.string().required(),
    dateTime: Joi.date().required().greater('now'),
    endDateTime: Joi.date().required().min(Joi.ref('dateTime')),
    location: Joi.object({
      coordinates: Joi.array().length(2).required().items(Joi.number()),
      address: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      country: Joi.string(),
    }).required(),
    pricingTiers: Joi.object({
      earlyBird: Joi.object({
        price: Joi.number().min(0),
        quantity: Joi.number().min(0),
        endDate: Joi.date(),
      }),
      regular: Joi.object({
        price: Joi.number().required().min(0),
        quantity: Joi.number().required().min(1),
      }),
      lastMinute: Joi.object({
        price: Joi.number().min(0),
        quantity: Joi.number().min(0),
        startDate: Joi.date(),
      }),
    }).required(),
    totalTickets: Joi.number().required().min(1),
  }),

  bookingCreate: Joi.object({
    eventId: Joi.string().required(),
    numberOfTickets: Joi.number().required().min(1),
    ticketType: Joi.string().valid('earlyBird', 'regular', 'lastMinute').required(),
    specialRequests: Joi.string().max(500),
  }),
};

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
    }

    req.validatedData = value;
    next();
  };
};

module.exports = {
  schemas,
  validateRequest,
};
