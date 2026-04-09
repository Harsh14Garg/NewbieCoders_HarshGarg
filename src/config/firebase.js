const admin = require('firebase-admin');

let firebaseApp = null;
let db = null;
let auth = null;
let isDemoMode = true;

const initializeFirebase = () => {
  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0];
    db = admin.firestore();
    auth = admin.auth();
    isDemoMode = false;
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  // Check if we have valid credentials
  if (!projectId || !privateKey || !clientEmail || projectId.includes('YOUR_PROJECT_ID')) {
    console.warn('⚠️  Firebase Admin credentials missing. Running in DEMO MODE.');
    isDemoMode = true;
    return;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        privateKey: privateKey.replace(/\\n/g, '\n'),
        clientEmail: clientEmail,
      }),
      projectId: projectId,
    });
    
    db = admin.firestore();
    auth = admin.auth();
    db.settings({ ignoreUndefinedProperties: true });
    isDemoMode = false;
    
    console.log('✓ Firebase Admin SDK initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', err.message);
    isDemoMode = true;
  }
};

// Initialize
initializeFirebase();

module.exports = { admin, db, auth, isDemoMode };
