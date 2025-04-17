const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', protect, getProfile);

module.exports = router; 