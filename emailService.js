const nodemailer = require('nodemailer');

// Email configuration
// Configure via .env file or GitHub Secrets
// For Gmail: Use App Password (not regular password)
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for 587 (Gmail uses 587)
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  // Add connection timeout settings for cloud platforms
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
  // Enable debug in development
  debug: process.env.NODE_ENV !== 'production',
  logger: process.env.NODE_ENV !== 'production'
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

/**
 * Send email with QR code attachment
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {Buffer} qrCodeBuffer - QR code image buffer
 * @param {string} qrCode - QR code string
 * @param {string} expiresAt - Expiry date ISO string
 */
async function sendEmailWithQR(to, name, qrCodeBuffer, qrCode, expiresAt) {
  try {
    const mailOptions = {
      from: `"Match Attendance" <${emailConfig.auth.user}>`,
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
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
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
