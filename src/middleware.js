
const db = require('./database.js');

// Middleware to check user access for games
const checkGameAccess = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).send('Unauthorized: Please log in to play games.');
    }

    db.get('SELECT subscription_type, daily_time_left, last_login_date FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err) {
            console.error('Error fetching user data for game access:', err.message);
            return res.status(500).send('Server error during access check.');
        }
        if (!user) {
            req.session.destroy(); // Clear invalid session
            return res.status(401).send('Unauthorized: User not found.');
        }

        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000; // Milliseconds in a day

        // Reset daily_time_left if it's a new day since last login
        if (user.last_login_date && (now - user.last_login_date) > oneDay) {
            user.daily_time_left = 900; // Reset to 15 minutes
            db.run('UPDATE users SET daily_time_left = ?, last_login_date = ? WHERE id = ?', [user.daily_time_left, now, req.session.userId], (updateErr) => {
                if (updateErr) console.error('Error resetting daily_time_left:', updateErr.message);
            });
        } else {
            // Update last_login_date on every access to keep it current
            db.run('UPDATE users SET last_login_date = ? WHERE id = ?', [now, req.session.userId], (updateErr) => {
                if (updateErr) console.error('Error updating last_login_date:', updateErr.message);
            });
        }

        if (user.subscription_type !== 'none') {
            // Check if subscription is still active
            if (user.subscription_end_date && user.subscription_end_date > now) {
                next(); // User has active subscription
            } else {
                // Subscription expired, update type to 'none'
                db.run('UPDATE users SET subscription_type = \'none\', subscription_end_date = NULL WHERE id = ?', [req.session.userId], (updateErr) => {
                    if (updateErr) console.error('Error updating expired subscription:', updateErr.message);
                });
                return res.status(403).send('Forbidden: Your subscription has expired. Please renew to continue playing.');
            }
        } else {
            // Free user: check daily time left
            if (user.daily_time_left > 0) {
                // For now, we'll just allow access. Time decrement will be handled later.
                // This middleware only checks if they *can* access, not how much time they've used in this session.
                next();
            } else {
                return res.status(403).send('Forbidden: You have used all your free daily game time. Please subscribe for unlimited access!');
            }
        }
    });
};

module.exports = { checkGameAccess };
