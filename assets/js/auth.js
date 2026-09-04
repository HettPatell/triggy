/**
 * Authentication & User Session Management
 */

const Auth = (() => {
  let currentUser = null;

  // DOM elements
  const authDrawerOverlay = document.getElementById('auth-drawer-overlay');
  const authCloseBtn = document.getElementById('auth-close-btn');
  const authTitle = document.getElementById('auth-title');
  const authToggleText = document.getElementById('auth-toggle-link');
  const authForm = document.getElementById('auth-form');
  const nameGroup = document.getElementById('name-group');
  const phoneGroup = document.getElementById('phone-group');
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const nameInput = document.getElementById('auth-name');
  const phoneInput = document.getElementById('auth-phone');
  const submitBtn = document.getElementById('auth-submit-btn');

  // Header Elements
  const userNavBtn = document.getElementById('user-nav-btn');
  const userNavText = document.getElementById('user-nav-text');
  const profileDropdown = document.getElementById('profile-dropdown');
  const logoutBtn = document.getElementById('logout-btn');

  let isSignUpMode = false;

  function init() {
    bindEvents();
    checkSession();
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

    if (authToggleText) {
      authToggleText.addEventListener('click', toggleAuthMode);
    }

    if (authForm) {
      authForm.addEventListener('submit', handleAuthSubmit);
    }

    if (userNavBtn) {
      userNavBtn.addEventListener('click', (e) => {
        if (profileDropdown && profileDropdown.contains(e.target) && e.target !== profileDropdown) {
          return;
        }
        if (currentUser) {
          profileDropdown.classList.toggle('open');
        } else {
          openAuthDrawer();
        }
      });
    }

    // Close profile dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (profileDropdown && !userNavBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove('open');
      }
    });

    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
  }

  async function checkSession() {
    const res = await API.checkAuth();
    if (res && res.logged_in && res.user) {
      currentUser = res.user;
      updateUserUI();
    }
  }

  function updateUserUI() {
    if (currentUser) {
      const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'Account';
      userNavText.textContent = firstName;
      const nameEl = document.getElementById('profile-user-name');
      const emailEl = document.getElementById('profile-user-email');
      if (nameEl) nameEl.textContent = currentUser.name || 'Food Lover';
      if (emailEl) emailEl.textContent = currentUser.email || '';
    } else {
      userNavText.textContent = 'Sign In';
    }
  }

  function openAuthDrawer(signUp = false) {
    isSignUpMode = signUp;
    updateModalView();
    const overlay = document.getElementById('auth-drawer-overlay');
    if (overlay) overlay.classList.add('open');
  }

  function closeAuthDrawer() {
    const overlay = document.getElementById('auth-drawer-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    updateModalView();
  }

  function updateModalView() {
    const title = document.getElementById('auth-title');
    const toggleLink = document.getElementById('auth-toggle-link');
    const nameG = document.getElementById('name-group');
    const phoneG = document.getElementById('phone-group');
    const sBtn = document.getElementById('auth-submit-btn');

    if (isSignUpMode) {
      if (title) title.textContent = 'Sign up';
      if (toggleLink) toggleLink.innerHTML = 'or <span style="text-decoration:underline;">login to your account</span>';
      if (nameG) nameG.style.display = 'flex';
      if (phoneG) phoneG.style.display = 'flex';
      if (sBtn) sBtn.textContent = 'CONTINUE';
    } else {
      if (title) title.textContent = 'Login';
      if (toggleLink) toggleLink.innerHTML = 'or <span style="text-decoration:underline;">create an account</span>';
      if (nameG) nameG.style.display = 'none';
      if (phoneG) phoneG.style.display = 'none';
      if (sBtn) sBtn.textContent = 'LOGIN';
    }
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      showToast('Please enter all required fields', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Please wait...';

    if (isSignUpMode) {
      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();
      if (!name || !phone) {
        showToast('Please fill out your name and phone number', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'CONTINUE';
        return;
      }

      const res = await API.register({ name, email, phone, password });
      if (res && res.success) {
        currentUser = res.user;
        updateUserUI();
        closeAuthDrawer();
        showToast(`Welcome to Triggy, ${currentUser.name}! 🎉`, 'success');
      } else {
        showToast(res.message || 'Registration failed', 'error');
      }
    } else {
      const res = await API.login(email, password);
      if (res && res.success) {
        currentUser = res.user;
        updateUserUI();
        closeAuthDrawer();
        showToast(`Welcome back, ${currentUser.name}! 🍔`, 'success');
      } else {
        showToast(res.message || 'Invalid credentials', 'error');
      }
    }

    submitBtn.disabled = false;
    submitBtn.textContent = isSignUpMode ? 'CONTINUE' : 'LOGIN';
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
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('profile-dropdown');
    if (currentUser) {
      if (dropdown) dropdown.classList.toggle('open');
    } else {
      openAuthDrawer();
    }
  }

  async function quickDemoLogin() {
    if (emailInput) emailInput.value = 'rahul@example.com';
    if (passwordInput) passwordInput.value = '123456';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';
    }
    try {
      const res = await API.login('rahul@example.com', '123456');
      if (res && res.success) {
        currentUser = res.user;
        updateUserUI();
        closeAuthDrawer();
        showToast(`Welcome, ${currentUser.name}! 🎉`, 'success');
      } else {
        showToast(res ? res.message : 'Login failed', 'error');
      }
    } catch (err) {
      showToast('Login failed. Please try again.', 'error');
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
    handleUserNavClick,
    quickDemoLogin,
    getUser: () => currentUser
  };
})();

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
