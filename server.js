const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');

dotenv.config();

// We will connect to the DB inside a middleware to ensure serverless compatibility

const app = express();

app.set('trust proxy', 1);

// =====================
// Security Middleware
// =====================

// يحمي الـ HTTP headers
app.use(helmet());

// Ensure DB is connected before handling any API requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    res.status(500).json({ message: 'Database connection failed' });
  }
});


// Rate Limiting — 1000 request كل 15 دقيقة (تم رفع الحد عشان ميقفلش وقت التيست)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  validate: { xForwardedForHeader: false },
  message: { message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Rate Limit أشد على الـ Auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
  validate: { xForwardedForHeader: false },
  message: { message: 'Too many login attempts, please try again later.' }
});
app.use('/api/auth', authLimiter);

// =====================
// General Middleware
// =====================
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// =====================
// Routes
// =====================
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/hotels', require('./src/routes/hotelRoutes'));
app.use('/api/destinations', require('./src/routes/destinationRoutes'));
app.use('/api/flights', require('./src/routes/flightRoutes'));
app.use('/api/bookings', require('./src/routes/bookingRoutes'));
app.use('/api/reviews', require('./src/routes/reviewRoutes'));
app.use('/api/gallery', require('./src/routes/galleryRoutes'));
app.use('/api/travel-offices', require('./src/routes/travelOfficeRoutes'));


// Test Route
app.get('/', (req, res) => {
  res.json({ message: 'Sufar API is running ...' });
});


// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// =====================
// Global Error Handler
// =====================
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `${field} already exists` });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Server Error'
  });
});

// Only listen when running locally (not on Vercel)
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;






























// https://sufar-rho.vercel.app/api/auth/forgot-password

   //nodemon server.js 
  // npm run dev
  // npm install cloudinary
  // node test.js
  //npm install cloudinary mongoose dotenv fs-extra path
  //npm install axios
  //  npm run seed
  //  git add .
  // git commit -m "update"
//  git add . && git commit -m "update" && git push

  // https://sufar-rho.vercel.app/

  //GET /api/hotels?city=cairo
//GET /api/hotels/:slug
