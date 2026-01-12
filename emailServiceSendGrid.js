const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
const sendGridApiKey = process.env.SMTP_PASS || process.env.SENDGRID_API_KEY;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

/**
 * Send email with QR code using SendGrid REST API
 * This is more reliable than SMTP for cloud platforms
 */
async function sendEmailWithQR(to, name, qrCodeBuffer, qrCode, expiresAt) {
  if (!sendGridApiKey) {
    const error = new Error('SendGrid API key not configured. Please set SENDGRID_API_KEY or SMTP_PASS environment variable.');
    console.error('❌ Email sending failed:', error.message);
    throw error;
  }

  // Use verified sender email
  const fromEmail = process.env.SENDER_EMAIL || 'merfan3746@gmail.com';
  
  console.log(`📧 Attempting to send email to ${to} via SendGrid REST API...`);
  console.log(`   From: ${fromEmail}`);
  console.log(`   To: ${to}`);

  try {
    // Convert QR code buffer to base64 for SendGrid
    const qrCodeBase64 = qrCodeBuffer.toString('base64');

    const msg = {
      to: to,
      from: {
        email: fromEmail,
        name: 'Match Attendance'
      },
      replyTo: fromEmail, // Add reply-to for better deliverability
      subject: 'Your Match Attendance QR Code',
      // Add categories for better tracking and deliverability
      categories: ['match-attendance', 'qr-code'],
      // Add custom headers to improve deliverability
      customArgs: {
        source: 'match-registration',
        type: 'qr-code'
      },
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
              <img src="data:image/png;base64,${qrCodeBase64}" alt="QR Code" class="qr-code" />
              
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
          content: qrCodeBase64,
          filename: 'qr-code.png',
          type: 'image/png',
          disposition: 'attachment'
        }
      ]
    };

    const response = await sgMail.send(msg);
    console.log(`✅ Email sent successfully via SendGrid API: ${response[0].statusCode}`);
    return response;
  } catch (error) {
    console.error('❌ Error sending email via SendGrid API:', error.message);
    if (error.response) {
      console.error(`   Status Code: ${error.response.statusCode}`);
      console.error(`   Body: ${JSON.stringify(error.response.body)}`);
      
      // Check for sender verification error
      if (error.response.body && error.response.body.errors) {
        const errors = error.response.body.errors;
        const senderError = errors.find(e => e.field === 'from' || e.message.includes('verified Sender Identity'));
        if (senderError) {
          console.error('   💡 SOLUTION:');
          console.error('      1. Go to SendGrid Dashboard → Settings → Sender Authentication');
          console.error('      2. Click "Verify a Single Sender"');
          console.error(`      3. Use email: ${fromEmail}`);
          console.error('      4. Fill in all required fields');
          console.error('      5. Check your email and click the verification link');
          console.error('      6. Wait for approval (usually instant)');
        }
      }
    }
    throw error;
  }
}

// Log configuration
console.log('📧 SendGrid REST API Configuration:');
console.log(`   API Key: ${sendGridApiKey ? '***SET***' : 'NOT SET'}`);
console.log(`   Sender Email: ${process.env.SENDER_EMAIL || 'merfan3746@gmail.com'} (must be verified in SendGrid)`);
if (!sendGridApiKey) {
  console.log('   ⚠️  Warning: SendGrid API key not set');
}

module.exports = { sendEmailWithQR };
