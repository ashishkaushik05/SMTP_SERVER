const Email = require('../models/Email');

// Get all emails with pagination
exports.getEmails = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const emails = await Email.find()
      .sort({ receivedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Email.countDocuments();
    
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
    const email = await Email.findById(req.params.id);
    
    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
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
    
    if (q) {
      if (field === 'from') {
        query = { 'from.text': { $regex: q, $options: 'i' } };
      } else if (field === 'to') {
        query = { 'to.text': { $regex: q, $options: 'i' } };
      } else if (field === 'subject') {
        query = { subject: { $regex: q, $options: 'i' } };
      } else {
        // Search in all fields
        query = {
          $or: [
            { 'from.text': { $regex: q, $options: 'i' } },
            { 'to.text': { $regex: q, $options: 'i' } },
            { subject: { $regex: q, $options: 'i' } },
            { text: { $regex: q, $options: 'i' } }
          ]
        };
      }
    }
    
    const emails = await Email.find(query)
      .sort({ receivedAt: -1 })
      .skip(skip)
      .limit(limit);
    
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