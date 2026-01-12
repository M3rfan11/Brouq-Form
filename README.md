# Match Attendance Form with QR Code Verification

A complete solution for managing match attendance with QR code-based verification. Users can register for a match, receive a QR code via email, and the QR code can be scanned to verify attendance (one-time use only).

## Features

- ✅ **Registration Form**: Simple form for attendees to register
- ✅ **Email with QR Code**: Automatic email sending with QR code attachment
- ✅ **QR Code Scanner**: Web-based scanner to verify QR codes
- ✅ **One-Time Use**: Each QR code can only be used once
- ✅ **Admin Dashboard**: View statistics and all registrations
- ✅ **Authentication**: Secure login system for admin and scanner access
- ✅ **Database**: SQLite database to store all data

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Email account (Gmail, Outlook, or any SMTP server)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure email settings:**

   Create a `.env` file in the root directory (optional, or edit `emailService.js` directly):
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

   **For Gmail:**
   - Enable 2-factor authentication
   - Generate an "App Password" from your Google Account settings
   - Use the app password (not your regular password) in `SMTP_PASS`

   **For other email providers:**
   - Update `SMTP_HOST` and `SMTP_PORT` accordingly
   - Use your email credentials

   **Alternative:** Edit `emailService.js` directly and update the `emailConfig` object.

3. **Configure admin credentials (optional):**

   You can set admin username and password in `.env` file:
   ```env
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-secure-password
   SESSION_SECRET=your-secret-key-for-sessions
   ```

   **Default credentials** (change these in production!):
   - Username: `admin`
   - Password: `admin123`

4. **Start the server:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Registration Form: http://localhost:3000 (public, no login required)
   - Admin Login: http://localhost:3000/login.html
   - QR Scanner: http://localhost:3000/scanner.html (requires login)
   - Admin Dashboard: http://localhost:3000/admin.html (requires login)

## Usage

### For Attendees

1. Visit the registration form
2. Fill in your name, email, and optionally phone number
3. Submit the form
4. Check your email for the QR code
5. Present the QR code at the venue (on phone or printed)

### For Event Organizers

1. **Login:**
   - Go to http://localhost:3000/login.html
   - Enter your admin username and password
   - Default credentials: username `admin`, password `admin123` (change in production!)

2. **Scanning QR Codes:**
   - After logging in, go to the QR Scanner page
   - Use the camera to scan QR codes, or enter them manually
   - The system will verify if the QR code is valid and unused
   - Once scanned, the QR code is marked as used

3. **Viewing Statistics:**
   - Go to the Admin Dashboard (requires login)
   - View total registrations, used codes, and unused codes
   - See all attendees and their status
   - Click "Logout" when done

## API Endpoints

- `POST /api/submit` - Submit registration form
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+20 123 456 7890"
  }
  ```

- `POST /api/verify` - Verify and mark QR code as used
  ```json
  {
    "qr_code": "uuid-here"
  }
  ```

- `POST /api/check` - Check QR code status (without marking as used)
  ```json
  {
    "qr_code": "uuid-here"
  }
  ```

- `GET /api/stats` - Get attendance statistics
- `GET /api/attendees` - Get all attendees (admin)

## Database

The application uses SQLite database (`attendance.db`) which is automatically created on first run. The database contains:

- **attendees** table with:
  - id (primary key)
  - name
  - email
  - phone
  - qr_code (unique)
  - qr_code_data
  - is_used (0 or 1)
  - used_at (timestamp)
  - created_at (timestamp)

## Security Notes

- QR codes are unique UUIDs
- Each QR code can only be used once
- Email addresses are validated
- Consider adding authentication for admin endpoints in production

## Troubleshooting

### Email not sending
- Check your SMTP credentials
- For Gmail, make sure you're using an App Password
- Check firewall/network settings
- Verify SMTP server settings

### QR Scanner not working
- Make sure you grant camera permissions
- Use HTTPS in production (required for camera access)
- Try using the manual entry option

### Database errors
- Make sure the application has write permissions
- Check if `attendance.db` file exists and is accessible

## Production Deployment

For production deployment:

1. Use a production database (PostgreSQL, MySQL)
2. Add authentication for admin endpoints
3. Use HTTPS (required for camera access)
4. Set up proper email service (SendGrid, AWS SES, etc.)
5. Add environment variables for sensitive data
6. Set up proper logging and monitoring

## License

ISC

## Support

For issues or questions, please check the code comments or create an issue in the repository.
