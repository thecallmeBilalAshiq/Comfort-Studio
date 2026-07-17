import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import path from 'path';
import dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
const serviceAccount = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', serviceAccountPath), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const userEmail = 'bashiq031@gmail.com'; // Email of user you want to make admin

async function setAdminRole() {
  try {
    const user = await getAuth().getUserByEmail(userEmail);
    await getAuth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Successfully granted admin privileges to ${userEmail} (UID: ${user.uid})`);
    process.exit(0);
  } catch (error) {
    console.error('Error setting admin claims:', error);
    process.exit(1);
  }
}

setAdminRole();
