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
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new winston.transports.File({ filename: path.join(__dirname, '..', 'logs', 'error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(__dirname, '..', 'logs', 'combined.log') }),
    ],
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
}

// Create a stream object with a 'write' function that will be used by `morgan` (if we add it later) or simple middlewares
logger.stream = {
    write: function(message) {
        // Use the 'info' log level so the output will be picked up by both transports (file and console)
        logger.info(message.trim());
    },
};

module.exports = logger;
