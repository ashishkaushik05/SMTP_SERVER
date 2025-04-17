const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const smtpServer = require('./smtpServer');
const { createAdminUser } = require('./controllers/userController');

// Import routes
const userRoutes = require('./routes/userRoutes');
const emailRoutes = require('./routes/emailRoutes');

// Initialize express app
const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/users', userRoutes);
app.use('/api/emails', emailRoutes);

// Simple route for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Changed from 3000 to 80 for standard HTTP
const PORT = process.env.PORT || 80;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Create an initial admin user
    await createAdminUser();
    
    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Web server running on port ${PORT}`);
    });
    
    // Start the SMTP server
    smtpServer.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 