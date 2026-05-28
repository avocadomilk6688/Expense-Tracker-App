import { loginWithEmail, registerWithEmail } from "./firebaseStore.js";

// Layout Card Container Reference Hooks
const loginCardElement = document.getElementById("loginCard");
const registerCardElement = document.getElementById("registerCard");

// Navigation Swapping Links
const switchToRegisterLink = document.getElementById("switchToRegisterLink");
const switchToLoginLink = document.getElementById("switchToLoginLink");

// Input Form Value Field Elements
const authEmailField = document.getElementById("authEmail");
const authPasswordField = document.getElementById("authPassword");
const emailAuthSubmitBtn = document.getElementById("emailAuthSubmitBtn");

const regEmailField = document.getElementById("regEmail");
const regPasswordField = document.getElementById("regPassword");
const emailRegisterSubmitBtn = document.getElementById(
  "emailRegisterSubmitBtn",
);

/**
 * Initializes and binds UI interaction events to handle page view transitions
 */
export function initAuthInterface() {
  // Transition: Hide Login view and display Registration panel
  switchToRegisterLink?.addEventListener("click", (e) => {
    e.preventDefault();
    if (loginCardElement) loginCardElement.style.display = "none";
    if (registerCardElement) registerCardElement.style.display = "block";

    // Clear any previous text entry fields left behind
    if (authEmailField) authEmailField.value = "";
    if (authPasswordField) authPasswordField.value = "";
  });

  // Transition: Hide Registration view and restore standard Login view
  switchToLoginLink?.addEventListener("click", (e) => {
    e.preventDefault();
    if (registerCardElement) registerCardElement.style.display = "none";
    if (loginCardElement) loginCardElement.style.display = "block";

    // Clear any registration entry fields left behind
    if (regEmailField) regEmailField.value = "";
    if (regPasswordField) regPasswordField.value = "";
  });

  // Submit Logic: Conventional Account Sign In Execution Validation
  emailAuthSubmitBtn?.addEventListener("click", async () => {
    const email = authEmailField?.value.trim();
    const password = authPasswordField?.value;

    if (!email || !password) {
      alert("Please fill in both email and password fields.");
      return;
    }

    try {
      await loginWithEmail(email, password);
      if (authEmailField) authEmailField.value = "";
      if (authPasswordField) authPasswordField.value = "";
    } catch (err) {
      alert(`Login Error: ${err.message}`);
    }
  });

  // Submit Logic: Conventional Account Registration Profile Generation
  emailRegisterSubmitBtn?.addEventListener("click", async () => {
    const email = regEmailField?.value.trim();
    const password = regPasswordField?.value;

    if (!email || !password) {
      alert("Please enter a registration email and password.");
      return;
    }
    if (password.length < 6) {
      alert(
        "Security requirement: Password must be at least 6 characters long.",
      );
      return;
    }

    try {
      await registerWithEmail(email, password);
      if (regEmailField) regEmailField.value = "";
      if (regPasswordField) regPasswordField.value = "";
    } catch (err) {
      alert(`Registration Error: ${err.message}`);
    }
  });
}
