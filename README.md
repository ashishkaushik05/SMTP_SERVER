# SMTP Server with MongoDB Email Storage

This is a simple SMTP server that receives emails and saves them to a MongoDB database with a web dashboard for management.

## Prerequisites

- Node.js
- MongoDB installed and running

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=80
   SMTP_PORT=25
   ```

3. Make sure MongoDB is running and accessible with the URI provided in the `.env` file.

## Usage

Start the server:

```
npm start
```

The service will:
- Start the SMTP server on port 25
- Start the HTTP web dashboard on port 80

Since both ports are privileged (below 1024), you may need to run with sudo privileges on Unix-like systems:

```
sudo npm start
```

For development without requiring sudo, use:

```
npm run dev
```

This will start the HTTP server on port 3000 instead of 80. You can access the dashboard at http://localhost:3000.

If you want to use different ports, you can set environment variables:

```
PORT=8080 npm start
```

## Web Dashboard

A web-based dashboard is available at http://localhost after starting the server. The dashboard provides:

- Email viewing and searching
- User management with authentication
- Email details with HTML/text content viewing

Default admin credentials:
- Email: admin@example.com
- Password: adminPassword123

## Testing the SMTP Server

You can test sending emails to this server using various mail clients or the `mail` command:

```
echo "This is a test email" | mail -s "Test Subject" user@yourdomain.com
```

Or using tools like swaks:

```
swaks --to user@example.com --server localhost
```

## Email Storage

All received emails are stored in the `emails` collection in the `emailStore` database with the following structure:

- from: Sender information
- to: Recipient information
- subject: Email subject
- text: Plain text content
- html: HTML content (if available)
- attachments: Any email attachments
- headers: Email headers
- date: Email date from headers
- receivedAt: Timestamp when the server received the email
- messageId: Unique email message ID