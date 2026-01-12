# Troubleshooting Guide

## Scanner Not Working in Browser

### Step 1: Check Server is Running
Make sure the server is running:
```bash
npm start
```

You should see: `Server running on http://localhost:3000`

### Step 2: Test Basic Access
1. Open browser and go to: `http://192.168.1.53:3000`
2. You should see the registration form
3. If you see the form, the server is working

### Step 3: Test Login
1. Go to: `http://192.168.1.53:3000/login.html`
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. If login works, you'll be redirected

### Step 4: Test Scanner Page
1. After login, go to: `http://192.168.1.53:3000/scanner.html`
2. Check browser console (F12 or right-click → Inspect → Console)
3. Look for any error messages

### Common Issues:

#### Issue 1: Page Not Loading
**Symptoms:** Blank page or "Cannot connect"
**Solutions:**
- Check server is running: `npm start`
- Check firewall allows port 3000
- Try `http://localhost:3000` on the same computer
- Check IP address: `ipconfig getifaddr en0`

#### Issue 2: Camera Not Working
**Symptoms:** Camera doesn't open, error message appears
**Solutions:**
- **Safari (iOS):** Allow camera permissions when prompted
- **Chrome (iOS):** Camera may not work - use Safari instead
- **Desktop:** Allow camera permissions in browser settings
- Use "Manual Entry" button as fallback

#### Issue 3: Authentication Errors
**Symptoms:** Redirected to login repeatedly
**Solutions:**
- Clear browser cookies/cache
- Make sure you're logged in
- Check session is working (try login again)

#### Issue 4: Network Issues
**Symptoms:** Can't access from phone
**Solutions:**
- Make sure phone and computer are on same WiFi
- Check IP address hasn't changed
- Try accessing from computer first: `http://localhost:3000`

### Quick Test Commands:

```bash
# Check server status
curl http://localhost:3000/api/health

# Check your IP
ipconfig getifaddr en0

# Check if port is open
lsof -ti:3000
```

### Manual Entry (Works Without Camera):
1. Click "📝 Manual Entry" button
2. Type the QR code from the email
3. Click "Verify QR Code"
4. This works even if camera doesn't!

### Still Not Working?
1. Open browser console (F12)
2. Look for red error messages
3. Take a screenshot of errors
4. Check network tab for failed requests
