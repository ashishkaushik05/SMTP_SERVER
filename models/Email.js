const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  content: Buffer,
  size: Number
});

const emailSchema = new mongoose.Schema({
  from: {
    value: [{ 
      address: String,
      name: String
    }],
    text: String
  },
  to: {
    value: [{ 
      address: String,
      name: String
    }],
    text: String
  },
  subject: String,
  text: String,
  html: String,
  attachments: [attachmentSchema],
  headers: Object,
  date: Date,
  receivedAt: {
    type: Date,
    default: Date.now
  },
  messageId: {
    type: String,
    unique: true,
    sparse: true
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isSent: {
    type: Boolean,
    default: false
  }
});

// Create index for faster searching
emailSchema.index({ 'from.text': 'text', 'to.text': 'text', 'subject': 'text', 'text': 'text' });

const Email = mongoose.model('Email', emailSchema);

module.exports = Email; 