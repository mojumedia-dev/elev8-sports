import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PARENT' | 'COACH' | 'ORG_ADMIN';
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; role: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({} as AuthState);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api<User>('/users/me', { token })
        .then(setUser)
        .catch(() => { localStorage.removeItem('token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST', body: { email, password },
    });
    localStorage.setItem('token', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    setToken(res.accessToken);
    setUser(res.user);
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; role: string }) => {
    const res = await api<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST', body: data,
    });
    localStorage.setItem('token', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    setToken(res.accessToken);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
