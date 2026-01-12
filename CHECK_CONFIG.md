# Quick Configuration Check

## Are you using Gmail or SendGrid?

Check your Railway Variables to see which one you're using:

### If you see:
```
SMTP_HOST=smtp.gmail.com
SMTP_USER=merfan3746@gmail.com
```
**→ You're still using Gmail** (this will timeout - Gmail blocks Railway)

### If you see:
```
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxx
```
**→ You're using SendGrid** (should work, but check configuration)

## Quick Fix: Switch to SendGrid NOW

If you're still using Gmail, you need to switch to SendGrid:

### Step 1: Get SendGrid API Key
1. Go to https://sendgrid.com and sign up (free)
2. Settings → API Keys → Create API Key
3. Copy the key (starts with `SG.`)

### Step 2: Update Railway Variables
Change these 4 variables:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-api-key-here
```

### Step 3: Verify Sender Email
1. SendGrid Dashboard → Settings → Sender Authentication
2. Verify a Single Sender
3. Use: `merfan3746@gmail.com`
4. Check email and click verification link

### Step 4: Redeploy
Railway will auto-redeploy after you save variables.

## If You're Already Using SendGrid

Check these common issues:

1. **SMTP_USER must be exactly "apikey"** (not your email)
2. **SMTP_PASS must be your API key** (starts with `SG.`)
3. **Sender email must be verified** in SendGrid
4. **Check SendGrid Dashboard → Activity** to see if emails are being sent

## Test After Changes

1. Submit the registration form
2. Check Railway logs for email configuration output
3. Check SendGrid Dashboard → Activity for email status
