import db, { initDB } from './db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const userEmail = 'comfortstudiouk@gmail.com'; // Email of user you want to make admin

async function setAdminLocal() {
  try {
    await initDB();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(userEmail) as any;
    if (!user) {
      // Pre-create the user row in the local DB
      db.prepare('INSERT INTO users (name, email, isAdmin, provider) VALUES (?, ?, 1, ?)')
        .run(userEmail.split('@')[0], userEmail, 'firebase');
      console.log(`User ${userEmail} did not exist locally. Pre-created them as Admin in your local SQLite DB.`);
    } else {
      db.prepare('UPDATE users SET isAdmin = 1 WHERE email = ?').run(userEmail);
      console.log(`Successfully set ${userEmail} as Admin in your local SQLite DB.`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error setting admin locally:', error);
    process.exit(1);
  }
}

setAdminLocal();
