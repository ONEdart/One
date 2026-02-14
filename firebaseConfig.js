// firebaseConfig.js

// Import Firebase dari CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAX0sn-fh9bynPShGTpOd1-Y4XfeLmk26k",
  authDomain: "pakelstorage.firebaseapp.com",
  databaseURL: "https://pakelstorage-default-rtdb.firebaseio.com",
  projectId: "pakelstorage",
  storageBucket: "pakelstorage.firebasestorage.app",
  messagingSenderId: "366203011310",
  appId: "1:366203011310:web:faf4a8d88909e6401633ff",
  measurementId: "G-F251GQQNYR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export semua yang diperlukan
export {
  // App & Analytics
  app,
  analytics,
  
  // Auth
  auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
  
  // Firestore
  db,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  
  // Storage
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
};

export default app;