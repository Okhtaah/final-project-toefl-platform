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
    window.location.href = '/frontend/index.html';
  }

  /* ---- guards ---- */
  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = '/frontend/index.html';
      return false;
    }
    return true;
  }

  function requireRole(role) {
    if (!requireAuth()) return false;
    if (getRole() !== role) {
      // redirect to correct dashboard
      const r = getRole();
      if (r === 'admin')   window.location.href = '/frontend/admin/dashboard.html';
      if (r === 'student') window.location.href = '/frontend/student/dashboard.html';
      return false;
    }
    return true;
  }

  function redirectIfLoggedIn() {
    if (isLoggedIn()) {
      const r = getRole();
      if (r === 'admin')   window.location.href = '/frontend/admin/dashboard.html';
      else                 window.location.href = '/frontend/student/dashboard.html';
    }
  }

  /* ---- form handlers ---- */
  async function handleLogin(email, password) {
    const data = await api.post('/auth/login', { email, password });
    saveSession(data.token, data.user || data.data?.user || data);
    const role = (data.user || data.data?.user || data).role;
    if (role === 'admin') window.location.href = '/frontend/admin/dashboard.html';
    else                  window.location.href = '/frontend/student/dashboard.html';
  }

  async function handleRegister(name, email, password) {
    const data = await api.post('/auth/register', { name, email, password });
    saveSession(data.token, data.user || data.data?.user || data);
    window.location.href = '/frontend/student/dashboard.html';
  }

  return { getUser, getToken, isLoggedIn, getRole, saveSession, logout, requireAuth, requireRole, redirectIfLoggedIn, handleLogin, handleRegister };
})();
