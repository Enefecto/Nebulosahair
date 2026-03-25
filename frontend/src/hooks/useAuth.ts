import { useState, useEffect } from 'react';
import { getAuth, onAuthChange, setAuth, clearAuth } from '../lib/auth';
import { authApi } from '../lib/api';

export function useAuth() {
  const [auth, setAuthState] = useState(getAuth());

  useEffect(() => {
    return onAuthChange(setAuthState);
  }, []);

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password) as any;
    setAuth(res.access_token, res.user);
    return res;
  }

  async function logout() {
    if (auth.token) {
      try {
        await authApi.logout(auth.token);
      } catch {}
    }
    clearAuth();
  }

  return {
    token: auth.token,
    user: auth.user,
    isAuthenticated: !!auth.token,
    login,
    logout,
  };
}
