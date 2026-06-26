// ============================================
// TOEFL Platform — API Client
// ============================================
const api = (() => {
  /* ---- helpers ---- */
  function getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  }

  function headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const token = getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }

  function handleUnauthorized() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
      window.location.href = '/index.html';
    }
  }

  async function request(method, endpoint, body, isFormData = false) {
    const url = `${CONFIG.API_URL}${endpoint}`;
    const opts = { method };

    if (isFormData) {
      // For FormData, don't set Content-Type (browser sets multipart boundary)
      const token = getToken();
      opts.headers = {};
      if (token) opts.headers['Authorization'] = `Bearer ${token}`;
      opts.body = body;
    } else {
      opts.headers = headers();
      if (body) opts.body = JSON.stringify(body);
    }

    try {
      const res = await fetch(url, opts);

      if (res.status === 401) {
        handleUnauthorized();
        throw new Error('Unauthorized — please log in again.');
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.message || data.error || `Request failed (${res.status})`;
        const err = new Error(msg);
        err.data = data; // Attach full response data for error details
        throw err;
      }
      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Network error — please check your connection.');
      }
      throw err;
    }
  }

  /* ---- public API ---- */
  return {
    get:    (endpoint)        => request('GET', endpoint),
    post:   (endpoint, data)  => request('POST', endpoint, data),
    put:    (endpoint, data)  => request('PUT', endpoint, data),
    delete: (endpoint)        => request('DELETE', endpoint),
    upload: (endpoint, formData) => request('POST', endpoint, formData, true),
  };
})();
