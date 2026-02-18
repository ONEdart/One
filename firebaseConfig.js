// firebaseConfig.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
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
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,                 // <-- TAMBAHKAN
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export {
  app,
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
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  db,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,                 // <-- EKSPOR
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
};

export default app;