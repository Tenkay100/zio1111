const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC4R6WMLqlLA-toYMx7pmqaqocUeDPt0A4",
  authDomain: "idbglobalfcuunion-f4829.firebaseapp.com",
  projectId: "idbglobalfcuunion-f4829",
  storageBucket: "idbglobalfcuunion-f4829.firebasestorage.app",
  messagingSenderId: "614788315076",
  appId: "1:614788315076:web:741ad1fed22b3be6e91691"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function generateAccountNumber() {
  const prefix = '4471';
  let num = prefix;
  for (let i = 0; i < 8; i++) num += Math.floor(Math.random() * 10);
  return num;
}

function generateIBAN(accountNumber) {
  const countryCode = 'US';
  const bankCode = 'AFF';
  const checkDigits = String(Math.floor(Math.random() * 90) + 10);
  const bban = bankCode + checkDigits + accountNumber;
  return `${countryCode}${checkDigits} ${bban.slice(0, 4)} ${bban.slice(4, 8)} ${bban.slice(8, 12)} ${bban.slice(12)}`;
}

function generateSWIFT() {
  return 'AFFIUS33XXX';
}

async function createUser(email, fullName, kycStatus) {
  console.log(`Creating user: ${email} (${kycStatus})...`);
  
  const authId = 'auth-' + Math.random().toString(36).substring(2, 15);
  
  // 1. Create User Document
  const userRef = await addDoc(collection(db, 'users'), {
    auth_id: authId,
    email: email,
    full_name: fullName,
    phone: "+1 (555) 019-2831",
    address: "123 Swift Way, Union City, SC",
    ssn: "999-12-3456",
    kyc_status: kycStatus,
    status: 'active',
    created_at: new Date().toISOString()
  });

  const userId = userRef.id;
  console.log(`Created user record with ID: ${userId}`);

  // 2. Create Checking Account Document
  const accountNumber = generateAccountNumber();
  const accountRef = await addDoc(collection(db, 'accounts'), {
    user_id: userId,
    account_number: accountNumber,
    iban: generateIBAN(accountNumber),
    swift: generateSWIFT(),
    account_type: 'checking',
    currency: 'USD',
    status: 'active',
    nickname: 'Primary Checking',
    created_at: new Date().toISOString()
  });

  const accountId = accountRef.id;
  console.log(`Created checking account with ID: ${accountId}`);

  // 3. Create Balance Document (Starts with $5,500.00 for testing)
  await addDoc(collection(db, 'balances'), {
    account_id: accountId,
    available: 5500.00,
    pending: 0.00,
    created_at: new Date().toISOString()
  });
  console.log(`Created balance record for account.`);

  // 4. Create KYC Documents
  await addDoc(collection(db, 'kyc_documents'), { user_id: userId, doc_type: 'national_id', file_name: 'id_front.jpg', status: kycStatus === 'approved' ? 'approved' : 'pending', created_at: new Date().toISOString() });
  await addDoc(collection(db, 'kyc_documents'), { user_id: userId, doc_type: 'national_id', file_name: 'id_back.jpg', status: kycStatus === 'approved' ? 'approved' : 'pending', created_at: new Date().toISOString() });
  await addDoc(collection(db, 'kyc_documents'), { user_id: userId, doc_type: 'selfie', file_name: 'selfie.jpg', status: kycStatus === 'approved' ? 'approved' : 'pending', created_at: new Date().toISOString() });
  console.log(`Created KYC document states.`);

  // 5. Create Notification
  await addDoc(collection(db, 'notifications'), {
    user_id: userId,
    title: 'Welcome to IDB Global Federal Credit Union!',
    message: kycStatus === 'approved' 
      ? 'Your account has been fully verified and approved. Welcome aboard!' 
      : 'Your account has been created. Your registration is pending review and will be approved shortly.',
    type: 'info',
    created_at: new Date().toISOString()
  });
  console.log(`Created welcome notifications.`);
  console.log(`--- Finished ${email} ---`);
}

async function run() {
  try {
    await createUser('approveduser@idbglobalfcu.com', 'Approved Test User', 'approved');
    await createUser('pendinguser@idbglobalfcu.com', 'Pending Test User', 'pending');
    console.log('Successfully generated all test users!');
    process.exit(0);
  } catch (err) {
    console.error('Error running script:', err);
    process.exit(1);
  }
}

run();
