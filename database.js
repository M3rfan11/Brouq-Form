const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'attendance.db');

// Create and initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Create attendees table
  db.run(`
    CREATE TABLE IF NOT EXISTS attendees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      qr_code TEXT UNIQUE NOT NULL,
      qr_code_data TEXT NOT NULL,
      is_used INTEGER DEFAULT 0,
      used_at TEXT,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating attendees table:', err.message);
    } else {
      console.log('Database initialized successfully');
      // Try to add unique constraint to email if table already exists
      // This will fail silently if constraint already exists, which is fine
      db.run(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_email_unique ON attendees(email)
      `, (err) => {
        if (err && !err.message.includes('already exists')) {
          console.log('Note: Email unique constraint may already exist');
        }
      });
      
      // Add expires_at column if it doesn't exist (for existing databases)
      db.run(`
        ALTER TABLE attendees ADD COLUMN expires_at DATETIME
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          // Column might already exist, which is fine
          console.log('Note: expires_at column may already exist');
        }
      });
    }
  });
}

// Database helper functions
const dbHelpers = {
  // Insert new attendee
  insertAttendee: (attendee) => {
    return new Promise((resolve, reject) => {
      const { name, email, phone, qr_code, qr_code_data, expires_at } = attendee;
      db.run(
        `INSERT INTO attendees (name, email, phone, qr_code, qr_code_data, expires_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, email, phone || null, qr_code, qr_code_data, expires_at || null],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...attendee });
          }
        }
      );
    });
  },

  // Find attendee by QR code
  findByQRCode: (qr_code) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM attendees WHERE qr_code = ?',
        [qr_code],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  },

  // Find attendee by email (case-insensitive)
  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      // Normalize email to lowercase for comparison
      const normalizedEmail = email.toLowerCase().trim();
      db.get(
        'SELECT * FROM attendees WHERE LOWER(TRIM(email)) = ?',
        [normalizedEmail],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  },

  // Mark QR code as used
  markAsUsed: (qr_code) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE attendees SET is_used = 1, used_at = CURRENT_TIMESTAMP 
         WHERE qr_code = ? AND is_used = 0`,
        [qr_code],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  },

  // Get all attendees (for admin view)
  getAllAttendees: () => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM attendees ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  },

  // Get statistics
  getStats: () => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          COUNT(*) as total,
          SUM(is_used) as used,
          COUNT(*) - SUM(is_used) as unused
         FROM attendees`,
        [],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }
};

module.exports = { db, dbHelpers };
