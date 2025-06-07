const admin = require('firebase-admin');

let db;

const initializeFirebase = () => {
  try {
    // Initialize Firebase Admin SDK
    if (process.env.NODE_ENV === 'production') {
      // In production, use service account key
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
      });
    } else {
      // In development, use service account key file
      const serviceAccount = require('../config/service-account-key.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    }

    db = admin.firestore();
    console.log('✅ Firebase initialized successfully');
    
    // Set Firestore settings
    db.settings({
      timestampsInSnapshots: true
    });

  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
};

const getFirestore = () => {
  if (!db) {
    throw new Error('Firestore not initialized. Call initializeFirebase() first.');
  }
  return db;
};

const getAuth = () => {
  return admin.auth();
};

// Firestore collections
const COLLECTIONS = {
  FLIGHTS: 'flights',
  PNRS: 'pnrs',
  USERS: 'users',
  ORGANIZATIONS: 'organizations'
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  COLLECTIONS,
  admin
}; 