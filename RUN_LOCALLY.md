# Running the Application Locally

## Quick Start

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Create `.env` file** (if not exists):
   ```bash
   cp .env.example .env
   ```

3. **Configure `.env` file**:
   Edit `.env` and add your SendGrid API key:
   ```
   SMTP_PASS=SG.your-sendgrid-api-key-here
   SENDER_EMAIL=merfan3746@gmail.com
   ```

4. **Start the server**:
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - Registration Form: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin.html
   - QR Scanner: http://localhost:3000/scanner.html
   - Login: http://localhost:3000/login.html

## Environment Variables

Required variables in `.env`:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SESSION_SECRET=your-random-secret-here
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
SENDER_EMAIL=merfan3746@gmail.com
QR_EXPIRY_DAYS=7
PORT=3000
NODE_ENV=development
```

## Generate Session Secret

Run this command to generate a secure session secret:
```bash
node generate-secret.js
```

Copy the output to `SESSION_SECRET` in your `.env` file.

## Testing

1. **Test Registration Form**: http://localhost:3000
2. **Test Admin Login**: http://localhost:3000/login.html
   - Username: `admin` (or your ADMIN_USERNAME)
   - Password: `admin123` (or your ADMIN_PASSWORD)
3. **Test QR Scanner**: http://localhost:3000/scanner.html (requires HTTPS for camera)

## HTTPS for Camera (Optional)

For testing the QR scanner camera locally, you need HTTPS:

1. Generate SSL certificates:
   ```bash
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   ```

2. Access via HTTPS:
   - https://localhost:3443/scanner.html

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
- Change `PORT` in `.env` to a different port (e.g., `3001`)
- Or kill the process using port 3000

### Database Issues
- The database (`attendance.db`) will be created automatically
- If you need to reset, delete `attendance.db` and restart

### Email Not Sending
- Make sure `SMTP_PASS` is your SendGrid API key
- Verify sender email is verified in SendGrid
- Check console logs for errors

## Development Mode

Use `npm run dev` for development with auto-reload (requires `nodemon`):
```bash
npm run dev
```

This will automatically restart the server when you make code changes.
