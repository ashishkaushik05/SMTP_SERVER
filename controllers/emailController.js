const Email = require('../models/Email');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Get emails with pagination - filtered by user role
exports.getEmails = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // If user is not admin, only show emails for this user
    if (req.user.role !== 'admin') {
      query.recipients = req.user._id;
    }
    
    const emails = await Email.find(query)
      .sort({ receivedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('recipients', 'username email');
    
    const total = await Email.countDocuments(query);
    
    res.json({
      success: true,
      count: emails.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      emails
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching emails'
    });
  }
};

// Get a single email by ID
exports.getEmailById = async (req, res) => {
  try {
    const email = await Email.findById(req.params.id)
      .populate('recipients', 'username email');
    
    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }
    
    // Check if user is admin or a recipient of the email
    if (req.user.role !== 'admin' && !email.recipients.some(recipient => recipient._id.equals(req.user._id))) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this email'
      });
    }
    
    res.json({
      success: true,
      email
    });
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching email'
    });
  }
};

// Search emails
exports.searchEmails = async (req, res) => {
  try {
    const { q, field } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // If user is not admin, only show emails for this user
    if (req.user.role !== 'admin') {
      query.recipients = req.user._id;
    }
    
    if (q) {
      if (field === 'from') {
        query['from.text'] = { $regex: q, $options: 'i' };
      } else if (field === 'to') {
        query['to.text'] = { $regex: q, $options: 'i' };
      } else if (field === 'subject') {
        query.subject = { $regex: q, $options: 'i' };
      } else {
        // Search in all fields
        const textQuery = { $text: { $search: q } };
        
        // If using text search, maintain the user filter
        if (req.user.role !== 'admin') {
          query = { 
            $and: [
              textQuery,
              { recipients: req.user._id }
            ]
          };
        } else {
          query = textQuery;
        }
      }
    }
    
    const emails = await Email.find(query)
      .sort({ receivedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('recipients', 'username email');
    
    const total = await Email.countDocuments(query);
    
    res.json({
      success: true,
      count: emails.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      emails
    });
  } catch (error) {
    console.error('Error searching emails:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching emails'
    });
  }
};

// Send an email
exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 25,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Prepare email data
    const mailOptions = {
      from: req.user.email,
      to,
      subject,
      text,
      html
    };
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    
    // Save the sent email to database
    const emailDoc = {
      from: {
        text: req.user.email,
        value: [{ address: req.user.email, name: req.user.username }]
      },
      to: {
        text: to,
        value: [{ address: to }]
      },
      subject,
      text,
      html,
      date: new Date(),
      receivedAt: new Date(),
      messageId: info.messageId,
      isSent: true
    };
    
    // Check if recipient is a user in our system
    const recipientUser = await User.findOne({ email: to });
    if (recipientUser) {
      emailDoc.recipients = [recipientUser._id];
      
      // Add reference to user's emails array
      await User.findByIdAndUpdate(
        recipientUser._id,
        { $push: { emails: emailDoc._id } }
      );
    }
    
    const savedEmail = await Email.create(emailDoc);
    
    res.status(201).json({
      success: true,
      message: 'Email sent successfully',
      email: savedEmail
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending email'
    });
  }
}; 