# Deployment Guide

This guide covers deploying the Match Attendance Form application to various cloud platforms.

## Prerequisites

Before deploying, ensure you have:
- ✅ All GitHub Secrets configured (see README.md)
- ✅ Gmail App Password set up
- ✅ Session secret generated
- ✅ Admin credentials ready

## Platform Options

### 1. Railway (Recommended - Easiest)

Railway is the easiest platform for Node.js apps with automatic HTTPS.

**Steps:**

1. **Sign up:** Go to [railway.app](https://railway.app) and sign up with GitHub
2. **Create Project:** Click "New Project" → "Deploy from GitHub repo"
3. **Select Repository:** Choose `M3rfan11/Brouq-Form`
4. **Add Environment Variables:**
   - Go to your project → Settings → Variables
   - Add all secrets from GitHub Secrets:
     - `ADMIN_USERNAME`
     - `ADMIN_PASSWORD`
     - `SESSION_SECRET`
     - `SMTP_HOST` = `smtp.gmail.com`
     - `SMTP_PORT` = `587`
     - `SMTP_USER`
     - `SMTP_PASS`
     - `PORT` = `3000` (Railway sets this automatically)
     - `QR_EXPIRY_DAYS` = `7`
5. **Deploy:** Railway will automatically deploy
6. **Get URL:** Railway provides HTTPS URL automatically

**Railway automatically:**
- Provides HTTPS (required for camera)
- Sets PORT environment variable
- Handles SSL certificates
- Provides persistent storage for SQLite

---

### 2. Render

**Steps:**

1. **Sign up:** Go to [render.com](https://render.com) and sign up
2. **New Web Service:** Click "New" → "Web Service"
3. **Connect GitHub:** Select your repository
4. **Configure:**
   - **Name:** `brouq-match-form`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free tier available
5. **Environment Variables:** Add all secrets (same as Railway)
6. **Deploy:** Click "Create Web Service"

Render provides HTTPS automatically.

---

### 3. Google Cloud Run (GCP)

**Steps:**

1. **Install Google Cloud SDK:**
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Login:**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Build and Deploy:**
   ```bash
   # Build container
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/brouq-form
   
   # Deploy
   gcloud run deploy brouq-form \
     --image gcr.io/YOUR_PROJECT_ID/brouq-form \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars ADMIN_USERNAME=your_username,ADMIN_PASSWORD=your_password
   ```

4. **Set Environment Variables:**
   ```bash
   gcloud run services update brouq-form \
     --update-env-vars ADMIN_USERNAME=your_username,ADMIN_PASSWORD=your_password,SESSION_SECRET=your_secret,SMTP_HOST=smtp.gmail.com,SMTP_PORT=587,SMTP_USER=your_email,SMTP_PASS=your_app_password
   ```

**Note:** For GCP, you'll need a `Dockerfile` (see below).

---

### 4. Heroku

**Steps:**

1. **Install Heroku CLI:**
   ```bash
   brew install heroku/brew/heroku
   ```

2. **Login:**
   ```bash
   heroku login
   ```

3. **Create App:**
   ```bash
   heroku create brouq-match-form
   ```

4. **Set Environment Variables:**
   ```bash
   heroku config:set ADMIN_USERNAME=your_username
   heroku config:set ADMIN_PASSWORD=your_password
   heroku config:set SESSION_SECRET=your_secret
   heroku config:set SMTP_HOST=smtp.gmail.com
   heroku config:set SMTP_PORT=587
   heroku config:set SMTP_USER=your_email
   heroku config:set SMTP_PASS=your_app_password
   heroku config:set QR_EXPIRY_DAYS=7
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   ```

---

## Important Notes

### HTTPS Requirement
- **Camera access requires HTTPS** on mobile devices
- Railway, Render, and Heroku provide HTTPS automatically
- For GCP Cloud Run, HTTPS is automatic
- For self-hosted, you'll need SSL certificates

### Database Considerations
- SQLite works for small to medium deployments
- For production with high traffic, consider PostgreSQL or MySQL
- Railway and Render provide persistent storage for SQLite
- Heroku uses ephemeral filesystem - consider addon database

### Environment Variables
All platforms need these environment variables:
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `SMTP_HOST` = `smtp.gmail.com`
- `SMTP_PORT` = `587`
- `SMTP_USER`
- `SMTP_PASS`
- `PORT` (usually set automatically by platform)
- `QR_EXPIRY_DAYS` = `7` (optional)

---

## Quick Start (Railway - Recommended)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. New Project → Deploy from GitHub
4. Select `M3rfan11/Brouq-Form`
5. Add environment variables (copy from GitHub Secrets)
6. Deploy!

Railway will automatically:
- Detect Node.js
- Install dependencies
- Start the server
- Provide HTTPS URL

---

## Need Help?

If you need help with a specific platform, let me know which one you prefer!
