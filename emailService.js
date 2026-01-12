const nodemailer = require('nodemailer');

// Email configuration
// Configure via .env file or GitHub Secrets
// For Gmail: Use App Password (not regular password)
// Determine if we should use secure connection (port 465 = SSL)
const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
const useSecure = smtpPort === 465;

const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: useSecure, // true for 465 (SSL), false for 587 (TLS)
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  // Connection timeout settings optimized for Railway
  // Increased timeouts for cloud platforms
  connectionTimeout: 30000, // 30 seconds (increased for SendGrid)
  greetingTimeout: 30000,
  socketTimeout: 30000, // 30 seconds for socket operations
  // Retry configuration
  pool: true, // Use connection pooling
  maxConnections: 1,
  maxMessages: 3,
  // Enable debug in development
  debug: process.env.NODE_ENV !== 'production',
  logger: process.env.NODE_ENV !== 'production',
  // TLS options for better compatibility with Railway
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates if needed
    minVersion: 'TLSv1.2'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Log configuration (without exposing password)
console.log('📧 Email Configuration:');
console.log(`   Host: ${emailConfig.host}`);
console.log(`   Port: ${emailConfig.port}`);
console.log(`   Secure: ${emailConfig.secure}`);
console.log(`   User: ${emailConfig.auth.user ? emailConfig.auth.user.substring(0, 3) + '***' : 'NOT SET'}`);
console.log(`   Password: ${emailConfig.auth.pass ? '***SET***' : 'NOT SET'}`);
console.log(`   Connection Timeout: ${emailConfig.connectionTimeout}ms`);
if (emailConfig.host === 'smtp.sendgrid.net') {
  console.log(`   Provider: SendGrid`);
  console.log(`   Sender Email: ${process.env.SENDER_EMAIL || emailConfig.auth.user || 'NOT SET'}`);
} else {
  console.log(`   Provider: Gmail`);
}

/**
 * Send email with QR code attachment
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {Buffer} qrCodeBuffer - QR code image buffer
 * @param {string} qrCode - QR code string
 * @param {string} expiresAt - Expiry date ISO string
 */
async function sendEmailWithQR(to, name, qrCodeBuffer, qrCode, expiresAt) {
  // Validate configuration before attempting to send
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    const error = new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
    console.error('❌ Email sending failed:', error.message);
    throw error;
  }

  // Wrap in timeout to prevent hanging connections
  const emailPromise = (async () => {
    try {
      console.log(`📧 Attempting to send email to ${to} via ${emailConfig.host}:${emailConfig.port}...`);
      // For SendGrid, use the verified sender email, not the API key
      // For Gmail, use the auth user
      const fromEmail = emailConfig.host === 'smtp.sendgrid.net' 
        ? process.env.SENDER_EMAIL || emailConfig.auth.user 
        : emailConfig.auth.user;
      
      const mailOptions = {
        from: `"Match Attendance" <${fromEmail}>`,
      to: to,
      subject: 'Your Match Attendance QR Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #1a1a1a;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .qr-container {
              text-align: center;
              margin: 30px 0;
              padding: 20px;
              background-color: white;
              border-radius: 5px;
            }
            .qr-code {
              max-width: 300px;
              margin: 0 auto;
            }
            .instructions {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Match Attendance Confirmation</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Thank you for registering for the match! Your attendance has been confirmed.</p>
            
            <div class="qr-container">
              <h3>Your QR Code</h3>
              <p>Please present this QR code at the venue entrance:</p>
              <img src="cid:qrcode" alt="QR Code" class="qr-code" />
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; border: 2px dashed #667eea;">
                <p style="font-size: 11px; color: #666; margin: 0 0 8px 0; font-weight: 600;">For Manual Entry (if camera doesn't work):</p>
                <p style="font-size: 14px; color: #333; font-family: monospace; background: white; padding: 12px; border-radius: 4px; word-break: break-all; margin: 0; border: 1px solid #ddd;">
                  ${qrCode}
                </p>
                <p style="font-size: 10px; color: #666; margin: 8px 0 0 0; font-style: italic;">
                  Copy this code and paste it in the manual entry field if needed
                </p>
              </div>
            </div>

            <div class="instructions">
              <strong>Important Instructions:</strong>
              <ul>
                <li>This QR code is unique to you and can only be used once</li>
                <li>Please arrive at least 30 minutes before the match starts</li>
                <li>Have your QR code ready on your phone or printed</li>
                <li>You can scan the QR code image OR copy the code above for manual entry</li>
                <li>Do not share your QR code with others</li>
                ${expiresAt ? `<li><strong>This QR code expires on: ${new Date(expiresAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></li>` : ''}
              </ul>
            </div>

            <p>We look forward to seeing you at the match!</p>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: 'qr-code.png',
          content: qrCodeBuffer,
          cid: 'qrcode' // Content ID for embedding in HTML
        }
      ]
    };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('❌ Error sending email:', error.message);
      console.error(`   Code: ${error.code || 'N/A'}`);
      console.error(`   Command: ${error.command || 'N/A'}`);
      console.error(`   Provider: ${emailConfig.host === 'smtp.sendgrid.net' ? 'SendGrid' : 'Gmail'}`);
      
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        if (emailConfig.host === 'smtp.sendgrid.net') {
          console.error('   💡 SendGrid Troubleshooting:');
          console.error('      - Verify SMTP_USER is exactly "apikey" (not your email)');
          console.error('      - Verify SMTP_PASS is your SendGrid API key (starts with SG.)');
          console.error('      - Check SendGrid Dashboard → Activity to see if emails are being sent');
          console.error('      - Make sure sender email is verified in SendGrid');
          console.error('      - Verify SMTP_HOST is "smtp.sendgrid.net"');
        } else {
          console.error('   💡 Gmail Troubleshooting:');
          console.error('      - Gmail blocks connections from Railway IPs (this is expected)');
          console.error('      - Switch to SendGrid: See SENDGRID_SETUP.md for instructions');
          console.error('      - Or try port 465 instead of 587 (set SMTP_PORT=465)');
          console.error('      - Verify Gmail App Password is correct (16 characters, no spaces)');
        }
      }
      throw error;
    }
  })();

  // Add 15 second timeout to prevent hanging connections
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Email sending timeout after 15 seconds')), 15000);
  });

  return Promise.race([emailPromise, timeoutPromise]);
}

// Verify email configuration (only in development, skip in production to avoid startup delays)
if (process.env.NODE_ENV !== 'production') {
  transporter.verify(function (error, success) {
    if (error) {
      console.log('⚠️  Email configuration warning:', error.message);
      console.log('   Email will be verified on first send attempt');
      console.log('   Make sure SMTP credentials are set in environment variables');
    } else {
      console.log('✅ Email server is ready to send messages');
    }
  });
} else {
  // In production, skip verification to avoid startup timeout
  console.log('📧 Email service configured (will verify on first send)');
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️  Warning: SMTP credentials not set in environment variables');
  }
}

module.exports = { sendEmailWithQR, transporter };
