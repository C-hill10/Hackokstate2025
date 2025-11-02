/**
 * Sensor HTTP Server for Crowd Level Updates
 * 
 * This HTTP server receives sensor updates via POST requests and updates crowdLevel in Firestore
 * 
 * Prerequisites:
 * 1. Install dependencies: npm install firebase-admin express
 * 2. Download service account key from Firebase Console:
 *    - Project Settings > Service Accounts > Generate New Private Key
 *    - Save as 'service-account-key.json' in project root
 * 3. Configure server in 'sensor-config.json'
 * 
 * Usage:
 *   node sensor-daemon.js
 * 
 * API Endpoint:
 *   POST http://localhost:3000/api/update-crowd-level
 *   Body: { "locationId": "kerr-drummond", "crowdLevel": 45, "apiKey": "your-api-key" }
 * 
 * To run as a daemon:
 *   - Windows: Use pm2 or nssm
 *   - Linux/Mac: Use pm2 or systemd
 */

const admin = require('firebase-admin');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Collection name - must match your app code
const COLLECTION_NAME = 'dininglocations';

// Default configuration
const DEFAULT_CONFIG = {
    server: {
        port: 3000,
        host: '0.0.0.0', // Listen on all interfaces
    },
    security: {
        apiKey: null, // Set this in sensor-config.json for authentication
        requireApiKey: false, // Set to true to require API key authentication
    },
    firestore: {
        batchSize: 10, // Number of updates per batch
    rateLimit: {
            windowMs: 60000, // 1 minute
            maxRequests: 100, // Max requests per window
        }
    },
    logging: {
        level: 'info', // 'debug', 'info', 'warn', 'error'
        file: null, // Optional log file path
    }
};

// Initialize Firebase Admin
function initFirebase() {
    try {
        const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
        
        if (!fs.existsSync(serviceAccountPath)) {
            console.error('❌ service-account-key.json not found!');
            console.log('💡 Download it from Firebase Console > Project Settings > Service Accounts');
            return false;
        }

        const serviceAccount = require(serviceAccountPath);

        // Only initialize if not already initialized
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }

        console.log('✅ Firebase Admin initialized');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error.message);
        return false;
    }
}

// Load sensor configuration
function loadConfig() {
    const configPath = path.join(__dirname, 'sensor-config.json');
    
    if (!fs.existsSync(configPath)) {
        console.warn('⚠️  sensor-config.json not found. Using default configuration.');
        console.log('💡 Creating example sensor-config.json...');
        createExampleConfig(configPath);
        return DEFAULT_CONFIG;
    }

    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        // Merge with defaults, giving priority to loaded config
        return {
            ...DEFAULT_CONFIG,
            ...config,
            server: { ...DEFAULT_CONFIG.server, ...(config.server || {}) },
            security: { ...DEFAULT_CONFIG.security, ...(config.security || {}) },
            firestore: { ...DEFAULT_CONFIG.firestore, ...(config.firestore || {}) },
            logging: { ...DEFAULT_CONFIG.logging, ...(config.logging || {}) },
        };
    } catch (error) {
        console.error('❌ Error loading sensor-config.json:', error.message);
        console.log('💡 Using default configuration.');
        return DEFAULT_CONFIG;
    }
}

// Create example configuration file
function createExampleConfig(configPath) {
    const exampleConfig = {
        server: {
            port: 3000,
            host: "0.0.0.0"
        },
        security: {
            apiKey: "change-me-to-a-secure-random-string",
            requireApiKey: false
        },
        firestore: {
            batchSize: 10
        },
        logging: {
            level: "info",
            file: null
        }
    };

    fs.writeFileSync(configPath, JSON.stringify(exampleConfig, null, 2));
    console.log(`✅ Created example config at ${configPath}`);
}

// Logger utility
class Logger {
    constructor(config) {
        this.level = config.logging?.level || 'info';
        this.logFile = config.logging?.file || null;
        this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
    }

    log(level, message, data = null) {
        const levelNum = this.levels[level] || 1;
        const configLevelNum = this.levels[this.level] || 1;

        if (levelNum >= configLevelNum) {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
            
            if (data) {
                console.log(logMessage, data);
            } else {
                console.log(logMessage);
            }

            // Write to log file if configured
            if (this.logFile) {
                try {
                    fs.appendFileSync(
                        this.logFile,
                        logMessage + (data ? ' ' + JSON.stringify(data) : '') + '\n'
                    );
                } catch (error) {
                    // Silently fail if log file write fails
                }
            }
        }
    }

    debug(message, data) { this.log('debug', message, data); }
    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
}

// Simple rate limiting (in-memory, resets on restart)
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

// Start HTTP server
function startServer() {
    console.log('🌐 Starting Sensor HTTP Server...');
    console.log('==========================\n');

    if (!initFirebase()) {
        process.exit(1);
    }

    const config = loadConfig();
    const logger = new Logger(config);
    const app = express();
    const rateLimiter = new SimpleRateLimiter(
        config.firestore?.rateLimit?.windowMs || 60000,
        config.firestore?.rateLimit?.maxRequests || 100
    );

    // Middleware
    app.use(express.json({ 
        strict: true
    }));
    app.use(express.urlencoded({ extended: true }));

    // Request logging middleware
    app.use((req, res, next) => {
        logger.debug(`${req.method} ${req.path}`, {
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
        next();
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            service: 'sensor-daemon'
        });
    });

    // API information endpoint
    app.get('/api', (req, res) => {
        res.json({
            service: 'Sensor Crowd Level Update API',
            version: '1.0.0',
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
        const clientIp = req.ip || req.connection.remoteAddress;

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

    // Error handler (must be last middleware)
    app.use((err, req, res, next) => {
        // Handle JSON parsing errors
        if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
            logger.warn('JSON parse error:', err.message, { body: err.body });
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

    // Start server
    const port = config.server?.port || 3000;
    const host = config.server?.host || '0.0.0.0';

    const server = app.listen(port, host, () => {
        logger.info(`Sensor HTTP Server started`);
        logger.info(`Listening on http://${host}:${port}`);
        logger.info(`Health check: http://${host}:${port}/health`);
        logger.info(`API info: http://${host}:${port}/api`);
        
        if (config.security?.requireApiKey) {
            logger.warn(`⚠️  API key authentication is ENABLED`);
        } else {
            logger.warn(`⚠️  API key authentication is DISABLED (not recommended for production)`);
        }
    });

    // Graceful shutdown
    const shutdown = () => {
        console.log('\n\n🛑 Shutting down Sensor HTTP Server...');
        
        server.close(() => {
            console.log('✅ HTTP server closed');
            
            // Clean up Firebase Admin
            if (admin.apps.length) {
                admin.app().delete().then(() => {
                    console.log('✅ Cleanup complete');
                    process.exit(0);
                }).catch((error) => {
                    console.error('❌ Error during cleanup:', error);
                    process.exit(1);
                });
            } else {
                process.exit(0);
            }
        });

        // Force close after 10 seconds
        setTimeout(() => {
            console.error('❌ Forced shutdown');
            process.exit(1);
        }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
        logger.error('❌ Uncaught Exception:', error);
        shutdown();
    });

    return server;
}

// Start the server
if (require.main === module) {
    try {
        startServer();
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

module.exports = { startServer, updateCrowdLevel };
