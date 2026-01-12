# Email Connection Timeout Troubleshooting

## Quick Diagnosis

After deploying, check Railway logs. You should see:
```
📧 Email Configuration:
   Host: smtp.gmail.com
   Port: 587
   Secure: false
   User: mer*** (or NOT SET)
   Password: ***SET*** (or NOT SET)
```

## Step 1: Verify Environment Variables in Railway

1. Go to **Railway Dashboard** → Your Project → **Variables** tab
2. Check these variables are set:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=merfan3746@gmail.com
SMTP_PASS=tzflmoskwmzmseao
```

### Common Issues:

❌ **SMTP_USER is missing or wrong**
- Should be: `merfan3746@gmail.com` (full email address)
- Not just: `merfan3746`

❌ **SMTP_PASS is missing or has spaces**
- Should be: `tzflmoskwmzmseao` (16 characters, no spaces)
- If you copied from Gmail, remove any spaces

❌ **SMTP_PORT is wrong type**
- Should be: `587` (as a number, not string `"587"`)
- Railway should handle this automatically

## Step 2: Check Railway Logs

After deployment, look for:
- `📧 Email Configuration:` - Shows what values are loaded
- `User: mer***` - Means user is set
- `Password: NOT SET` - Means password is missing!

## Step 3: Test Email Configuration (Admin Only)

1. Login to admin dashboard
2. Visit: `https://your-app.up.railway.app/api/email-config`
3. This shows configuration without exposing passwords

## Step 4: Try Port 465 (SSL) Instead

Gmail sometimes works better with SSL on cloud platforms:

1. In Railway Variables, change:
   ```
   SMTP_PORT=465
   ```

2. Redeploy

Port 465 uses SSL (more secure) and may bypass some network restrictions.

## Step 5: Verify Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Make sure 2-Step Verification is enabled
3. Generate a new App Password if needed
4. Copy the 16 characters (remove spaces)
5. Update `SMTP_PASS` in Railway

## Step 6: Gmail May Block Railway IPs

Gmail sometimes blocks connections from cloud platforms. Solutions:

### Option A: Use SendGrid (Recommended for Production)

1. Sign up: https://sendgrid.com (free tier: 100 emails/day)
2. Create API Key
3. Update Railway variables:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.your-sendgrid-api-key-here
   ```

### Option B: Use Mailgun

```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## Step 7: Check Railway Network Settings

Some Railway plans may have restrictions. Check:
- Railway Dashboard → Your Project → Settings
- Look for network/firewall settings

## What the Error Means

`ETIMEDOUT` = Connection timeout
- The server tried to connect to Gmail but couldn't reach it
- Usually means: network blocked, wrong credentials, or Gmail blocking the IP

## Important Note

**The app still works even if email fails!**
- QR codes are saved to the database
- Users get the QR code in the response
- They can use it even without email

Email is just a convenience feature - the core functionality (QR code generation and scanning) works independently.

## Quick Fix Checklist

- [ ] All environment variables set in Railway
- [ ] `SMTP_USER` is full email address
- [ ] `SMTP_PASS` is 16-character App Password (no spaces)
- [ ] Tried port 465 instead of 587
- [ ] Verified Gmail App Password is correct
- [ ] Checked Railway logs for configuration output
- [ ] Consider switching to SendGrid if Gmail continues to fail
