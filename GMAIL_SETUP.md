# Gmail SMTP Setup Guide

This application uses Gmail for sending emails with QR codes. Follow these steps to configure it.

## Quick Setup

1. **Enable 2-Factor Authentication**
   - Visit: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" → "Other (Custom name)"
   - Name it: "Match Attendance App"
   - Copy the generated 16-character password

3. **Configure .env file**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

## Detailed Steps

### Step 1: Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **2-Step Verification**
3. Follow the prompts to enable it
4. You'll need your phone for verification

### Step 2: Create App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Or: Security → 2-Step Verification → App passwords
2. You may need to sign in again
3. Select:
   - **App:** Mail
   - **Device:** Other (Custom name)
   - Enter: "Match Attendance App"
4. Click **Generate**
5. **Copy the password** (16 characters, may have spaces - remove them)

### Step 3: Configure Application

**Option A: Using .env file (Local Development)**

Create a `.env` file in the project root:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
```

**Option B: Using GitHub Secrets (For Deployment)**

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add these secrets:
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: Your Gmail address
   - `SMTP_PASS`: Your App Password

## Gmail SMTP Settings

- **Host:** smtp.gmail.com
- **Port:** 587 (TLS) or 465 (SSL)
- **Security:** TLS (port 587) or SSL (port 465)
- **Authentication:** Required (use App Password)

## Troubleshooting

### "Invalid login" error
- Make sure you're using an **App Password**, not your regular password
- Verify 2-Step Verification is enabled
- Check that the password has no spaces

### "Less secure app access" error
- Gmail no longer supports "Less secure apps"
- You **must** use App Passwords with 2-Step Verification enabled

### Emails not sending
- Check your internet connection
- Verify SMTP credentials in `.env` file
- Check Gmail account for security alerts
- Ensure App Password is correct (16 characters, no spaces)

### Rate limiting
- Gmail has sending limits (500 emails/day for free accounts)
- For higher volumes, consider using SendGrid, AWS SES, or similar services

## Security Notes

- ⚠️ **Never commit** your `.env` file or App Password to git
- ✅ App Passwords are safer than regular passwords
- ✅ Each app can have its own password
- ✅ You can revoke App Passwords anytime from Google Account settings

## Testing

After configuration, start the server:
```bash
npm start
```

You should see: "Email server is ready to send messages"

If you see an error, check:
1. App Password is correct
2. 2-Step Verification is enabled
3. `.env` file is in the project root
4. Environment variables are loaded correctly
