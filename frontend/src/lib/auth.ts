// Auth state management (in-memory, no localStorage)
// Token lives only for the current browser session.

interface AuthState {
  token: string | null;
  user: { id: string; email: string } | null;
}

let _state: AuthState = { token: null, user: null };
const _listeners: Array<(state: AuthState) => void> = [];

export function getAuth(): AuthState {
  return _state;
}

export function setAuth(token: string, user: { id: string; email: string }) {
  _state = { token, user };
  _listeners.forEach((fn) => fn(_state));
}

export function clearAuth() {
  _state = { token: null, user: null };
  _listeners.forEach((fn) => fn(_state));
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
