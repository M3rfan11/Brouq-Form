# SendGrid Connection Timeout - Debugging Guide

## You've Verified Everything, But Still Timing Out?

This means Railway can't connect to SendGrid's SMTP server. Let's debug this step by step.

## Step 1: Verify Railway Variables (Double Check)

In Railway Dashboard → Variables, make sure EXACTLY:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Common mistakes:**
- ❌ `SMTP_USER=your-email@gmail.com` → Should be `apikey`
- ❌ `SMTP_PASS` has spaces → Remove all spaces
- ❌ `SMTP_HOST=smtp.sendgrid.com` → Should be `smtp.sendgrid.net` (not .com)
- ❌ API key doesn't start with `SG.` → Regenerate in SendGrid

## Step 2: Check Railway Logs

After redeploy, check Railway logs. You should see:

```
📧 Email Configuration:
   Host: smtp.sendgrid.net
   Port: 587
   Provider: SendGrid
```

If you see `Provider: Gmail`, the variables aren't loaded correctly.

## Step 3: Test SendGrid API Key

Your API key might be invalid. Let's verify:

1. **Go to SendGrid Dashboard** → Settings → API Keys
2. **Check if your API key exists**
3. **If unsure, create a NEW one:**
   - Delete the old one
   - Create new API key
   - Copy it (starts with `SG.`)
   - Update `SMTP_PASS` in Railway

## Step 4: Check SendGrid Dashboard

1. **Go to SendGrid Dashboard** → Activity
2. **Look for any emails being sent**
3. **Check for error messages**

If you see "Authentication failed" or "Invalid API key", the API key is wrong.

## Step 5: Railway Network Restrictions

Railway might be blocking outbound SMTP connections. This is rare but possible.

**Test this:**
1. Check Railway logs for network errors
2. Look for "ECONNREFUSED" or "ENOTFOUND" errors
3. If you see these, Railway might be blocking SMTP

## Step 6: Try Port 2525 (Alternative)

SendGrid also supports port 2525. Try this:

1. In Railway Variables, change:
   ```
   SMTP_PORT=2525
   ```
2. Redeploy
3. Test again

Port 2525 is sometimes less restricted.

## Step 7: Use SendGrid API Instead of SMTP

If SMTP keeps failing, we can switch to SendGrid's REST API (more reliable):

**This requires code changes** - let me know if you want to try this approach.

## Step 8: Check SendGrid Account Status

1. **Go to SendGrid Dashboard** → Settings → Account
2. **Check if account is active**
3. **Check if you've hit any limits**
4. **Free tier: 100 emails/day** - make sure you haven't exceeded

## Step 9: Verify Sender Email

Even though you verified, double-check:

1. **SendGrid Dashboard** → Settings → Sender Authentication
2. **Make sure `merfan3746@gmail.com` shows as "Verified"**
3. **If not verified, verify again**

## Step 10: Test with Different Email Service

If SendGrid SMTP still fails, try **Mailgun** (also free):

1. Sign up at https://mailgun.com
2. Get API credentials
3. Update Railway variables:
   ```
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=your-mailgun-username
   SMTP_PASS=your-mailgun-password
   ```

## What to Check in Railway Logs

After redeploy, look for these in logs:

✅ **Good signs:**
- `Provider: SendGrid`
- `Auth user: api***`
- `Auth pass: ***SET***`
- `Testing SendGrid connection...`

❌ **Bad signs:**
- `Provider: Gmail` (variables not loaded)
- `Auth user: NOT SET`
- `Auth pass: NOT SET`
- `ECONNREFUSED` (Railway blocking)
- `ENOTFOUND` (DNS issue)

## Quick Test

1. **Update Railway variables** (double-check all 4)
2. **Redeploy**
3. **Check logs** for configuration output
4. **Submit test form**
5. **Check SendGrid Dashboard → Activity** for email status

## Still Not Working?

If you've tried everything:
1. Share the Railway logs (the email configuration section)
2. Share what you see in SendGrid Dashboard → Activity
3. We can switch to SendGrid REST API (more reliable than SMTP)
