// ============================================
// TOEFL Platform — Configuration
// ============================================
const CONFIG = {
  API_URL:
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000/api'
      : 'https://final-project-toefl-platform-production.up.railway.app/api',
  APP_NAME: 'TOEFL Mastery',
  TOKEN_KEY: 'token',
  USER_KEY: 'user',
  POLL_INTERVAL: 10000, // 10 seconds for message polling
};
