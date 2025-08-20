const express = require('express');
const authRoutes = require('./auth.routes');
const applicationRoutes = require('./application.routes');
const notificationRoutes = require('./notification.routes');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'SelfiNotify API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/applications', applicationRoutes);
router.use('/notifications', notificationRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

module.exports = router;

