# Render Deployment Troubleshooting

## Email Connection Timeout Error

If you see `Connection timeout` or `ETIMEDOUT` errors, follow these steps:

### 1. Check Environment Variables

Make sure all environment variables are set correctly in Render:

**Required Variables:**
- ✅ `SMTP_HOST` = `smtp.gmail.com`
- ✅ `SMTP_PORT` = `587` (as a number, not string)
- ✅ `SMTP_USER` = Your full Gmail address (e.g., `yourname@gmail.com`)
- ✅ `SMTP_PASS` = Your 16-character Gmail App Password (no spaces)

**How to verify in Render:**
1. Go to your service → Environment tab
2. Check that all SMTP variables are present
3. Make sure `SMTP_PASS` is your App Password (not regular password)
4. Make sure `SMTP_USER` is your full email address

### 2. Gmail App Password Issues

**Common mistakes:**
- ❌ Using regular Gmail password instead of App Password
- ❌ App Password has spaces (remove them)
- ❌ 2-Step Verification not enabled
- ❌ Wrong email address

**Fix:**
1. Go to: https://myaccount.google.com/apppasswords
2. Generate a new App Password
3. Copy the 16 characters (remove spaces)
4. Update `SMTP_PASS` in Render with the new password

### 3. Render Network/Firewall Issues

Render might have network restrictions. Try these:

**Option A: Use Port 465 (SSL) instead of 587 (TLS)**

Update in Render:
- `SMTP_PORT` = `465`
- Update `emailService.js` to use `secure: true` for port 465

**Option B: Check Render's Outbound Connections**

Some Render plans might restrict SMTP. Check:
- Render Dashboard → Your Service → Settings
- Look for network/firewall settings
- Free tier might have restrictions

### 4. Test Email Configuration

Add this test endpoint to verify email settings:

```javascript
// Add to server.js for testing
app.get('/api/test-email', async (req, res) => {
  try {
    await transporter.verify();
    res.json({ success: true, message: 'Email configuration is correct' });
  } catch (error) {
    res.json({ 
      success: false, 
      error: error.message,
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? '***set***' : 'NOT SET',
        pass: process.env.SMTP_PASS ? '***set***' : 'NOT SET'
      }
    });
  }
});
```

### 5. Alternative: Use Different Email Service

If Gmail continues to have issues on Render, consider:

**SendGrid (Recommended for production):**
- Free tier: 100 emails/day
- More reliable on cloud platforms
- Better for production use

**AWS SES:**
- Very reliable
- Pay per email
- Good for high volume

**Mailgun:**
- Free tier available
- Good deliverability

### 6. Quick Fix: Disable Email Verification on Startup

The app now skips email verification on startup in production to avoid timeout errors. Email will be tested on the first actual send.

### 7. Check Render Logs

1. Go to Render Dashboard → Your Service → Logs
2. Look for:
   - Environment variable loading
   - Email configuration messages
   - Connection attempts
   - Error details

### 8. Common Solutions

**Solution 1: Restart Service**
- Render Dashboard → Your Service → Manual Deploy → Clear build cache & deploy

**Solution 2: Re-check Environment Variables**
- Make sure no typos
- Make sure values are correct (especially App Password)
- Make sure SMTP_PORT is a number: `587` not `"587"`

**Solution 3: Use Different Port**
- Try `SMTP_PORT` = `465` with `secure: true`
- Or try `SMTP_PORT` = `25` (if allowed)

### Still Having Issues?

1. Check Render's status page
2. Try deploying to Railway instead (often has better email support)
3. Consider using a dedicated email service (SendGrid, Mailgun)
4. Check Gmail account for security alerts
