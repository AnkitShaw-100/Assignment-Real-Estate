import axios from 'axios';

/**
 * One axios instance for the whole app.
 *  - In dev, /api is proxied to the local Express server (vite.config.js).
 *  - In production, VITE_API_URL points at the deployed API.
 *  - The Clerk session token is attached to every request when signed in.
 *  - Errors are normalised to { message, details, status } from the API's error shape.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` : '/api',
  timeout: 20_000,
});

let getToken = async () => null;
/** Called by the auth provider so requests can carry the session token. */
export function setTokenGetter(fn) {
  getToken = fn;
}

// Development only: act as a seeded user without Clerk (backend must run with DEV_AUTH=true)
export const DEV_USER = import.meta.env.DEV ? import.meta.env.VITE_DEV_USER : undefined;

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else if (DEV_USER) config.headers['x-dev-user'] = DEV_USER;
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
    return Promise.reject(new ApiError(data?.error?.message ?? 'Something went wrong. Try again.', status, data?.error?.details));
  },
);

/** Unwraps { data } so query functions return the payload directly. */
export const unwrap = (res) => res.data;
