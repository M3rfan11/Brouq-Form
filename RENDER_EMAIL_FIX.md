# Fixing Gmail Connection Timeout on Render

## Problem
Gmail often blocks connections from cloud platforms like Render due to:
- IP reputation issues
- Security policies
- Network restrictions

## Solutions

### Solution 1: Use Port 465 (SSL) instead of 587 (TLS)

**Update in Render Environment Variables:**
- `SMTP_PORT` = `465`
- Add `SMTP_SECURE` = `true` (if using this option)

**Update emailService.js:**
```javascript
secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT) === 465
```

### Solution 2: Use OAuth2 instead of App Password (More Secure)

Gmail OAuth2 is more reliable on cloud platforms.

### Solution 3: Use Alternative Email Service (Recommended)

**SendGrid (Free tier: 100 emails/day):**
1. Sign up at sendgrid.com
2. Create API key
3. Update environment variables:
   - `SMTP_HOST` = `smtp.sendgrid.net`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `apikey`
   - `SMTP_PASS` = `your-sendgrid-api-key`

**Mailgun (Free tier available):**
- `SMTP_HOST` = `smtp.mailgun.org`
- `SMTP_PORT` = `587`
- Use your Mailgun credentials

### Solution 4: Check Render's Network Settings

Some Render plans restrict SMTP. Check:
- Render Dashboard → Your Service → Settings
- Look for firewall/network restrictions
- Free tier might have limitations

### Solution 5: Whitelist Render IPs in Gmail (Not Recommended)

This is complex and not recommended for production.

## Quick Fix: Try Port 465

1. In Render, update environment variable:
   - `SMTP_PORT` = `465`
2. Update emailService.js to detect port 465:
   ```javascript
   secure: parseInt(process.env.SMTP_PORT) === 465
   ```
3. Redeploy

## Recommended: Switch to SendGrid

SendGrid is more reliable for cloud deployments:

1. Sign up: https://sendgrid.com
2. Create API Key
3. Update Render environment variables:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.your-api-key-here
   ```
4. Redeploy

This will solve the connection timeout issues.
