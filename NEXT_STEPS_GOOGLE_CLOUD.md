# Next Steps After Google Cloud Deployment

## ✅ Deployment Successful!

Your app is live at: **https://match-attendance-form-1056327500922.us-central1.run.app**

## Step 1: Set Environment Variables

You need to configure environment variables in Cloud Run:

### Option A: Using Google Cloud Console (Easiest)

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/run?project=whizz-dev-31e16

2. **Click on your service:** `match-attendance-form`

3. **Click "Edit & Deploy New Revision"**

4. **Go to "Variables & Secrets" tab**

5. **Add these environment variables:**

   ```
   ADMIN_USERNAME = admin
   ADMIN_PASSWORD = your-secure-password-here
   SESSION_SECRET = (generate with: node generate-secret.js)
   SMTP_HOST = smtp.gmail.com
   SMTP_PORT = 587
   SMTP_USER = merfan3746@gmail.com
   SMTP_PASS = your-16-char-gmail-app-password
   SENDER_EMAIL = merfan3746@gmail.com
   QR_EXPIRY_DAYS = 7
   NODE_ENV = production
   ```

6. **Click "Deploy"** (at the bottom)

### Option B: Using gcloud CLI

```bash
gcloud run services update match-attendance-form \
  --region us-central1 \
  --update-env-vars ADMIN_USERNAME=admin,ADMIN_PASSWORD=your-password,SESSION_SECRET=your-secret,SMTP_HOST=smtp.gmail.com,SMTP_PORT=587,SMTP_USER=merfan3746@gmail.com,SMTP_PASS=your-app-password,SENDER_EMAIL=merfan3746@gmail.com,QR_EXPIRY_DAYS=7,NODE_ENV=production
```

## Step 2: Generate Session Secret

Run this locally to generate a secure session secret:

```bash
node generate-secret.js
```

Copy the output and use it for `SESSION_SECRET`.

## Step 3: Get Gmail App Password

1. **Go to:** https://myaccount.google.com/apppasswords
2. **Generate a new App Password** for "Mail"
3. **Copy the 16-character password** (no spaces)
4. **Use it for `SMTP_PASS`**

## Step 4: Test Your Application

1. **Open your app:** https://match-attendance-form-1056327500922.us-central1.run.app
2. **Test registration form**
3. **Test admin login:** https://match-attendance-form-1056327500922.us-central1.run.app/login.html
4. **Test QR scanner:** https://match-attendance-form-1056327500922.us-central1.run.app/scanner.html

## Step 5: View Logs

To see what's happening:

```bash
gcloud run services logs read match-attendance-form --region us-central1 --limit 50
```

Or in Console:
- Cloud Run → match-attendance-form → Logs

## Step 6: Verify Email Sending

1. **Submit a test registration**
2. **Check logs** for email sending status
3. **Check your email** for the QR code

Since you're on Google Cloud, Gmail SMTP should work better than on Railway!

## Troubleshooting

### If emails don't send:
- Check logs for errors
- Verify Gmail App Password is correct
- Make sure 2-Step Verification is enabled on Gmail

### If app doesn't load:
- Check logs for errors
- Verify all environment variables are set
- Check Cloud Run service status

### To update code:
```bash
# Make your changes, then:
gcloud run deploy match-attendance-form \
  --source . \
  --region us-central1 \
  --platform managed
```

## Your App URLs

- **Registration Form:** https://match-attendance-form-1056327500922.us-central1.run.app
- **Admin Login:** https://match-attendance-form-1056327500922.us-central1.run.app/login.html
- **Admin Dashboard:** https://match-attendance-form-1056327500922.us-central1.run.app/admin.html
- **QR Scanner:** https://match-attendance-form-1056327500922.us-central1.run.app/scanner.html
- **Health Check:** https://match-attendance-form-1056327500922.us-central1.run.app/api/health

## Next Steps Summary

1. ✅ **Set environment variables** (most important!)
2. ✅ **Generate session secret**
3. ✅ **Get Gmail App Password**
4. ✅ **Test the application**
5. ✅ **Monitor logs**

Your app is deployed and ready - just need to configure the environment variables!
