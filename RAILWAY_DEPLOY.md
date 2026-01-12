# Railway Deployment Guide

## Quick Start

1. **Go to Railway:** https://railway.app
2. **Sign up** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select Repository:** `M3rfan11/Brouq-Form`
5. **Add Environment Variables** (see below)
6. **Deploy!** Railway handles the rest automatically

## Environment Variables in Railway

Go to your Railway project → **Variables** tab and add:

### Required Variables:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
SESSION_SECRET=your_generated_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Optional Variables:

```
NODE_ENV=production
QR_EXPIRY_DAYS=7
```

## Railway-Specific Notes

✅ **Railway automatically:**
- Provides HTTPS (required for camera)
- Sets PORT environment variable
- Handles SSL certificates
- Provides persistent storage for SQLite
- Auto-deploys on git push

✅ **Railway has better email support than Render:**
- Less likely to block SMTP connections
- Better network access
- More reliable for Gmail

## Troubleshooting

### Email Connection Timeout

If you still get email timeouts on Railway:

**Option 1: Try Port 465 (SSL)**
- Update `SMTP_PORT` = `465` in Railway variables
- Gmail supports both 587 (TLS) and 465 (SSL)

**Option 2: Check Gmail App Password**
- Make sure you're using App Password (not regular password)
- Verify 2-Step Verification is enabled
- Generate a new App Password if needed

**Option 3: Use SendGrid (More Reliable)**
- Sign up at sendgrid.com
- Create API key
- Update variables:
  - `SMTP_HOST` = `smtp.sendgrid.net`
  - `SMTP_PORT` = `587`
  - `SMTP_USER` = `apikey`
  - `SMTP_PASS` = `SG.your-api-key`

### Server Not Starting

- Check Railway logs for errors
- Verify all environment variables are set
- Make sure PORT is not manually set (Railway sets it automatically)

### Health Check Issues

- Railway automatically checks `/api/health`
- The endpoint is already configured
- Should respond within seconds

## Testing After Deployment

1. **Check Health:**
   - Visit: `https://your-app.railway.app/api/health`
   - Should return: `{"status":"ok",...}`

2. **Test Email:**
   - Visit: `https://your-app.railway.app/api/test-email`
   - Shows email configuration status

3. **Test Form:**
   - Visit: `https://your-app.railway.app/`
   - Submit a test registration
   - Check if email is received

## Railway Dashboard

- **Logs:** View real-time logs
- **Metrics:** Monitor CPU, memory, network
- **Settings:** Configure domain, environment variables
- **Deployments:** View deployment history

## Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check logs in Railway dashboard for specific errors
