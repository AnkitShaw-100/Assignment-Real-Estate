import axios from 'axios';

/**
 * One axios instance for the whole app.
 *  - In dev, /api is proxied to the local Express server (vite.config.js).
 *  - In production, VITE_API_URL points at the deployed API.
 *  - The session token is attached to every request when signed in.
 *  - Errors are normalised to { message, details, status } from the API's error shape.
 */
// In production VITE_API_URL is the deployed API (set in the Vercel project);
// the browser calls it directly and the API allows this site via CORS.
// Locally it's left empty and Vite proxies /api to localhost:5000.
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  timeout: 20_000,
});

// The API runs on its own domain in production, where third-party cookies are
// often blocked, so the session token travels as a Bearer header instead.
const TOKEN_KEY = 'niwas.session';
export const SIGNED_OUT_EVENT = 'niwas:signed-out';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable (private mode): the session lasts until reload
  }
}

export const isTokenKey = (key) => key === TOKEN_KEY;

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) {
      return Promise.reject(new ApiError("We couldn't reach the server. Check your connection and try again.", 0));
    }
    const { status, data } = err.response;
    // Expired or revoked session: forget the token so the app falls back to signed out
    if (status === 401 && err.config?.headers?.Authorization) {
      setToken(null);
      window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
    }
    return Promise.reject(new ApiError(data?.error?.message ?? 'Something went wrong. Try again.', status, data?.error?.details));
  },
);

/** Unwraps { data } so query functions return the payload directly. */
export const unwrap = (res) => res.data;
