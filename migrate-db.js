const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'attendance.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database');
  migrateDatabase();
});

function migrateDatabase() {
  // Check if unique index already exists
  db.get("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_email_unique'", (err, row) => {
    if (err) {
      console.error('Error checking index:', err.message);
      db.close();
      return;
    }

    if (row) {
      console.log('Unique email index already exists');
      db.close();
      return;
    }

    // Check for duplicate emails first
    db.all(`
      SELECT email, COUNT(*) as count 
      FROM attendees 
      GROUP BY LOWER(TRIM(email)) 
      HAVING count > 1
    `, (err, duplicates) => {
      if (err) {
        console.error('Error checking duplicates:', err.message);
        db.close();
        return;
      }

      if (duplicates.length > 0) {
        console.log('Warning: Found duplicate emails in database:');
        duplicates.forEach(dup => {
          console.log(`  - ${dup.email}: ${dup.count} entries`);
        });
        console.log('\nPlease clean up duplicates before adding unique constraint.');
        console.log('The application-level validation will still prevent new duplicates.');
        db.close();
        return;
      }

      // Create unique index
      db.run(`
        CREATE UNIQUE INDEX idx_email_unique ON attendees(LOWER(TRIM(email)))
      `, (err) => {
        if (err) {
          console.error('Error creating unique index:', err.message);
        } else {
          console.log('Successfully created unique email index');
        }
        db.close();
      });
    });
  });
}
