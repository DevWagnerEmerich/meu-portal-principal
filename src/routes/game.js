
const express = require('express');
const db = require('../database.js');

const router = express.Router();

// API to signal game start
router.post('/game-start', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    db.get('SELECT subscription_type, daily_time_left FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err) {
            console.error('Error fetching user data for game start:', err.message);
            return res.status(500).json({ message: 'Server error' });
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.subscription_type === 'none' && user.daily_time_left <= 0) {
            return res.status(403).json({ message: 'Seu tempo diário de jogo acabou. Considere assinar para acesso ilimitado!' });
        }

        // Store the start time in session
        req.session.gameStartTime = Date.now();
        res.json({ message: 'Game start recorded', dailyTimeLeft: user.daily_time_left, subscriptionType: user.subscription_type });
    });
});

// API to signal game stop and update daily_time_left
router.post('/game-stop', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const gameStartTime = req.session.gameStartTime;
    if (!gameStartTime) {
        return res.status(400).json({ message: 'Game start time not recorded' });
    }

    const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000); // Duration in seconds

    db.get('SELECT subscription_type, daily_time_left FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err) {
            console.error('Error fetching user data for game stop:', err.message);
            return res.status(500).json({ message: 'Server error' });
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.subscription_type === 'none') {
            // Only decrement for free users
            const newDailyTimeLeft = Math.max(0, user.daily_time_left - gameDuration);
            db.run('UPDATE users SET daily_time_left = ? WHERE id = ?', [newDailyTimeLeft, req.session.userId], (updateErr) => {
                if (updateErr) {
                    console.error('Error updating daily_time_left:', updateErr.message);
                    return res.status(500).json({ message: 'Error updating game time' });
                }
                res.json({ message: 'Game time updated', newDailyTimeLeft: newDailyTimeLeft });
            });
        } else {
            // Subscribed users have unlimited time, just acknowledge stop
            res.json({ message: 'Game stop recorded (subscribed user)' });
        }
        delete req.session.gameStartTime; // Clear game start time from session
    });
});

module.exports = router;
