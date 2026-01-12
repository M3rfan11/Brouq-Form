# Quick Fix for Gmail Connection Timeout on Railway

## Your Variables Are Correct ✅

I can see from your Railway dashboard that all variables are set correctly:
- `SMTP_HOST`: `smtp.gmail.com` ✅
- `SMTP_PORT`: `587` ✅
- `SMTP_USER`: `merfan3746@gmail.com` ✅
- `SMTP_PASS`: `tzflmoskwmzmseao` ✅

## The Problem

Gmail is **blocking connections from Railway's IP addresses**. This is a network/security issue, not a configuration problem.

## Solution 1: Try Port 465 (SSL) - Easiest Fix

1. In Railway Dashboard → Variables
2. Change `SMTP_PORT` from `587` to `465`
3. Redeploy

Port 465 uses SSL (more secure) and sometimes bypasses Gmail's restrictions.

## Solution 2: Switch to SendGrid (Recommended)

SendGrid is designed for cloud platforms and won't have these issues.

### Steps:

1. **Sign up for SendGrid** (free tier: 100 emails/day)
   - Go to: https://sendgrid.com
   - Sign up with your email

2. **Create API Key**
   - Dashboard → Settings → API Keys
   - Create API Key → Full Access
   - Copy the key (starts with `SG.`)

3. **Update Railway Variables:**
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.your-api-key-here
   ```

4. **Redeploy**

SendGrid is much more reliable for cloud deployments!

## Why This Happens

- Gmail blocks connections from cloud platform IPs for security
- Railway's IPs may be flagged by Gmail's anti-spam systems
- This is common with Gmail on cloud platforms
- SendGrid and other email services are designed for this use case

## Important Note

**Your app still works!** Even if email fails:
- QR codes are saved to database ✅
- Users get QR code in response ✅
- They can use it even without email ✅

Email is just a convenience - the core functionality works independently.
