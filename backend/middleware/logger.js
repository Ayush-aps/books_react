/**
 * Enhanced Morgan Logging Middleware
 * Provides comprehensive logging for security, performance, and debugging
 */

const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const rfs = require('rotating-file-stream');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Create rotating write streams for different log types
const accessLogStream = rfs.createStream('access.log', {
    interval: '1d', // Rotate daily
    path: logsDir,
    maxFiles: 14, // Keep 14 days of logs
    compress: 'gzip' // Compress rotated files
});

const errorLogStream = rfs.createStream('error.log', {
    interval: '1d',
    path: logsDir,
    maxFiles: 30, // Keep errors for 30 days
    compress: 'gzip'
});

const securityLogStream = rfs.createStream('security.log', {
    interval: '1d',
    path: logsDir,
    maxFiles: 90, // Keep security logs for 90 days
    compress: 'gzip'
});

// Custom token for colored response time
morgan.token('colored-response-time', (req, res) => {
    const responseTime = parseFloat(morgan['response-time'](req, res));
    if (responseTime < 100) {
        return `\x1b[32m${responseTime}ms\x1b[0m`; // Green for fast
    } else if (responseTime < 500) {
        return `\x1b[33m${responseTime}ms\x1b[0m`; // Yellow for moderate
    } else {
        return `\x1b[31m${responseTime}ms\x1b[0m`; // Red for slow
    }
});

// Custom token for colored status code
morgan.token('colored-status', (req, res) => {
    const status = res.statusCode;
    if (status >= 500) {
        return `\x1b[31m${status}\x1b[0m`; // Red for server errors
    } else if (status >= 400) {
        return `\x1b[33m${status}\x1b[0m`; // Yellow for client errors
    } else if (status >= 300) {
        return `\x1b[36m${status}\x1b[0m`; // Cyan for redirects
    } else if (status >= 200) {
        return `\x1b[32m${status}\x1b[0m`; // Green for success
    }
    return status;
});

// Custom token for user info (if authenticated)
morgan.token('user-info', (req) => {
    if (req.user) {
        return `${req.user.role}:${req.user._id}`;
    }
    return 'anonymous';
});

// Development format (colorful and detailed)
const devFormat = ':method :url :colored-status :colored-response-time - :user-info';

// Production format (JSON for log aggregation tools)
const prodFormat = JSON.stringify({
    timestamp: ':date[iso]',
    method: ':method',
    url: ':url',
    status: ':status',
    responseTime: ':response-time',
    contentLength: ':res[content-length]',
    userAgent: ':user-agent',
    user: ':user-info',
    ip: ':remote-addr'
});

// Combined format for file logging
const combinedFormat = ':remote-addr - :user-info [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

/**
 * Main logger middleware
 * Uses different formats based on environment
 */
module.exports.requestLogger = process.env.NODE_ENV === 'production'
    ? [
        // Production: Log to files in JSON format
        morgan(prodFormat, { stream: accessLogStream }),
        // Also log errors separately
        morgan(combinedFormat, {
            stream: errorLogStream,
            skip: (req, res) => res.statusCode < 400
        })
    ]
    : [
        // Development: Colorful console output
        morgan(devFormat),
        // Still log to file for reference
        morgan(combinedFormat, { stream: accessLogStream })
    ];

/**
 * Security event logger
 * Logs authentication failures and suspicious activity
 */
module.exports.securityLogger = (event, req, details = {}) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        ip: req.ip || req.connection.remoteAddress,
        method: req.method,
        url: req.originalUrl || req.url,
        userAgent: req.get('user-agent'),
        user: req.user ? `${req.user.role}:${req.user._id}` : 'anonymous',
        ...details
    };

    // Write to security log file
    securityLogStream.write(JSON.stringify(logEntry) + '\n');

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
        console.log(`\x1b[35m[SECURITY]\x1b[0m ${event}:`, logEntry);
    }
};

/**
 * Slow request logger
 * Logs requests that take longer than threshold
 */
module.exports.slowRequestLogger = (thresholdMs = 1000) => {
    return (req, res, next) => {
        const startTime = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - startTime;
            if (duration > thresholdMs) {
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    event: 'SLOW_REQUEST',
                    duration: `${duration}ms`,
                    method: req.method,
                    url: req.originalUrl || req.url,
                    status: res.statusCode,
                    user: req.user ? `${req.user.role}:${req.user._id}` : 'anonymous'
                };

                // Log to file
                securityLogStream.write(JSON.stringify(logEntry) + '\n');

                // Console warning in development
                if (process.env.NODE_ENV !== 'production') {
                    console.warn(`\x1b[33m[SLOW REQUEST]\x1b[0m ${duration}ms - ${req.method} ${req.url}`);
                }
            }
        });

        next();
    };
};

/**
 * Skip logging for certain paths (health checks, static files)
 */
module.exports.skipPaths = ['/api/health', '/favicon.ico'];

module.exports.shouldSkipLogging = (req, res) => {
    return module.exports.skipPaths.some(path => req.url.startsWith(path));
};
