const SMTPServer = require('smtp-server').SMTPServer;
const streamToBuffer = require('stream-to-buffer');
const { simpleParser } = require('mailparser');
const Email = require('./models/Email');

// Create SMTP server
const server = new SMTPServer({
  logger: true,
  secure: false,
  authOptional: true,
  onData(stream, session, callback) {
    streamToBuffer(stream, async (err, buffer) => {
      if (err) {
        console.error('Error converting stream to buffer:', err);
        return callback(err);
      }

      try {
        // Parse the email
        const email = await simpleParser(buffer);
        
        // Prepare email document for MongoDB
        const emailDoc = {
          from: email.from,
          to: email.to,
          subject: email.subject,
          text: email.text,
          html: email.html,
          attachments: email.attachments,
          headers: email.headers,
          date: email.date,
          receivedAt: new Date(),
          messageId: email.messageId
        };

        // Save to MongoDB using Mongoose model
        const savedEmail = await Email.create(emailDoc);
        console.log(`Email saved to MongoDB with ID: ${savedEmail._id}`);

        callback();
      } catch (error) {
        console.error('Error processing email:', error);
        callback(error);
      }
    });
  }
});

// Handle SMTP server errors
server.on('error', (err) => {
  console.error('SMTP server error:', err);
});

// Function to start the SMTP server
const start = () => {
  const SMTP_PORT = process.env.SMTP_PORT || 25;
  server.listen(SMTP_PORT, '0.0.0.0', () => {
    console.log(`SMTP Server listening on port ${SMTP_PORT}`);
  });
};

// Function to stop the SMTP server
const stop = () => {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        console.error('Error closing SMTP server:', err);
        return reject(err);
      }
      console.log('SMTP server closed');
      resolve();
    });
  });
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await stop();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

module.exports = {
  start,
  stop,
  server
}; 