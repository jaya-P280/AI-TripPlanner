

import {
  auth,
  db,
  provider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  setDoc,
  doc,
  updateProfile,
  sendPasswordResetEmail
} from './firebase.js';

// ======= DOM Elements =======
const authDialog = document.getElementById('authDialog');
const signInLink = document.getElementById('signInLink');
const LogOutLink = document.getElementById('LogOutLink');
const userProfile = document.getElementById('userProfile');
const userPic = document.getElementById('userPic');
const userDropdownPic = document.getElementById('userDropdownPic');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const profileDropdown = document.getElementById('profileDropdown');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const showForgotPassword = document.getElementById('showForgotPassword');
const backToLogin = document.getElementById('backToLogin');
const resetPasswordBtn = document.getElementById('resetPasswordBtn');
const resetEmail = document.getElementById('resetEmail');

if (signInLink) {
  signInLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (authDialog) {
      if (typeof authDialog.showModal === "function") {
        authDialog.showModal();
        console.log("Dialog shown using showModal()");
      } else {
        authDialog.style.display = "block";
        console.log("Dialog shown by setting display:block");
      }
    } else {
      console.log("authDialog element not found");
    }
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    forgotPasswordForm.style.display = 'none';
  });
}

// ======= Toast Message =======
function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = "toast" + (isError ? " error" : "");
  toast.textContent = message;
  toast.classList.add("show");
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ======= Inline Error Message =======
function showInlineError(inputId, message) {
  const input = document.getElementById(inputId);
  let errorElem = input.nextElementSibling;
  if (!errorElem || !errorElem.classList.contains('inline-error')) {
    errorElem = document.createElement('div');
    errorElem.classList.add('inline-error');
    input.parentNode.insertBefore(errorElem, input.nextSibling);
  }
  errorElem.textContent = message;
  input.classList.add('error-border');
}

function clearInlineErrors() {
  document.querySelectorAll('.inline-error').forEach(e => e.remove());
  document.querySelectorAll('.error-border').forEach(e => e.classList.remove('error-border'));
}

// ======= Update UI =======
function updateUserUI(user) {
  if (user) {
    signInLink.style.display = 'none';
    userProfile.style.display = 'flex';

  const avatarUrl = user.photoURL || 'https://www.gravatar.com/avatar/?d=mp&f=y';
  const avatarDropdownUrl = user.photoURL || 'https://www.gravatar.com/avatar/?d=mp&f=y&s=40';
  userPic.src = avatarUrl;
  userDropdownPic.src = avatarDropdownUrl;

    userName.textContent = user.displayName || "User";
    userEmail.textContent = user.email;
  } else {
    signInLink.style.display = 'inline';
    userProfile.style.display = 'none';
    userPic.src = '';
    userDropdownPic.src = '';
    userName.textContent = '';
    userEmail.textContent = '';
    profileDropdown.style.display = 'none';
  }
}

// ======= Auth Dialog Navigation =======
signInLink?.addEventListener('click', (e) => {
  e.preventDefault();
  console.log("SignIn button clicked");
  if (authDialog) {
    if (typeof authDialog.showModal === "function") {
      authDialog.showModal();
      console.log("Dialog shown using showModal()");
    } else {
      authDialog.style.display = "block";
      console.log("Dialog shown by setting display:block");
    }
  } else {
    console.log("authDialog element not found");
  }
  loginForm.style.display = 'block';
  signupForm.style.display = 'none';
  forgotPasswordForm.style.display = 'none';
});

showSignupLink?.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.style.display = 'none';
  signupForm.style.display = 'block';
  forgotPasswordForm.style.display = 'none';
});

showLoginLink?.addEventListener('click', (e) => {
  e.preventDefault();
  signupForm.style.display = 'none';
  loginForm.style.display = 'block';
  forgotPasswordForm.style.display = 'none';
});

// ======= Signup =======
document.getElementById("signupContinue").addEventListener("click", async () => {
  clearInlineErrors();

  const firstName = document.getElementById("signupFirstName").value.trim();
  const lastName = document.getElementById("signupLastName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!firstName) showInlineError("signupFirstName", "First name is required.");
  if (!lastName) showInlineError("signupLastName", "Last name is required.");
  if (!email) showInlineError("signupEmail", "Email is required.");
  if (!password) showInlineError("signupPassword", "Password is required.");
  if (!confirmPassword) showInlineError("confirmPassword", "Confirm password is required.");
  if (password && confirmPassword && password !== confirmPassword) {
    showInlineError("confirmPassword", "Passwords do not match.");
  }

  if (!firstName || !lastName || !email || !password || !confirmPassword || password !== confirmPassword) return;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      firstName,
      lastName,
      email,
      uid: user.uid,
      createdAt: new Date()
    });

    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`
    });

    showToast("Account created successfully! ✅");
    authDialog.close();
    updateUserUI(user);
    location.reload();
  } catch (error) {
    showInlineError("signupPassword", error.message);
  }
});

// ======= Login =======
document.getElementById("loginContinue").addEventListener("click", async () => {
  clearInlineErrors();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email) showInlineError("loginEmail", "Email is required.");
  if (!password) showInlineError("loginPassword", "Password is required.");
  if (!email || !password) return;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    updateUserUI(user);
    authDialog.close();
    showToast("Login successful! 👋");
    location.reload();
  } catch (error) {
    const errorCode = error.code;

    if (errorCode === 'auth/user-not-found') {
      showInlineError("loginEmail", "No user found with this email.");
    } else if (errorCode === 'auth/wrong-password') {
      showInlineError("loginPassword", "Incorrect password.");
    } else if (errorCode === 'auth/invalid-email') {
      showInlineError("loginEmail", "Invalid email format.");
    } else {
      showInlineError("loginPassword", error.message);
    }
  }
});

// ======= Forgot Password Flow =======
showForgotPassword?.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.style.display = 'none';
  signupForm.style.display = 'none';
  forgotPasswordForm.style.display = 'block';
  clearInlineErrors();
});

backToLogin?.addEventListener('click', (e) => {
  e.preventDefault();
  forgotPasswordForm.style.display = 'none';
  loginForm.style.display = 'block';
  clearInlineErrors();
});

// ======= Enhanced Password Reset =======
resetPasswordBtn?.addEventListener('click', async () => {
  clearInlineErrors();
  const email = resetEmail.value.trim();

  if (!email) {
    showInlineError("resetEmail", "Please enter your email.");
    return;
  }

  try {
    // Show loading state
    resetPasswordBtn.disabled = true;
    resetPasswordBtn.textContent = "Sending...";
    
    // Configure password reset settings
    const actionCodeSettings = {
      url: window.location.origin + '/reset-password', // Custom reset page
      handleCodeInApp: false, // Open in browser instead of app
      dynamicLinkDomain: 'yourdomain.page.link' // If using Firebase Dynamic Links
    };

    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    
    // Success
    showToast(`Password reset email sent to ${email}. Check your inbox (and spam folder).`);
    resetEmail.value = "";
    forgotPasswordForm.style.display = "none";
    loginForm.style.display = "block";
  } catch (error) {
    console.error("Password reset error:", error);
    
    // Enhanced error handling
    const errorCode = error.code;
    let errorMessage = error.message;
    
    if (errorCode === 'auth/user-not-found') {
      errorMessage = "No account found with this email.";
    } else if (errorCode === 'auth/invalid-email') {
      errorMessage = "Please enter a valid email address.";
    } else if (errorCode === 'auth/too-many-requests') {
      errorMessage = "Too many attempts. Please try again later.";
    } else if (errorCode === 'auth/missing-android-pkg-name' || 
               errorCode === 'auth/missing-ios-bundle-id') {
      errorMessage = "Please try from a different device.";
    }
    
    showInlineError("resetEmail", errorMessage);
    showToast("Failed to send reset email. Please try again.", true);
  } finally {
    // Reset button state
    resetPasswordBtn.disabled = false;
    resetPasswordBtn.textContent = "Send Reset Email";
  }
});

// ======= Google Sign-In =======
document.getElementById("googleSignInBtn").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    await setDoc(doc(db, "users", user.uid), {
      firstName: user.displayName?.split(" ")[0] || "",
      lastName: user.displayName?.split(" ")[1] || "",
      email: user.email,
      uid: user.uid,
      photoURL: user.photoURL || "",
      createdAt: new Date()
    }, { merge: true });

    updateUserUI(user);
    authDialog.close();
    showToast("Signed in with Google! ✅");
  } catch (error) {
    showToast(`Google Sign-in failed: ${error.message}`, true);
  }
});

// ======= Logout =======
LogOutLink.addEventListener("click", async (e) => {
  e.preventDefault();
  await signOut(auth);
  updateUserUI(null);
  showToast("Logged out successfully.");
});

// ======= Auth State Observer =======
onAuthStateChanged(auth, (user) => {
  updateUserUI(user);
});

function setupProfileDropdown() {
  const userProfile = document.getElementById('userProfile');
  const profileDropdown = document.getElementById('profileDropdown');

  if (userProfile && profileDropdown) {
    userProfile.addEventListener('click', () => {
      if (profileDropdown.style.display === 'none' || profileDropdown.style.display === '') {
        profileDropdown.style.display = 'block';
      } else {
        profileDropdown.style.display = 'none';
      }
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (event) => {
      if (!userProfile.contains(event.target) && !profileDropdown.contains(event.target)) {
        profileDropdown.style.display = 'none';
      }
    });
  }
}

// Initialize profile dropdown toggle
document.addEventListener('DOMContentLoaded', () => {
  setupProfileDropdown();
});

// ======= Close Dialog =======
document.getElementById("closeDialogBtn")?.addEventListener("click", () => {
  authDialog.close();
});

// ======= Toggle Password Visibility =======
document.querySelectorAll(".toggle-password").forEach((icon) => {
  icon.addEventListener("click", function () {
    const targetId = this.getAttribute("data-target");
    const input = document.getElementById(targetId);
    const isVisible = input.type === "text";

    input.type = isVisible ? "password" : "text";
    this.classList.toggle("fa-eye-slash", isVisible);
    this.classList.toggle("fa-eye", !isVisible);
  });
});

export { updateUserUI };