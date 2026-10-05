// ── IDB GLOBAL FEDERAL CREDIT UNION — FIREBASE CLIENT COMPAT ──
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyC4R6WMLqlLA-toYMx7pmqaqocUeDPt0A4",
  authDomain: "idbglobalfcuunion-f4829.firebaseapp.com",
  projectId: "idbglobalfcuunion-f4829",
  storageBucket: "idbglobalfcuunion-f4829.firebasestorage.app",
  messagingSenderId: "614788315076",
  appId: "1:614788315076:web:741ad1fed22b3be6e91691"
};

let db = null;
let auth = null;
let storage = null;

if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && !localStorage.getItem('mock_db_users')) {
  const defaultUsers = [
    {
      id: 'local-approved-user-id',
      auth_id: 'auth-local-approved',
      email: 'approveduser@idbglobalfcu.com',
      full_name: 'Approved Test User',
      phone: '+1 (555) 019-2831',
      address: '123 Swift Way, Union City, SC',
      ssn: '999-12-3456',
      kyc_status: 'approved',
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 'local-pending-user-id',
      auth_id: 'auth-local-pending',
      email: 'pendinguser@idbglobalfcu.com',
      full_name: 'Pending Test User',
      phone: '+1 (555) 019-2832',
      address: '124 Swift Way, Union City, SC',
      ssn: '999-12-3457',
      kyc_status: 'pending',
      status: 'active',
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem('mock_db_users', JSON.stringify(defaultUsers));

  const defaultAccounts = [
    {
      id: 'local-acct-approved',
      user_id: 'local-approved-user-id',
      account_number: '447100000001',
      iban: 'US99 AFF99 4471 0000 0001',
      swift: 'AFFIUS33XXX',
      account_type: 'checking',
      currency: 'USD',
      status: 'active',
      nickname: 'Primary Checking',
      created_at: new Date().toISOString()
    },
    {
      id: 'local-acct-pending',
      user_id: 'local-pending-user-id',
      account_number: '447100000002',
      iban: 'US99 AFF99 4471 0000 0002',
      swift: 'AFFIUS33XXX',
      account_type: 'checking',
      currency: 'USD',
      status: 'active',
      nickname: 'Primary Checking',
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem('mock_db_accounts', JSON.stringify(defaultAccounts));

  const defaultBalances = [
    {
      id: 'local-bal-approved',
      account_id: 'local-acct-approved',
      available: 5500.00,
      pending: 0.00,
      created_at: new Date().toISOString()
    },
    {
      id: 'local-bal-pending',
      account_id: 'local-acct-pending',
      available: 0.00,
      pending: 0.00,
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem('mock_db_balances', JSON.stringify(defaultBalances));

  const defaultCards = [
    {
      id: 'local-card-approved',
      user_id: 'local-approved-user-id',
      account_id: 'local-acct-approved',
      card_number: '4471 9021 8832 4019',
      cardholder: 'Approved Test User',
      expiry: '12/28',
      cvv_hash: '382',
      card_type: 'visa',
      status: 'active',
      hide_details: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'local-card-pending',
      user_id: 'local-pending-user-id',
      account_id: 'local-acct-pending',
      card_number: '4471 6391 0029 5518',
      cardholder: 'Pending Test User',
      expiry: '09/27',
      cvv_hash: '714',
      card_type: 'visa',
      status: 'active',
      hide_details: false,
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem('mock_db_cards', JSON.stringify(defaultCards));

  localStorage.setItem('aff_mock_pwd_approveduser@idbglobalfcu.com', JSON.stringify('password123'));
  localStorage.setItem('aff_mock_pwd_pendinguser@idbglobalfcu.com', JSON.stringify('password123'));
}

const FORCE_LOCAL_STORAGE = true;

export function initFirebase() {
  if (FORCE_LOCAL_STORAGE) {
    return null;
  }
  if (typeof window !== 'undefined' && window.firebase) {
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }
    db = window.firebase.firestore();
    auth = window.firebase.auth();
    storage = window.firebase.storage();
    return window.firebase;
  }
  console.warn('Firebase not loaded. Add the CDN scripts to your HTML.');
  return null;
}

export function getFirebase() {
  if (FORCE_LOCAL_STORAGE) {
    return null;
  }
  if (!db) initFirebase();
  return window.firebase;
}

// Chained Query Builder to mimic Supabase's chained query API
export class FirebaseQueryBuilder {
  constructor(table) {
    this.table = table;
    this.selectFields = '*';
    this.filters = [];
    this.orderByField = null;
    this.orderAscending = false;
    this.limitVal = null;
    this.isSingle = false;
    this.action = 'select';
    this.actionValues = null;
  }

  select(fields = '*') {
    this.selectFields = fields;
    return this;
  }

  eq(key, value) {
    this.filters.push({ type: 'eq', key, value });
    return this;
  }

  neq(key, value) {
    this.filters.push({ type: 'neq', key, value });
    return this;
  }

  in(key, array) {
    this.filters.push({ type: 'in', key, value: array });
    return this;
  }

  order(column, options = {}) {
    this.orderByField = column;
    this.orderAscending = options.ascending ?? false;
    return this;
  }

  limit(value) {
    this.limitVal = value;
    return this;
  }

  range(from, to) {
    this.rangeVal = { from, to };
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  insert(values) {
    this.action = 'insert';
    this.actionValues = values;
    return this;
  }

  update(values) {
    this.action = 'update';
    this.actionValues = values;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  // Thenable execution for await compatibility
  async then(resolve, reject) {
    try {
      const res = await this.execute();
      if (resolve) resolve(res);
      return res;
    } catch (err) {
      if (reject) reject(err);
      else throw err;
    }
  }

  executeLocalStorageFallback() {
    try {
      const dbKey = 'mock_db_' + this.table;
      let data = [];
      try {
        const stored = localStorage.getItem(dbKey);
        if (stored) data = JSON.parse(stored);
      } catch (e) {
        console.error("Local storage read error for table " + this.table, e);
      }
      if (!Array.isArray(data)) data = [];

      const notifyChange = (action) => {
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('aff_db_event', { detail: { table: this.table, action } }));
            localStorage.setItem('aff_last_db_event', JSON.stringify({ table: this.table, action, t: Date.now() }));
          }
        } catch (e) {}
      };

      if (this.action === 'insert') {
        const isArray = Array.isArray(this.actionValues);
        const toInsert = isArray ? this.actionValues : [this.actionValues];
        const inserted = [];

        for (const item of toInsert) {
          const itemId = item.id || 'local-id-' + Math.random().toString(36).substring(2, 12);
          const newItem = {
            created_at: item.created_at || new Date().toISOString(),
            ...item,
            id: itemId
          };
          const existingIdx = data.findIndex(d => d.id === itemId || (newItem.auth_id && d.auth_id === newItem.auth_id));
          if (existingIdx !== -1) {
            data[existingIdx] = { ...data[existingIdx], ...newItem };
            inserted.push(data[existingIdx]);
          } else {
            data.push(newItem);
            inserted.push(newItem);
          }
        }

        localStorage.setItem(dbKey, JSON.stringify(data));
        notifyChange('insert');
        return { data: isArray ? inserted : inserted[0], error: null };
      }

      if (this.action === 'update' || this.action === 'delete') {
        const updated = [];
        const kept = [];

        data.forEach(item => {
          let match = true;
          this.filters.forEach(f => {
            if (f.type === 'eq' && item[f.key] !== f.value) match = false;
            if (f.type === 'neq' && item[f.key] === f.value) match = false;
            if (f.type === 'in' && (!Array.isArray(f.value) || !f.value.includes(item[f.key]))) match = false;
          });

          if (match) {
            if (this.action === 'update') {
              const updatedItem = { ...item, ...this.actionValues };
              updated.push(updatedItem);
              kept.push(updatedItem);
            }
          } else {
            kept.push(item);
          }
        });

        localStorage.setItem(dbKey, JSON.stringify(kept));
        notifyChange(this.action);
        return { data: this.action === 'update' ? updated : null, error: null };
      }

      // Default select
      let results = [...data];
      this.filters.forEach(f => {
        if (f.type === 'eq') results = results.filter(item => item[f.key] === f.value);
        if (f.type === 'neq') results = results.filter(item => item[f.key] !== f.value);
        if (f.type === 'in') {
          if (f.value.length === 0) results = [];
          else results = results.filter(item => f.value.includes(item[f.key]));
        }
      });

      if (this.orderByField) {
        results.sort((a, b) => {
          let valA = a[this.orderByField];
          let valB = b[this.orderByField];
          if (valA === undefined || valA === null) valA = '';
          if (valB === undefined || valB === null) valB = '';

          const timeA = Date.parse(valA);
          const timeB = Date.parse(valB);
          if (!isNaN(timeA) && !isNaN(timeB)) {
            return this.orderAscending ? timeA - timeB : timeB - timeA;
          }

          if (typeof valA === 'number' && typeof valB === 'number') {
            return this.orderAscending ? valA - valB : valB - valA;
          }

          const strA = String(valA).toLowerCase();
          const strB = String(valB).toLowerCase();
          if (strA < strB) return this.orderAscending ? -1 : 1;
          if (strA > strB) return this.orderAscending ? 1 : -1;
          return 0;
        });
      }

      if (this.rangeVal) {
        results = results.slice(this.rangeVal.from, this.rangeVal.to + 1);
      } else if (this.limitVal) {
        results = results.slice(0, this.limitVal);
      }

      if (this.isSingle) {
        return { data: results[0] || null, error: null };
      }

      return { data: results, error: null };
    } catch (fallbackErr) {
      console.error("Local storage fallback crash:", fallbackErr);
      return { data: null, error: fallbackErr };
    }
  }

  async execute() {
    if (FORCE_LOCAL_STORAGE) {
      return this.executeLocalStorageFallback();
    }

    // If the table is not 'users', execute offline using LocalStorage
    if (this.table !== 'users') {
      return this.executeLocalStorageFallback();
    }

    const fApp = getFirebase();
    if (!fApp) {
      return this.executeLocalStorageFallback();
    }

    try {
      const runQuery = async () => {
        const firestore = fApp.firestore();
        const colRef = firestore.collection(this.table);

        if (this.action === 'insert') {
          const isArray = Array.isArray(this.actionValues);
          const toInsert = isArray ? this.actionValues : [this.actionValues];
          const results = [];

          for (const item of toInsert) {
            let docRef;
            const dataToSet = {
              ...item,
              created_at: item.created_at || new Date().toISOString()
            };
            if (item.id) {
              docRef = colRef.doc(item.id);
              await docRef.set(dataToSet);
            } else {
              docRef = await colRef.add(dataToSet);
            }
            const docSnap = await docRef.get();
            results.push({ id: docRef.id, ...docSnap.data() });
          }

          return { data: isArray ? results : results[0], error: null };
        }

        if (this.action === 'update' || this.action === 'delete') {
          let q = colRef;
          this.filters.forEach(f => {
            if (f.type === 'eq') q = q.where(f.key, '==', f.value);
            else if (f.type === 'neq') q = q.where(f.key, '!=', f.value);
            else if (f.type === 'in') q = q.where(f.key, 'in', f.value);
          });

          const snapshot = await q.get();
          const batch = firestore.batch();
          const results = [];

          snapshot.forEach(doc => {
            const docRef = colRef.doc(doc.id);
            if (this.action === 'update') {
              batch.update(docRef, this.actionValues);
              results.push({ id: doc.id, ...doc.data(), ...this.actionValues });
            } else {
              batch.delete(docRef);
            }
          });

          await batch.commit();
          return { data: this.action === 'update' ? results : null, error: null };
        }

        // Default select action
        let q = colRef;
        this.filters.forEach(f => {
          if (f.type === 'eq') q = q.where(f.key, '==', f.value);
          else if (f.type === 'neq') q = q.where(f.key, '!=', f.value);
          else if (f.type === 'in') {
            if (f.value.length === 0) {
              q = q.where(window.firebase.firestore.FieldPath.documentId(), '==', 'nonexistent_id_val');
            } else {
              q = q.where(f.key, 'in', f.value);
            }
          }
        });

        const snapshot = await q.get();
        let results = [];
        snapshot.forEach(doc => {
          results.push({ id: doc.id, ...doc.data() });
        });

        if (this.orderByField) {
          results.sort((a, b) => {
            const valA = a[this.orderByField];
            const valB = b[this.orderByField];
            if (valA === undefined || valB === undefined) return 0;
            const parsedA = Date.parse(valA) || Number(valA) || String(valA).toLowerCase();
            const parsedB = Date.parse(valB) || Number(valB) || String(valB).toLowerCase();
            if (parsedA < parsedB) return this.orderAscending ? -1 : 1;
            if (parsedA > parsedB) return this.orderAscending ? 1 : -1;
            return 0;
          });
        }

        if (this.limitVal) {
          results = results.slice(0, this.limitVal);
        }

        // Handle simulated joins (e.g., cards requesting users(full_name))
        if (this.table === 'cards' && this.selectFields.includes('users(')) {
          for (let card of results) {
            if (card.user_id) {
              const userDoc = await firestore.collection('users').doc(card.user_id).get();
              if (userDoc.exists) {
                card.users = { full_name: userDoc.data().full_name };
              }
            }
          }
        }

        if (this.isSingle) {
          return { data: results[0] || null, error: null };
        }

        return { data: results, error: null };
      };

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Firestore timeout")), 1500)
      );

      return await Promise.race([runQuery(), timeoutPromise]);
    } catch (err) {
      console.warn("Firestore error or timeout encountered. Falling back to LocalStorage.", err);
      return this.executeLocalStorageFallback();
    }
  }
}

export function getSupabase() {
  getFirebase();
  return {
    from: (table) => new FirebaseQueryBuilder(table),
    auth: {
      signUp: async ({ email, password, options }) => {
        try {
          const fApp = getFirebase();
          if (!fApp) throw new Error("Firebase disabled or not loaded");
          const signUpPromise = fApp.auth().createUserWithEmailAndPassword(email, password);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Firebase timeout")), 1500)
          );
          const res = await Promise.race([signUpPromise, timeoutPromise]);
          const uid = res.user.uid;
          if (options && options.data) {
            try {
              const timeoutWrite = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Firestore write timeout")), 1500)
              );
              const writePromise = fApp.firestore().collection('users').doc(uid).set({
                id: uid,
                email,
                ...options.data,
                created_at: new Date().toISOString()
              });
              await Promise.race([writePromise, timeoutWrite]);
            } catch (fsErr) {
              console.warn("Firestore profile write failed during signUp, writing to localStorage:", fsErr);
              const dbKey = 'mock_db_users';
              let data = [];
              try {
                const stored = localStorage.getItem(dbKey);
                if (stored) data = JSON.parse(stored);
              } catch (e) {}
              
              // Add/update fallback profile
              const existingIdx = data.findIndex(u => u.email === email || u.id === uid);
              const profileData = {
                id: uid,
                auth_id: uid,
                email,
                ...options.data,
                created_at: new Date().toISOString()
              };
              if (existingIdx !== -1) data[existingIdx] = profileData;
              else data.push(profileData);
              
              localStorage.setItem(dbKey, JSON.stringify(data));
            }
          }
          return { data: res, error: null };
        } catch (err) {
          console.warn("Firebase signUp failed or timed out. Using LocalStorage fallback.", err);
          const uid = 'local-user-' + Math.random().toString(36).substring(2, 12);
          
          const dbKey = 'mock_db_users';
          let data = [];
          try {
            const stored = localStorage.getItem(dbKey);
            if (stored) data = JSON.parse(stored);
          } catch (e) {}
          
          if (data.some(u => u.email === email)) {
            return { data: null, error: { code: 'auth/email-already-in-use', message: 'Email already registered.' } };
          }
          
          const profileData = {
            id: uid,
            auth_id: uid,
            email,
            ...(options?.data || {}),
            created_at: new Date().toISOString()
          };
          data.push(profileData);
          localStorage.setItem(dbKey, JSON.stringify(data));
          
          localStorage.setItem('aff_mock_pwd_' + email, JSON.stringify(password));
          
          const mockUser = { uid, email };
          localStorage.setItem('mock_session', JSON.stringify({ user: { id: uid, email } }));
          
          return { data: { user: mockUser }, error: null };
        }
      },
      signInWithPassword: async ({ email, password }) => {
        try {
          const fApp = getFirebase();
          if (!fApp) throw new Error("Firebase disabled or not loaded");
          const signInPromise = fApp.auth().signInWithEmailAndPassword(email, password);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Firebase timeout")), 1500)
          );
          const res = await Promise.race([signInPromise, timeoutPromise]);
          return { data: res, error: null };
        } catch (err) {
          console.warn("Firebase signIn failed or timed out. Using LocalStorage fallback.", err);
          const rawStoredPwd = localStorage.getItem('aff_mock_pwd_' + email) || localStorage.getItem('mock_pwd_' + email);
          if (rawStoredPwd !== null) {
            let parsedPwd = rawStoredPwd;
            try {
              parsedPwd = JSON.parse(rawStoredPwd);
            } catch (e) {
              parsedPwd = rawStoredPwd;
            }
            if (parsedPwd === password || rawStoredPwd === password) {
              const dbKey = 'mock_db_users';
              let users = [];
              try {
                const stored = localStorage.getItem(dbKey);
                if (stored) users = JSON.parse(stored);
              } catch (e) {}
              const user = users.find(u => u.email === email);
              if (user) {
                const mockUser = { uid: user.id || user.auth_id, email: user.email };
                localStorage.setItem('mock_session', JSON.stringify({ user: { id: user.id || user.auth_id, email: user.email } }));
                return { data: { user: mockUser }, error: null };
              }
            }
          }
          return { data: null, error: { message: 'Invalid email or password.' } };
        }
      },
      signOut: async () => {
        try {
          const fApp = getFirebase();
          if (fApp) await fApp.auth().signOut();
          return { error: null };
        } catch (err) {
          return { error: err };
        }
      },
      getSession: async () => {
        try {
          const fApp = getFirebase();
          if (fApp) {
            const user = fApp.auth()?.currentUser;
            if (user) {
              return { data: { session: { user: { id: user.uid, email: user.email } } } };
            }
          }
        } catch (e) {}
        return { data: { session: null } };
      },
      getUser: async () => {
        try {
          const fApp = getFirebase();
          if (fApp) {
            const user = fApp.auth()?.currentUser;
            return { data: { user } };
          }
        } catch (e) {}
        return { data: { user: null } };
      }
    },
    storage: {
      from: (bucket) => {
        return {
          upload: async (path, file) => {
            try {
              const fApp = getFirebase();
              if (!fApp) throw new Error("Firebase storage disabled");
              const ref = fApp.storage().ref().child(`${bucket}/${path}`);
              const snapshot = await ref.put(file);
              return { data: snapshot, error: null };
            } catch (err) {
              return { data: null, error: err };
            }
          },
          getPublicUrl: (path) => {
            const bucketName = firebaseConfig.storageBucket || `${firebaseConfig.projectId}.appspot.com`;
            const encodedPath = encodeURIComponent(`${bucket}/${path}`);
            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
            return { publicUrl };
          }
        };
      }
    }
  };
}

export { initFirebase as initSupabase };

// ── AUTH HELPERS ──
export async function signUp(email, password, metadata = {}) {
  const dbCompat = getSupabase();
  return await dbCompat.auth.signUp({
    email, password,
    options: { data: metadata }
  });
}

export async function signIn(email, password) {
  const dbCompat = getSupabase();
  return await dbCompat.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  localStorage.removeItem('mock_session');
  const dbCompat = getSupabase();
  return await dbCompat.auth.signOut();
}

export async function getSession() {
  const mock = localStorage.getItem('mock_session');
  if (mock) return JSON.parse(mock);

  const dbCompat = getSupabase();
  const { data: { session } } = await dbCompat.auth.getSession();
  return session;
}

export async function getUser() {
  const mock = localStorage.getItem('mock_session');
  if (mock) return JSON.parse(mock).user;

  const dbCompat = getSupabase();
  const { data: { user } } = await dbCompat.auth.getUser();
  return user;
}

export async function resetPassword(email) {
  try {
    const fApp = getFirebase();
    if (!fApp) throw new Error("Firebase disabled");
    await fApp.auth().sendPasswordResetEmail(email);
    return { data: {}, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

// ── DATABASE HELPERS ──
export async function dbSelect(table, query = {}) {
  let q = new FirebaseQueryBuilder(table).select(query.select || '*');
  if (query.eq) Object.entries(query.eq).forEach(([k, v]) => q = q.eq(k, v));
  if (query.neq) Object.entries(query.neq).forEach(([k, v]) => q = q.neq(k, v));
  if (query.order) q = q.order(query.order.column, { ascending: query.order.ascending ?? false });
  if (query.limit) q = q.limit(query.limit);
  if (query.range) q = q.range(query.range[0], query.range[1]);
  return await q;
}

export async function dbInsert(table, values) {
  return await new FirebaseQueryBuilder(table).insert(values);
}

export async function dbUpdate(table, values, match) {
  let q = new FirebaseQueryBuilder(table).update(values);
  Object.entries(match).forEach(([k, v]) => q = q.eq(k, v));
  return await q;
}

export async function dbDelete(table, match) {
  let q = new FirebaseQueryBuilder(table).delete();
  Object.entries(match).forEach(([k, v]) => q = q.eq(k, v));
  return await q;
}

// ── REALTIME SUBSCRIPTIONS ──
export function subscribeToTable(table, callback, filter = null) {
  // Local event listeners (same-tab and cross-tab)
  const localHandler = (e) => {
    if (e.detail && e.detail.table === table) {
      callback({
        event: e.detail.action === 'insert' ? 'INSERT' : 'UPDATE',
        table: table
      });
    }
  };

  const storageHandler = (e) => {
    if (e.key === 'aff_last_db_event' || e.key === 'mock_db_' + table) {
      callback({
        event: 'UPDATE',
        table: table
      });
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('aff_db_event', localHandler);
    window.addEventListener('storage', storageHandler);
  }

  const fApp = getFirebase();
  if (!fApp) {
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('aff_db_event', localHandler);
        window.removeEventListener('storage', storageHandler);
      }
    };
  }

  let q = fApp.firestore().collection(table);

  if (filter) {
    const parts = filter.split('=');
    if (parts.length === 2) {
      const field = parts[0];
      const condition = parts[1];
      if (condition.startsWith('eq.')) {
        const val = condition.replace('eq.', '');
        q = q.where(field, '==', val);
      }
    }
  }

  const firestoreUnsub = q.onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added' || change.type === 'modified') {
        callback({
          event: change.type === 'added' ? 'INSERT' : 'UPDATE',
          new: { id: change.doc.id, ...change.doc.data() }
        });
      }
    });
  }, error => {
    console.warn("Firestore subscription notice:", error.message || error);
  });

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('aff_db_event', localHandler);
      window.removeEventListener('storage', storageHandler);
    }
    if (typeof firestoreUnsub === 'function') firestoreUnsub();
  };
}

export function unsubscribe(channel) {
  if (typeof channel === 'function') {
    channel();
  }
}

// ── STORAGE HELPERS ──
export async function uploadFile(bucket, path, file) {
  const dbCompat = getSupabase();
  return await dbCompat.storage.from(bucket).upload(path, file);
}

export function getFileUrl(bucket, path) {
  const dbCompat = getSupabase();
  const { publicUrl } = dbCompat.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}

// ── IP CAPTURE ──
export async function captureIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const { ip } = await res.json();
    return ip;
  } catch(e) { return 'unknown'; }
}

// ── LOG LOGIN ──
export async function logLogin(userId, success = true) {
  const ip = await captureIP();
  return dbInsert('login_logs', {
    user_id: userId,
    ip_address: ip,
    user_agent: navigator.userAgent,
    success: success,
    timestamp: new Date().toISOString()
  });
}

// ── LOG ADMIN ACTION ──
export async function logAdminAction(adminId, action, entityType, entityId, oldValue = null, newValue = null) {
  const ip = await captureIP();
  return dbInsert('admin_logs', {
    admin_id: adminId,
    action, entity_type: entityType, entity_id: entityId,
    old_value: oldValue ? JSON.stringify(oldValue) : null,
    new_value: newValue ? JSON.stringify(newValue) : null,
    ip_address: ip,
    timestamp: new Date().toISOString()
  });
}
