require('dotenv').config();
const pool = require('./db/pool');

(async () => {
  try {
    await pool.query(
      "ALTER TABLE Sections ADD COLUMN IF NOT EXISTS category VARCHAR(10) CHECK (category IN ('READING','LISTENING','WRITING','SPEAKING'))"
    );
    console.log('category OK');

    await pool.query([
      'CREATE TABLE IF NOT EXISTS Announcements (',
      '  id VARCHAR(36) PRIMARY KEY,',
      '  title VARCHAR(255) NOT NULL,',
      '  body TEXT NOT NULL,',
      '  is_pinned BOOLEAN DEFAULT FALSE,',
      '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      ')'
    ].join(' '));
    console.log('announcements OK');
    process.exit(0);
  } catch(e) {
    console.error(e.message);
    process.exit(1);
  }
})();
