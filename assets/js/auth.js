/**
 * Authentication & User Session Management
 */

const Auth = (() => {
  let currentUser = null;
  let isSignUpMode = false;

  // Cached DOM elements
  let authDrawerOverlay;
  let authCloseBtn;
  let authTitle;
  let authSubtitle;
  let authForm;
  let nameGroup;
  let phoneGroup;
  let demoBanner;
  let emailInput;
  let passwordInput;
  let nameInput;
  let phoneInput;
  let submitBtn;
  let tabLoginBtn;
  let tabSignupBtn;
  let bottomToggle;
  let authAlertBox;

  // Header Elements
  let userNavBtn;
  let userNavText;
  let profileDropdown;
  let logoutBtn;

  function init() {
    cacheDOM();
    bindEvents();
    checkSession();
  }

  function cacheDOM() {
    authDrawerOverlay = document.getElementById('auth-drawer-overlay');
    authCloseBtn = document.getElementById('auth-close-btn');
    authTitle = document.getElementById('auth-title');
    authSubtitle = document.getElementById('auth-subtitle');
    authForm = document.getElementById('auth-form');
    nameGroup = document.getElementById('name-group');
    phoneGroup = document.getElementById('phone-group');
    demoBanner = document.getElementById('demo-login-banner');
    emailInput = document.getElementById('auth-email');
    passwordInput = document.getElementById('auth-password');
    nameInput = document.getElementById('auth-name');
    phoneInput = document.getElementById('auth-phone');
    submitBtn = document.getElementById('auth-submit-btn');
    tabLoginBtn = document.getElementById('tab-login-btn');
    tabSignupBtn = document.getElementById('tab-signup-btn');
    bottomToggle = document.getElementById('auth-bottom-toggle');
    authAlertBox = document.getElementById('auth-alert-box');

    userNavBtn = document.getElementById('user-nav-btn');
    userNavText = document.getElementById('user-nav-text');
    profileDropdown = document.getElementById('profile-dropdown');
    logoutBtn = document.getElementById('logout-btn');
  }

  function bindEvents() {
    if (authCloseBtn) {
      authCloseBtn.addEventListener('click', closeAuthDrawer);
    }
    if (authDrawerOverlay) {
      authDrawerOverlay.addEventListener('click', (e) => {
        if (e.target === authDrawerOverlay) closeAuthDrawer();
      });
    }

    if (authForm) {
      authForm.addEventListener('submit', handleAuthSubmit);
    }

    // Close profile dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (profileDropdown && userNavBtn && !userNavBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove('open');
      }
    });

    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
  }

  async function checkSession() {
    try {
      const res = await API.checkAuth();
      if (res && res.logged_in && res.user) {
        currentUser = res.user;
        updateUserUI();
      }
    } catch (e) {
      console.warn('Session check warning:', e);
    }
  }

  function updateUserUI() {
    cacheDOM();
    if (currentUser) {
      const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'Account';
      if (userNavText) userNavText.textContent = firstName;
      const nameEl = document.getElementById('profile-user-name');
      const emailEl = document.getElementById('profile-user-email');
      if (nameEl) nameEl.textContent = currentUser.name || 'Food Lover';
      if (emailEl) emailEl.textContent = currentUser.email || '';
      if (userNavBtn) userNavBtn.classList.add('logged-in');
    } else {
      if (userNavText) userNavText.textContent = 'Sign In';
      const nameEl = document.getElementById('profile-user-name');
      const emailEl = document.getElementById('profile-user-email');
      if (nameEl) nameEl.textContent = 'User Account';
      if (emailEl) emailEl.textContent = 'user@example.com';
      if (userNavBtn) userNavBtn.classList.remove('logged-in');
    }
  }

  function setAuthMode(signUp) {
    isSignUpMode = !!signUp;
    updateModalView();
  }

  function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    updateModalView();
  }

  function updateModalView() {
    cacheDOM();
    if (authAlertBox) authAlertBox.style.display = 'none';

    if (isSignUpMode) {
      if (tabSignupBtn) tabSignupBtn.classList.add('active');
      if (tabLoginBtn) tabLoginBtn.classList.remove('active');
      if (authTitle) authTitle.textContent = 'Create Account';
      if (authSubtitle) authSubtitle.textContent = 'Sign up to order food, save favorites & track delivery';
      if (demoBanner) demoBanner.style.display = 'none';
      if (nameGroup) nameGroup.style.display = 'flex';
      if (phoneGroup) phoneGroup.style.display = 'flex';
      if (submitBtn) {
        submitBtn.textContent = 'CREATE ACCOUNT';
        submitBtn.disabled = false;
      }
      if (bottomToggle) {
        bottomToggle.innerHTML = 'Already have an account? <span style="text-decoration:underline;">Login here</span>';
      }
      if (passwordInput) {
        passwordInput.placeholder = 'Create a secure password';
        passwordInput.autocomplete = 'new-password';
      }
    } else {
      if (tabLoginBtn) tabLoginBtn.classList.add('active');
      if (tabSignupBtn) tabSignupBtn.classList.remove('active');
      if (authTitle) authTitle.textContent = 'Login';
      if (authSubtitle) authSubtitle.textContent = 'Enter your email & password to access your account';
      if (demoBanner) demoBanner.style.display = 'flex';
      if (nameGroup) nameGroup.style.display = 'none';
      if (phoneGroup) phoneGroup.style.display = 'none';
      if (submitBtn) {
        submitBtn.textContent = 'LOGIN';
        submitBtn.disabled = false;
      }
      if (bottomToggle) {
        bottomToggle.innerHTML = "Don't have an account? <span style=\"text-decoration:underline;\">Create one now</span>";
      }
      if (passwordInput) {
        passwordInput.placeholder = '••••••••';
        passwordInput.autocomplete = 'current-password';
      }
    }
  }

  let isSubmitting = false;

  function openAuthDrawer(signUp = false) {
    cacheDOM();
    isSignUpMode = !!signUp;
    updateModalView();
    const overlay = authDrawerOverlay || document.getElementById('auth-drawer-overlay');
    if (overlay) {
      overlay.classList.add('open');
      overlay.style.opacity = '1';
      overlay.style.visibility = 'visible';
      overlay.style.pointerEvents = 'auto';
      const drawer = overlay.querySelector('.auth-drawer');
      if (drawer) {
        drawer.style.transform = 'translateX(0)';
      }
    }
  }

  function closeAuthDrawer() {
    cacheDOM();
    const overlay = authDrawerOverlay || document.getElementById('auth-drawer-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      overlay.style.opacity = '';
      overlay.style.visibility = '';
      overlay.style.pointerEvents = '';
      const drawer = overlay.querySelector('.auth-drawer');
      if (drawer) {
        drawer.style.transform = '';
      }
    }
    const alertBox = authAlertBox || document.getElementById('auth-alert-box');
    if (alertBox) alertBox.style.display = 'none';
  }

  function showAlert(msg, isSuccess = false) {
    cacheDOM();
    if (authAlertBox) {
      authAlertBox.style.display = 'block';
      authAlertBox.style.background = isSuccess ? '#ecfdf5' : '#fef2f2';
      authAlertBox.style.color = isSuccess ? '#065f46' : '#991b1b';
      authAlertBox.style.border = isSuccess ? '1px solid #a7f3d0' : '1px solid #fecaca';
      authAlertBox.textContent = msg;
    }
    showToast(msg, isSuccess ? 'success' : 'error');
  }

  async function handleAuthSubmit(e) {
    if (e) {
      try { e.preventDefault(); } catch (err) {}
      try { e.stopPropagation(); } catch (err) {}
    }
    if (isSubmitting) return false;
    isSubmitting = true;
    cacheDOM();

    const email = ((emailInput || document.getElementById('auth-email'))?.value || '').trim();
    const password = ((passwordInput || document.getElementById('auth-password'))?.value || '').trim();

    if (!email || !password) {
      showAlert('Please enter both email and password.');
      isSubmitting = false;
      return false;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Please wait...';
    }

    try {
      if (isSignUpMode) {
        const nameInputEl = nameInput || document.getElementById('auth-name');
        const phoneInputEl = phoneInput || document.getElementById('auth-phone');
        const name = (nameInputEl ? nameInputEl.value.trim() : '') || 'Food Lover';
        let phone = (phoneInputEl ? phoneInputEl.value.trim() : '');
        if (!name) {
          showAlert('Please enter your full name.');
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'CREATE ACCOUNT'; }
          isSubmitting = false;
          return false;
        }
        if (!phone) {
          phone = '98' + Math.floor(10000000 + Math.random() * 90000000);
        }

        const res = await API.register({ name, email, phone, password });
        if (res && res.success) {
          currentUser = res.user;
          updateUserUI();
          showAlert(`Account created successfully! Welcome, ${currentUser.name}! 🎉`, true);
          setTimeout(() => {
            closeAuthDrawer();
            if (authAlertBox) authAlertBox.style.display = 'none';
          }, 800);
        } else {
          showAlert(res && res.message ? res.message : 'Registration failed. Please check your details and try again.');
        }
      } else {
        const res = await API.login(email, password);
        if (res && res.success) {
          currentUser = res.user;
          updateUserUI();
          showAlert(`Welcome back, ${currentUser.name}! 🍔`, true);
          setTimeout(() => {
            closeAuthDrawer();
            if (authAlertBox) authAlertBox.style.display = 'none';
          }, 800);
        } else {
          showAlert(res && res.message ? res.message : 'Invalid email or password.');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      showAlert('An unexpected error occurred. Please try again.');
    } finally {
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = isSignUpMode ? 'CREATE ACCOUNT' : 'LOGIN';
      }
    }
  }

  async function handleLogout() {
    await API.logout();
    currentUser = null;
    updateUserUI();
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) dropdown.classList.remove('open');
    showToast('Logged out successfully', 'success');
  }

  function handleUserNavClick(e) {
    if (e) {
      try { e.stopPropagation(); } catch (err) {}
    }
    cacheDOM();
    const dropdown = profileDropdown || document.getElementById('profile-dropdown');
    if (dropdown && e && e.target && dropdown.contains(e.target) && e.target !== dropdown) {
      return;
    }
    if (currentUser && (currentUser.name || currentUser.email || currentUser.id)) {
      if (dropdown) dropdown.classList.toggle('open');
    } else {
      openAuthDrawer(false);
    }
  }

  async function quickDemoLogin() {
    cacheDOM();
    const emailEl = emailInput || document.getElementById('auth-email');
    const passEl = passwordInput || document.getElementById('auth-password');
    if (emailEl) emailEl.value = 'rahul@example.com';
    if (passEl) passEl.value = '123456';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';
    }
    try {
      const res = await API.login('rahul@example.com', '123456');
      if (res && res.success) {
        currentUser = res.user;
        updateUserUI();
        showAlert(`Welcome, ${currentUser.name}! 🎉`, true);
        setTimeout(() => {
          closeAuthDrawer();
        }, 600);
      } else {
        showAlert(res ? res.message : 'Login failed');
      }
    } catch (err) {
      showAlert('Login failed. Please try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'LOGIN';
      }
    }
  }

  return {
    init,
    openAuthDrawer,
    closeAuthDrawer,
    setAuthMode,
    toggleAuthMode,
    handleAuthSubmit,
    handleUserNavClick,
    handleLogout,
    quickDemoLogin,
    getUser: () => currentUser
  };
})();

// Auto-initialize Auth when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Auth.init());
} else {
  Auth.init();
}

// Utility toast notification
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
