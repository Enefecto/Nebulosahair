// Auth state — sessionStorage para persistir entre navegaciones del mismo tab.
// Se borra al cerrar el browser. No usar localStorage por seguridad.

const TOKEN_KEY = 'nh_token';
const USER_KEY = 'nh_user';

export interface AuthState {
  token: string | null;
  user: { id: string; email: string } | null;
}

function readFromSession(): AuthState {
  if (typeof window === 'undefined') return { token: null, user: null };
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const userStr = sessionStorage.getItem(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

let _state: AuthState = readFromSession();
const _listeners: Array<(state: AuthState) => void> = [];

export function getAuth(): AuthState {
  return _state;
}

export function setAuth(token: string, user: { id: string; email: string }) {
  _state = { token, user };
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  _listeners.forEach(fn => fn(_state));
}

export function clearAuth() {
  _state = { token: null, user: null };
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
  _listeners.forEach(fn => fn(_state));
}

export function onAuthChange(fn: (state: AuthState) => void) {
  _listeners.push(fn);
  return () => {
    const idx = _listeners.indexOf(fn);
    if (idx !== -1) _listeners.splice(idx, 1);
  };
}

export function isAuthenticated(): boolean {
  return !!_state.token;
}
