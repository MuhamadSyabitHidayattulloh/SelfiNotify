const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');

// Import configurations and services
const config = require('./config');
const database = require('./config/database');
const socketService = require('./services/socket.service');
const apiRoutes = require('./api');

// Create Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
    origin: config.corsOrigin,
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Initialize Socket.IO
socketService.initialize(server);

// Make Socket.IO available to controllers
app.set('io', socketService.getIO());

// API Routes
app.use('/api', apiRoutes);

// Serve static files (for future frontend build)
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'SelfiNotify Server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Catch-all handler for SPA (Single Page Application)
app.get('*', (req, res) => {
    // Check if it's an API request
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    
    // For non-API requests, serve the frontend app
    const frontendPath = path.join(__dirname, '../../frontend/dist/index.html');
    res.sendFile(frontendPath, (err) => {
        if (err) {
            res.status(404).json({
                success: false,
                message: 'Frontend not found. Please build the frontend first.'
            });
        }
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Initialize database and start server
async function startServer() {
    try {
        // Connect to database
        await database.connect();
        console.log('Database connected successfully');

        // Start server
        server.listen(config.port, '0.0.0.0', () => {
            console.log('='.repeat(50));
            console.log('🚀 SelfiNotify Server Started');
            console.log('='.repeat(50));
            console.log(`📡 Server running on: http://localhost:${config.port}`);
            console.log(`🔌 WebSocket ready for connections`);
            console.log(`📊 API endpoints available at: http://localhost:${config.port}/api`);
            console.log(`❤️  Health check: http://localhost:${config.port}/health`);
            console.log('='.repeat(50));
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('HTTP server closed');
        database.close().then(() => {
            console.log('Database connection closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('HTTP server closed');
        database.close().then(() => {
            console.log('Database connection closed');
            process.exit(0);
        });
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the server
startServer();

module.exports = app;

