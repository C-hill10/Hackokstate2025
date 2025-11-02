/**
 * Firebase Cloud Functions for Sensor Crowd Level Updates
 * 
 * This Cloud Function provides an HTTP API endpoint for updating crowd levels in Firestore
 * 
 * Endpoints:
 * - POST /api/update-crowd-level
 * - GET /health
 * - GET /api
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin (automatically initialized in Cloud Functions)
admin.initializeApp();

// Collection name - must match your app code
const COLLECTION_NAME = 'dininglocations';

// Default configuration (can be overridden by environment variables)
const DEFAULT_CONFIG = {
    security: {
        apiKey: process.env.API_KEY || null,
        requireApiKey: process.env.REQUIRE_API_KEY === 'true' || false,
    },
    firestore: {
        rateLimit: {
            windowMs: 60000, // 1 minute
            maxRequests: 100, // Max requests per window
        }
    }
};

// Simple rate limiting (in-memory)
class SimpleRateLimiter {
    constructor(windowMs, maxRequests) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.requests = new Map();
    }

    check(identifier) {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        // Clean up old entries
        for (const [key, requests] of this.requests.entries()) {
            const filtered = requests.filter(time => time > windowStart);
            if (filtered.length === 0) {
                this.requests.delete(key);
            } else {
                this.requests.set(key, filtered);
            }
        }

        // Check current requests
        const userRequests = this.requests.get(identifier) || [];
        const recentRequests = userRequests.filter(time => time > windowStart);

        if (recentRequests.length >= this.maxRequests) {
            return false;
        }

        recentRequests.push(now);
        this.requests.set(identifier, recentRequests);
        return true;
    }
}

// Logger utility
class Logger {
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

        if (data) {
            console.log(logMessage, data);
        } else {
            console.log(logMessage);
        }
    }

    debug(message, data) { this.log('debug', message, data); }
    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
}

// Update crowd level in Firestore
async function updateCrowdLevel(locationId, crowdLevel, logger) {
    try {
        const db = admin.firestore();
        const locationRef = db.collection(COLLECTION_NAME).doc(locationId);

        // Check if document exists
        const docSnapshot = await locationRef.get();
        if (!docSnapshot.exists) {
            logger.warn(`Location ${locationId} not found in Firestore`);
            return { success: false, error: 'Location not found' };
        }

        // Get current crowd level
        const currentLevel = docSnapshot.data().crowdLevel || 0;

        // Only update if value changed (avoid unnecessary writes)
        if (Math.abs(currentLevel - crowdLevel) > 0.5) {
            await locationRef.update({
                crowdLevel: crowdLevel,
                lastSensorUpdate: admin.firestore.FieldValue.serverTimestamp()
            });

            logger.info(`Updated ${locationId}: ${currentLevel}% → ${crowdLevel}%`);
            return {
                success: true,
                previousLevel: currentLevel,
                newLevel: crowdLevel,
                locationId: locationId
            };
        } else {
            logger.debug(`Skipped ${locationId}: No change (${currentLevel}%)`);
            return {
                success: true,
                skipped: true,
                level: currentLevel,
                locationId: locationId
            };
        }
    } catch (error) {
        logger.error(`Error updating crowd level for ${locationId}:`, error.message);
        return { success: false, error: error.message };
    }
}

// Initialize Express app
const app = express();
const config = DEFAULT_CONFIG;
const logger = new Logger();
const rateLimiter = new SimpleRateLimiter(
    config.firestore?.rateLimit?.windowMs || 60000,
    config.firestore?.rateLimit?.maxRequests || 100
);

// CORS configuration
app.use(cors({ origin: true }));

// Middleware
app.use(express.json({ strict: true }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`, {
        ip: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.get('user-agent')
    });
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'sensor-daemon',
        environment: 'cloud-function'
    });
});

// API information endpoint
app.get('/api', (req, res) => {
    res.json({
        service: 'Sensor Crowd Level Update API',
        version: '1.0.0',
        environment: 'cloud-function',
        endpoints: {
            'POST /api/update-crowd-level': {
                description: 'Update crowd level for a location',
                body: {
                    locationId: 'string (required) - Firestore document ID',
                    crowdLevel: 'number (required) - 0-100',
                    apiKey: 'string (optional) - Required if authentication enabled'
                },
                example: {
                    locationId: 'kerr-drummond',
                    crowdLevel: 45,
                    apiKey: 'your-api-key'
                }
            },
            'GET /health': {
                description: 'Health check endpoint'
            }
        }
    });
});

// Main update endpoint
app.post('/api/update-crowd-level', async (req, res) => {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    // Rate limiting
    if (!rateLimiter.check(clientIp)) {
        logger.warn(`Rate limit exceeded for ${clientIp}`);
        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded. Please try again later.'
        });
    }

    // Validate API key if required
    if (config.security?.requireApiKey) {
        const providedKey = req.body.apiKey || req.headers['x-api-key'];
        const expectedKey = config.security?.apiKey;

        if (!providedKey || providedKey !== expectedKey) {
            logger.warn(`Invalid API key attempt from ${clientIp}`);
            return res.status(401).json({
                success: false,
                error: 'Invalid or missing API key'
            });
        }
    }

    // Validate request body
    const { locationId, crowdLevel } = req.body;

    if (!locationId) {
        return res.status(400).json({
            success: false,
            error: 'Missing required field: locationId'
        });
    }

    if (typeof crowdLevel !== 'number') {
        return res.status(400).json({
            success: false,
            error: 'Missing or invalid field: crowdLevel (must be a number)'
        });
    }

    // Validate crowd level range
    if (crowdLevel < 0 || crowdLevel > 100) {
        return res.status(400).json({
            success: false,
            error: 'crowdLevel must be between 0 and 100'
        });
    }

    // Update Firestore
    try {
        const result = await updateCrowdLevel(locationId, crowdLevel, logger);

        if (result.success) {
            if (result.skipped) {
                return res.status(200).json({
                    success: true,
                    message: 'No update needed (value unchanged)',
                    level: result.level,
                    locationId: result.locationId
                });
            } else {
                return res.status(200).json({
                    success: true,
                    message: 'Crowd level updated successfully',
                    previousLevel: result.previousLevel,
                    newLevel: result.newLevel,
                    locationId: result.locationId
                });
            }
        } else {
            return res.status(404).json(result);
        }
    } catch (error) {
        logger.error('Unexpected error updating crowd level:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path
    });
});

// Error handler
app.use((err, req, res, next) => {
    // Handle JSON parsing errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        logger.warn('JSON parse error:', err.message);
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON format in request body',
            details: 'Please ensure your JSON is properly formatted with quotes around property names and values'
        });
    }

    // Handle other errors
    logger.error('Express error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.status === 400 ? 'Bad request' : 'Internal server error'
    });
});

// Export as Firebase Cloud Function
// This creates an HTTP function that handles all routes
exports.api = functions.https.onRequest(app);

