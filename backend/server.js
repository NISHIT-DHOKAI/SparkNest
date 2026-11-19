require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? configuredOrigins
  : [...new Set([...configuredOrigins, 'http://localhost:5173', 'http://localhost:5174'])];

app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server/health checks with no Origin header.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./Routes/auth');
const userRoutes = require('./Routes/users');
const postRoutes = require('./Routes/posts');
const boardRoutes = require('./Routes/boards');
const reelRoutes = require('./Routes/reels');
const notificationRoutes = require('./Routes/notifications');
const chatRoutes = require('./Routes/chat');
const adminRoutes = require('./Routes/admin');
const searchRoutes = require('./Routes/search');


app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SparkNest API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not configured');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
