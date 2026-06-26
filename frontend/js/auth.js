// ============================================
// TOEFL Platform — Auth Utilities
// ============================================
const auth = (() => {
  /* ---- getters ---- */
  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.USER_KEY));
    } catch { return null; }
  }

  function getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function getRole() {
    const u = getUser();
    return u ? u.role : null;
  }

  /* ---- actions ---- */
  function saveSession(token, user) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
  }

  function logout() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    window.location.href = '/index.html';
  }

  /* ---- guards ---- */
  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = '/index.html';
      return false;
    }
    return true;
  }

  function requireRole(role) {
    if (!requireAuth()) return false;
    const r = getRole() || '';
    if (r.toUpperCase() !== role.toUpperCase()) {
      if (r === 'ADMIN')   window.location.href = '/admin/dashboard.html';
      if (r === 'STUDENT') window.location.href = '/student/dashboard.html';
      return false;
    }
    return true;
  }

  function redirectIfLoggedIn() {
    if (isLoggedIn()) {
      const r = getRole();
      if (r === 'ADMIN')   window.location.href = '/admin/dashboard.html';
      else                 window.location.href = '/student/dashboard.html';
    }
  }

  /* ---- form handlers ---- */
  async function handleLogin(email, password) {
    const data = await api.post('/auth/login', { email, password });
    const user = data.user || data;
    saveSession(data.token, user);
    if (user.role === 'ADMIN') window.location.href = '/admin/dashboard.html';
    else                       window.location.href = '/student/dashboard.html';
  }

  async function handleRegister(full_name, email, password) {
    const data = await api.post('/auth/register', { full_name, email, password });
    const user = data.user || data;
    saveSession(data.token, user);
    window.location.href = '/student/dashboard.html';
  }

  return { getUser, getToken, isLoggedIn, getRole, saveSession, logout, requireAuth, requireRole, redirectIfLoggedIn, handleLogin, handleRegister };
})();

// Global logout function for onclick handlers
function logout() { auth.logout(); }
