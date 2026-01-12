require('dotenv').config();
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { dbHelpers } = require('./database');
const { sendEmailWithQR } = require('./emailService');
const { generateQRCode } = require('./qrService');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Admin credentials (in production, use environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'match-attendance-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: 'auto', // Automatically set based on connection
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    return next();
  } else {
    return res.status(401).json({ error: 'Authentication required' });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Email configuration test endpoint (for debugging)
app.get('/api/test-email', async (req, res) => {
  const { transporter } = require('./emailService');
  try {
    await transporter.verify();
    res.json({ 
      success: true, 
      message: 'Email configuration is correct',
      config: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        user: process.env.SMTP_USER ? '***configured***' : 'NOT SET',
        pass: process.env.SMTP_PASS ? '***configured***' : 'NOT SET'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      config: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        user: process.env.SMTP_USER ? '***configured***' : 'NOT SET',
        pass: process.env.SMTP_PASS ? '***configured***' : 'NOT SET'
      },
      hint: 'Check your SMTP credentials in environment variables'
    });
  }
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    req.session.username = username;
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check authentication status
app.get('/api/auth/status', (req, res) => {
  res.json({ 
    authenticated: req.session && req.session.authenticated || false 
  });
});

// Submit form
app.post('/api/submit', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Name and email are required' 
      });
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingAttendee = await dbHelpers.findByEmail(normalizedEmail);
    if (existingAttendee) {
      return res.status(400).json({ 
        error: 'This email has already been registered. Each email can only register once.' 
      });
    }

    // Generate unique QR code
    const qr_code = uuidv4();
    const qr_code_data = JSON.stringify({
      id: qr_code,
      name: name,
      email: normalizedEmail,
      timestamp: new Date().toISOString()
    });

    // Set expiry date (7 days from now by default, or from env variable)
    const expiryDays = process.env.QR_EXPIRY_DAYS || 7;
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + parseInt(expiryDays));
    const expires_at_iso = expires_at.toISOString();

    // Save to database
    let attendee;
    try {
      attendee = await dbHelpers.insertAttendee({
        name,
        email: normalizedEmail,
        phone,
        qr_code,
        qr_code_data,
        expires_at: expires_at_iso
      });
    } catch (dbError) {
      // Handle database constraint errors (in case unique constraint exists)
      if (dbError.message && dbError.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ 
          error: 'This email has already been registered. Each email can only register once.' 
        });
      }
      throw dbError; // Re-throw if it's a different error
    }

    // Generate QR code image
    const qrCodeBuffer = await generateQRCode(qr_code_data);

    // Send email with QR code
    await sendEmailWithQR(normalizedEmail, name, qrCodeBuffer, qr_code, expires_at_iso);

    res.json({ 
      success: true, 
      message: 'Form submitted successfully! Check your email for the QR code.',
      attendee_id: attendee.id
    });

  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ 
      error: 'Failed to submit form. Please try again.' 
    });
  }
});

// Verify/Scan QR code (protected)
app.post('/api/verify', requireAuth, async (req, res) => {
  try {
    let { qr_code } = req.body;

    if (!qr_code) {
      return res.status(400).json({ 
        error: 'QR code is required' 
      });
    }

    // Handle case where QR code might be JSON string
    qr_code = qr_code.trim();
    try {
      const qrData = JSON.parse(qr_code);
      if (qrData.id) {
        qr_code = qrData.id;
        console.log('Extracted UUID from JSON QR code:', qr_code);
      }
    } catch (e) {
      // Not JSON, use as-is (should be UUID)
      console.log('QR code is UUID:', qr_code);
    }

    // Find attendee by QR code
    const attendee = await dbHelpers.findByQRCode(qr_code);

    if (!attendee) {
      return res.status(404).json({ 
        valid: false,
        message: 'QR code not found' 
      });
    }

    if (attendee.is_used) {
      return res.json({ 
        valid: false,
        used: true,
        message: 'QR code has already been used',
        attendee: {
          name: attendee.name,
          email: attendee.email,
          used_at: attendee.used_at
        }
      });
    }

    // Check if QR code has expired
    if (attendee.expires_at) {
      const expiresAt = new Date(attendee.expires_at);
      const now = new Date();
      if (now > expiresAt) {
        return res.json({ 
          valid: false,
          expired: true,
          message: `QR code has expired on ${expiresAt.toLocaleDateString()}`,
          attendee: {
            name: attendee.name,
            email: attendee.email,
            expires_at: attendee.expires_at
          }
        });
      }
    }

    // Mark as used
    const result = await dbHelpers.markAsUsed(qr_code);

    if (result.changes > 0) {
      res.json({ 
        valid: true,
        used: false,
        message: 'QR code verified successfully',
        attendee: {
          name: attendee.name,
          email: attendee.email,
          phone: attendee.phone
        }
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to mark QR code as used' 
      });
    }

  } catch (error) {
    console.error('Error verifying QR code:', error);
    res.status(500).json({ 
      error: 'Failed to verify QR code' 
    });
  }
});

// Check QR code status (without marking as used) (protected)
app.post('/api/check', requireAuth, async (req, res) => {
  try {
    const { qr_code } = req.body;

    if (!qr_code) {
      return res.status(400).json({ 
        error: 'QR code is required' 
      });
    }

    const attendee = await dbHelpers.findByQRCode(qr_code);

    if (!attendee) {
      return res.json({ 
        valid: false,
        message: 'QR code not found' 
      });
    }

    // Check if expired
    let expired = false;
    if (attendee.expires_at) {
      const expiresAt = new Date(attendee.expires_at);
      const now = new Date();
      expired = now > expiresAt;
    }

    res.json({ 
      valid: !expired,
      used: attendee.is_used === 1,
      expired: expired,
      attendee: {
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone,
        used_at: attendee.used_at,
        created_at: attendee.created_at,
        expires_at: attendee.expires_at
      }
    });

  } catch (error) {
    console.error('Error checking QR code:', error);
    res.status(500).json({ 
      error: 'Failed to check QR code' 
    });
  }
});

// Get statistics (admin endpoint) (protected)
app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const stats = await dbHelpers.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ 
      error: 'Failed to get statistics' 
    });
  }
});

// Get all attendees (admin endpoint) (protected)
app.get('/api/attendees', requireAuth, async (req, res) => {
  try {
    const attendees = await dbHelpers.getAllAttendees();
    res.json(attendees);
  } catch (error) {
    console.error('Error getting attendees:', error);
    res.status(500).json({ 
      error: 'Failed to get attendees' 
    });
  }
});

// Load SSL certificates
let httpsOptions = null;
try {
  if (fs.existsSync('cert.pem') && fs.existsSync('key.pem')) {
    httpsOptions = {
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('cert.pem')
    };
    console.log('SSL certificates loaded');
  }
} catch (error) {
  console.log('Could not load SSL certificates:', error.message);
}

// Start HTTP server
// In production (cloud platforms), use PORT from environment
// In local development, use PORT 3000
const httpServer = http.createServer(app);
const serverPort = process.env.PORT || PORT;
httpServer.listen(serverPort, () => {
  console.log(`Server running on port ${serverPort}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`HTTP Server: http://localhost:${serverPort}`);
    console.log(`Access from same device: http://localhost:${serverPort}`);
  }
});

// Start HTTPS server (for mobile access in local development)
// In production, cloud platforms provide HTTPS automatically
if (httpsOptions && process.env.NODE_ENV !== 'production') {
  const httpsServer = https.createServer(httpsOptions, app);
  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`HTTPS Server running on https://localhost:${HTTPS_PORT}`);
    console.log(`Access from mobile: https://YOUR_IP:${HTTPS_PORT}`);
    console.log(`⚠️  You'll need to accept the security warning (self-signed certificate)`);
  });
} else if (process.env.NODE_ENV !== 'production') {
  console.log('⚠️  HTTPS not available - camera will not work on iOS Safari via IP address');
  console.log('   Camera requires HTTPS when accessing via IP (not localhost)');
  console.log('   In production, your platform will provide HTTPS automatically');
}
