import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Import Firebase Auth SDK components (Updated to include email/password features)
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword, // ◄ ADDED FOR CONVENTIONAL REGISTER
  signInWithEmailAndPassword, // ◄ ADDED FOR CONVENTIONAL LOGIN
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// IMPORT CREDENTIALS
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app); // Export auth instance so app.js can watch user state
const googleProvider = new GoogleAuthProvider();

// Global runtime memory to store current user configuration profile cache
let userSettingsCache = {
  displayCurrency: "INR",
  totalBudget: "0",
  budgetMeta: { currency: "INR", originalAmount: 0 },
  categoryLimits: {}, // ◄ NEW MODULAR EXTENSION: Maps user spending metrics dynamically per tag
};

// ───────────────────────────────────────────────────────────
// 🔐 AUTHENTICATION FLOWS (Conventional Email + Google OAuth)
// ───────────────────────────────────────────────────────────

/**
 * Creates a brand new secure multi-user account profile via email/password credentials
 */
export async function registerWithEmail(email, password) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Successfully registered new user profile:", result.user.email);
    return result.user;
  } catch (error) {
    console.error("Registration failed:", error.message);
    throw error;
  }
}

/**
 * Validates baseline text email/password authentication credential pairs
 */
export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log("Successfully verified user tokens:", result.user.email);
    return result.user;
  } catch (error) {
    console.error("Login authorization failed:", error.message);
    throw error;
  }
}

/**
 * Triggers Google Sign-In Popup window
 */
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Successfully logged in user:", result.user.displayName);
    return result.user;
  } catch (error) {
    console.error("Authentication process failed:", error);
    throw error;
  }
}

/**
 * Destroys active user token credentials session
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    console.log("User successfully logged out session.");
  } catch (error) {
    console.error("Logout process encountered an error:", error);
  }
}

// ───────────────────────────────────────────────────────────
// USER ACCOUNT PRIVATE SETTINGS MANAGEMENT (Replacing LocalStorage)
// ───────────────────────────────────────────────────────────

/**
 * Pulls down settings configuration parameters directly from user's private settings slot
 */
export async function fetchUserSettings(uid) {
  try {
    const settingsDocRef = doc(db, "users", uid, "config", "settings");
    const settingsSnapshot = await getDoc(settingsDocRef);

    if (settingsSnapshot.exists()) {
      userSettingsCache = settingsSnapshot.data();
      // Ensure categoryLimits sub-bucket initializes safely if reading legacy accounts
      if (!userSettingsCache.categoryLimits) {
        userSettingsCache.categoryLimits = {};
      }
    } else {
      // Default configurations fallback if account settings file doesn't exist yet
      userSettingsCache = {
        displayCurrency: "INR",
        totalBudget: "0",
        budgetMeta: { currency: "INR", originalAmount: 0 },
        categoryLimits: {},
      };
    }
  } catch (error) {
    console.error("Error reading user cloud configuration files:", error);
  }
}

/**
 * Saves running adjustments up to user's database configuration file
 */
async function saveUserSettingsToCloud(uid) {
  try {
    const settingsDocRef = doc(db, "users", uid, "config", "settings");
    await setDoc(settingsDocRef, userSettingsCache);
  } catch (error) {
    console.error(
      "Failed saving profile configurations up to Firestore cloud:",
      error,
    );
  }
}

export function getDisplayCurrency() {
  return userSettingsCache.displayCurrency;
}
export async function setDisplayCurrency(currencyCode) {
  userSettingsCache.displayCurrency = currencyCode;
  if (auth.currentUser) await saveUserSettingsToCloud(auth.currentUser.uid);
}

export function getTotalBudget() {
  return userSettingsCache.totalBudget;
}
export async function setTotalBudget(amountNumber) {
  userSettingsCache.totalBudget = amountNumber;
  if (auth.currentUser) await saveUserSettingsToCloud(auth.currentUser.uid);
}

export function getBudgetMeta() {
  return userSettingsCache.budgetMeta;
}
export async function setBudgetMeta(currency, originalAmount) {
  userSettingsCache.budgetMeta = { currency, originalAmount };
  if (auth.currentUser) await saveUserSettingsToCloud(auth.currentUser.uid);
}

// ─────────────────────────────────────────────────────────────
// NEW CATEGORY LIMIT CLOUD ENDPOINTS MAPPED TO PRIVATE USER SECTORS
// ─────────────────────────────────────────────────────────────

/**
 * NEW HOOK: Retrieves cloud-stored data specific to individual structural category limits
 */
export function getCategoryLimit(categoryName) {
  return userSettingsCache.categoryLimits?.[categoryName] || "0";
}

/**
 * NEW HOOK: Commits budget metric changes dynamically up to private user configuration nodes
 */
export async function setCategoryLimit(categoryName, amountNumber) {
  if (!userSettingsCache.categoryLimits) {
    userSettingsCache.categoryLimits = {};
  }
  userSettingsCache.categoryLimits[categoryName] = Number(amountNumber);
  if (auth.currentUser) await saveUserSettingsToCloud(auth.currentUser.uid);
}

// ───────────────────────────────────────────────────────────
// TRANSACTION LEDGER MANAGEMENT (Organized by User ID)
// ───────────────────────────────────────────────────────────

/**
 * Gathers target transaction array mapped inside user sub-collection
 */
export async function getAllTrans() {
  if (!auth.currentUser) return [];
  try {
    const userTransCollection = collection(
      db,
      "users",
      auth.currentUser.uid,
      "transactions",
    );
    const q = query(userTransCollection, orderBy("time", "desc"));
    const querySnapshot = await getDocs(q);

    const transactionsList = [];
    querySnapshot.forEach((doc) => {
      transactionsList.push({ docId: doc.id, ...doc.data() });
    });
    return transactionsList;
  } catch (error) {
    console.error(
      "Error retrieving user records from Firestore collection: ",
      error,
    );
    return [];
  }
}

export async function saveTrans(transObj) {
  if (!auth.currentUser) return null;

  try {
    if (transObj.docId) {
      await setDoc(
        doc(
          db,
          "users",
          auth.currentUser.uid,
          "transactions",
          transObj.docId
        ),
        transObj,
        { merge: true }
      );

      return transObj.docId;
    }

    const userTransCollection = collection(
      db,
      "users",
      auth.currentUser.uid,
      "transactions"
    );

    const docRef = await addDoc(userTransCollection, transObj);
    return docRef.id;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function deleteTrans(firestoreId) {
    console.log("deleteTrans received:", firestoreId, typeof firestoreId);
  if (!auth.currentUser) return;
  try {
    const docToDelRef = doc(
      db,
      "users",
      auth.currentUser.uid,
      "transactions",
      firestoreId,
    );
    await deleteDoc(docToDelRef);
      console.log("Deleted:", firestoreId);

  } catch (error) {
    console.error("Error processing user data deletion request:", error);
  }
}

// ───────────────────────────────────────────────────────────
// CUSTOM CATEGORY TAGS MANAGEMENT (Organized by User ID)
// ───────────────────────────────────────────────────────────

export async function getAllTags() {
  if (!auth.currentUser) return [];
  try {
    const userTagsCollection = collection(
      db,
      "users",
      auth.currentUser.uid,
      "tags",
    );
    const querySnapshot = await getDocs(userTagsCollection);

    // 1. Establish your 12 baseline project expense presets that MUST always be present
    const finalTagsList = [
      "Miscellaneous 🌀",
      "Education & Books 📚",
      "Travel & Vacation ✈️",
      "Insurance 🛡️",
      "Health & Medical 🏥",
      "Shopping 🛍️",
      "Entertainment 🎬",
      "Rent & Housing 🏠",
      "Bills & Utilities 💳",
      "Transport & Fuel 🚗",
      "Groceries 🛒",
      "Food & Dining 🍔",
    ];

    // 2. Read whatever custom tags this specific user added from the cloud
    querySnapshot.forEach((doc) => {
      const customTagName = doc.data().name;

      // Safety Check: Only append the custom tag if it isn't a duplicate of a default tag
      if (!finalTagsList.includes(customTagName)) {
        finalTagsList.push(customTagName);
      }
    });

    // 3. Always return the combined master list
    return finalTagsList;
  } catch (error) {
    console.error("Error retrieving custom tags map structure array:", error);
    return [];
  }
}

export async function saveTag(tagString) {
  if (!auth.currentUser) return;
  try {
    const userTagsCollection = collection(
      db,
      "users",
      auth.currentUser.uid,
      "tags",
    );
    await addDoc(userTagsCollection, { name: tagString });
  } catch (error) {
    console.error(
      "Error saving target tag string up to database folder location:",
      error,
    );
  }
}

export async function findTran(targetDocId) {
  try {
    const all = await getAllTrans();
    return all.find(item => item.docId === targetDocId) || null;
  } catch {
    return null;
  }
}
