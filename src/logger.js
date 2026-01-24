const winston = require('winston');
const path = require('path');

// Define levels log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Create the logger instance
const logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { service: 'portal-jogos-service' },
    transports: [],
});

// Configure transports based on environment
if (process.env.NODE_ENV === 'production') {
    // In production (Vercel), only log to console (stdout/stderr)
    // Vercel file system is read-only for runtime logs
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.simple()
        ),
    }));
} else {
    // In development, log to files and console
    logger.add(new winston.transports.File({ filename: path.join(__dirname, '..', 'logs', 'error.log'), level: 'error' }));
    logger.add(new winston.transports.File({ filename: path.join(__dirname, '..', 'logs', 'combined.log') }));

    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
}

// (block removed - merged logic above)

// Create a stream object with a 'write' function that will be used by `morgan` (if we add it later) or simple middlewares
logger.stream = {
    write: function (message) {
        // Use the 'info' log level so the output will be picked up by both transports (file and console)
        logger.info(message.trim());
    },
};

module.exports = logger;
