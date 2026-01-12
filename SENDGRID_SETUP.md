# SendGrid Setup Guide - Step by Step

## Why SendGrid?
- ✅ Designed for cloud platforms (no blocking issues)
- ✅ Free tier: 100 emails/day (perfect for your use case)
- ✅ Reliable and fast
- ✅ Easy setup (5 minutes)

## Step 1: Create SendGrid Account

1. **Go to SendGrid**: https://sendgrid.com
2. **Click "Start for Free"** or **"Sign Up"**
3. **Fill in your details:**
   - Email: Use your email (can be the same as your Gmail)
   - Password: Create a secure password
   - Company name: "Brouq Developments" (or your company)
4. **Verify your email** (check your inbox)
5. **Complete the signup process**

## Step 2: Create API Key

1. **Login to SendGrid Dashboard**
2. **Go to Settings** → **API Keys** (left sidebar)
3. **Click "Create API Key"** (top right)
4. **Name it**: "Brouq Match Form" (or any name you like)
5. **Select "Full Access"** (or "Restricted Access" → "Mail Send" only)
6. **Click "Create & View"**
7. **IMPORTANT: Copy the API Key immediately!**
   - It starts with `SG.` followed by a long string
   - Example: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **You can only see it once!** Save it somewhere safe

## Step 3: Update Railway Variables

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your project**: `brouq-match-form`
3. **Go to Variables tab**
4. **Update these variables:**

### Update SMTP_HOST:
- Find `SMTP_HOST`
- Change value from: `smtp.gmail.com`
- To: `smtp.sendgrid.net`

### Update SMTP_PORT:
- Find `SMTP_PORT`
- Keep value as: `587` (or change to `587` if it's different)

### Update SMTP_USER:
- Find `SMTP_USER`
- Change value from: `merfan3746@gmail.com`
- To: `apikey` (literally the word "apikey" - this is SendGrid's requirement)

### Update SMTP_PASS:
- Find `SMTP_PASS`
- Change value from: `tzflmoskwmzmseao`
- To: `SG.your-api-key-here` (paste the API key you copied from Step 2)
- Example: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Keep these unchanged:
- `SMTP_HOST` → `smtp.sendgrid.net`
- `SMTP_PORT` → `587`
- `SMTP_USER` → `apikey`
- `SMTP_PASS` → `SG.your-actual-api-key`

## Step 4: Verify Sender Identity (Important!)

SendGrid requires you to verify your sender email:

1. **In SendGrid Dashboard**, go to **Settings** → **Sender Authentication**
2. **Click "Verify a Single Sender"**
3. **Fill in the form:**
   - **From Email**: `merfan3746@gmail.com` (your Gmail)
   - **From Name**: "Match Attendance" (or any name)
   - **Reply To**: `merfan3746@gmail.com`
   - **Address**: Your address
   - **City**: Your city
   - **State**: Your state
   - **Country**: Your country
   - **Zip Code**: Your zip code
4. **Click "Create"**
5. **Check your email** (`merfan3746@gmail.com`)
6. **Click the verification link** in the email
7. **Wait for approval** (usually instant, sometimes a few minutes)

**Note**: Until you verify, SendGrid will still work but emails might go to spam. Verification is required for production use.

## Step 5: Redeploy on Railway

1. **After updating all variables**, Railway will automatically redeploy
2. **Or manually trigger**: Go to Deployments tab → Click "Redeploy"
3. **Wait for deployment to complete** (usually 1-2 minutes)

## Step 6: Test It!

1. **Go to your app**: `https://your-app.up.railway.app`
2. **Fill out the registration form**
3. **Submit**
4. **Check your email** - you should receive the QR code email!

## Troubleshooting

### If emails still don't send:

1. **Check Railway logs** for error messages
2. **Verify API key** is correct (starts with `SG.`)
3. **Make sure `SMTP_USER` is exactly `apikey`** (not your email)
4. **Check SendGrid Dashboard** → **Activity** to see if emails are being sent
5. **Verify sender email** is verified in SendGrid

### If you see "Unauthorized" error:

- API key is wrong or expired
- Regenerate API key in SendGrid
- Update `SMTP_PASS` in Railway

### If emails go to spam:

- Complete sender verification in SendGrid
- This is normal for unverified senders
- Verification usually takes a few minutes

## Quick Reference: Railway Variables

After setup, your Railway variables should look like:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-actual-api-key-here
```

**That's it!** SendGrid should work immediately after these changes.

## Benefits of SendGrid

✅ **No more connection timeouts**
✅ **Reliable delivery**
✅ **Better for cloud platforms**
✅ **Free tier: 100 emails/day** (perfect for your use case)
✅ **Easy to scale** if you need more later

## Need Help?

If you run into issues:
1. Check Railway logs
2. Check SendGrid Dashboard → Activity
3. Verify all variables are set correctly
4. Make sure sender email is verified
