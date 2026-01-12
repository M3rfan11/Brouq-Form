# Google Cloud Deployment Guide

## Project ID: `whizz-dev-31e16`

This guide will help you deploy the Match Attendance Form to Google Cloud.

## Prerequisites

1. **Google Cloud SDK** installed
2. **Google Cloud Project** created: `whizz-dev-31e16`
3. **Billing enabled** (required for Cloud Run/App Engine)

## Option 1: Deploy to Cloud Run (Recommended)

Cloud Run is serverless and scales automatically.

### Step 1: Install Google Cloud SDK

```bash
# Install gcloud CLI if not already installed
# macOS:
brew install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

### Step 2: Authenticate and Set Project

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project whizz-dev-31e16

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Step 3: Build and Deploy

```bash
# Build and deploy to Cloud Run
gcloud run deploy match-attendance-form \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "ADMIN_USERNAME=admin" \
  --set-env-vars "ADMIN_PASSWORD=your-secure-password" \
  --set-env-vars "SESSION_SECRET=your-session-secret" \
  --set-env-vars "SMTP_HOST=smtp.gmail.com" \
  --set-env-vars "SMTP_PORT=587" \
  --set-env-vars "SMTP_USER=merfan3746@gmail.com" \
  --set-env-vars "SMTP_PASS=your-gmail-app-password" \
  --set-env-vars "SENDER_EMAIL=merfan3746@gmail.com" \
  --set-env-vars "QR_EXPIRY_DAYS=7"
```

### Step 4: Set Environment Variables (Better Method)

Instead of setting env vars in the command, use Google Cloud Console:

1. Go to **Cloud Run** → **match-attendance-form** → **Edit & Deploy New Revision**
2. Go to **Variables & Secrets** tab
3. Add environment variables:
   - `ADMIN_USERNAME` = `admin`
   - `ADMIN_PASSWORD` = `your-secure-password`
   - `SESSION_SECRET` = `your-session-secret` (generate with `node generate-secret.js`)
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `merfan3746@gmail.com`
   - `SMTP_PASS` = `your-16-char-gmail-app-password`
   - `SENDER_EMAIL` = `merfan3746@gmail.com`
   - `QR_EXPIRY_DAYS` = `7`
   - `NODE_ENV` = `production`

4. Click **Deploy**

### Step 5: Get Your URL

After deployment, you'll get a URL like:
```
https://match-attendance-form-xxxxx-uc.a.run.app
```

## Option 2: Deploy to App Engine

### Step 1: Deploy

```bash
gcloud app deploy
```

### Step 2: Set Environment Variables

In `app.yaml`, uncomment and set your environment variables, or use:

```bash
gcloud app deploy --set-env-vars ADMIN_USERNAME=admin,ADMIN_PASSWORD=your-password
```

## Using Gmail SMTP on Google Cloud

Since you're on Google Cloud, Gmail SMTP should work better:

1. **Get Gmail App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Generate a new App Password
   - Copy the 16-character password

2. **Set in Cloud Run:**
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `merfan3746@gmail.com`
   - `SMTP_PASS` = `your-16-char-app-password`

3. **Test it** - Gmail should work better on Google Cloud than Railway!

## Generate Session Secret

```bash
node generate-secret.js
```

Copy the output to `SESSION_SECRET` in Cloud Run.

## Update Code for Google Cloud

The code is already configured to:
- ✅ Use `process.env.PORT` (Cloud Run sets this automatically)
- ✅ Use Gmail SMTP when `SMTP_HOST=smtp.gmail.com`
- ✅ Work with Google Cloud environment

## Monitoring

1. **View Logs:**
   ```bash
   gcloud run services logs read match-attendance-form --region us-central1
   ```

2. **View in Console:**
   - Go to Cloud Run → match-attendance-form → Logs

## Troubleshooting

### Port Issues
- Cloud Run sets `PORT` automatically - don't override it
- The code already uses `process.env.PORT`

### Email Not Sending
- Check logs for SMTP connection errors
- Verify Gmail App Password is correct
- Make sure 2-Step Verification is enabled

### Database Issues
- SQLite works on Cloud Run (ephemeral storage)
- For persistent storage, consider Cloud SQL (PostgreSQL/MySQL)

## Cost Estimation

**Cloud Run (Free Tier):**
- 2 million requests/month free
- 360,000 GB-seconds compute time free
- Perfect for this use case!

**App Engine (Free Tier):**
- 28 instance-hours/day free
- Also good for this use case

## Next Steps

1. Deploy to Cloud Run
2. Set environment variables
3. Test the application
4. Monitor logs
5. Test email sending with Gmail SMTP

Your app should work great on Google Cloud, and Gmail SMTP should work better than on Railway!
