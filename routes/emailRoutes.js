const express = require('express');
const router = express.Router();
const { getEmails, getEmailById, searchEmails } = require('../controllers/emailController');
const { protect, restrictTo } = require('../middleware/auth');

// All email routes are protected
router.use(protect);

// Get all emails with pagination
router.get('/', getEmails);

// Search emails
router.get('/search', searchEmails);

// Get a single email by ID
router.get('/:id', getEmailById);

module.exports = router; 