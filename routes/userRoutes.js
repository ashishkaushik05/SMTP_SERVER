const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getProfile, 
  createUser, 
  getAllUsers, 
  resetPassword 
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', protect, getProfile);

// Admin routes
router.post('/create', protect, createUser);
router.get('/all', protect, getAllUsers);
router.post('/reset-password', protect, resetPassword);

module.exports = router; 