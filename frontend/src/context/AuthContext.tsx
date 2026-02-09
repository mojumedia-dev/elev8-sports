import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';

type Role = 'PARENT' | 'COACH' | 'ORG_ADMIN';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isAdmin?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; role: string }) => Promise<void>;
  logout: () => void;
  activeRole: Role | null;
  setActiveRole: (role: Role) => void;
  isAdminMode: boolean;
}

const AuthContext = createContext<AuthState>({} as AuthState);
export const useAuth = () => useContext(AuthContext);

// Admin emails that can toggle between all roles
const ADMIN_EMAILS = ['adamlloyd@msn.com', 'adam@mojumedia.com', 'josh@augmentadvertise.com', 'donald@augmentadvertise.com'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRoleState] = useState<Role | null>(null);

  const isAdminMode = !!user && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const setActiveRole = (role: Role) => {
    setActiveRoleState(role);
    localStorage.setItem('elev8_activeRole', role);
  };

  useEffect(() => {
    if (token) {
      api<User>('/users/me', { token })
        .then((u) => {
          setUser({ ...u, isAdmin: ADMIN_EMAILS.includes(u.email.toLowerCase()) });
          const savedRole = localStorage.getItem('elev8_activeRole') as Role | null;
          if (ADMIN_EMAILS.includes(u.email.toLowerCase()) && savedRole) {
            setActiveRoleState(savedRole);
          } else {
            setActiveRoleState(u.role);
          }
        })
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
    const admin = ADMIN_EMAILS.includes(res.user.email.toLowerCase());
    setUser({ ...res.user, isAdmin: admin });
    setActiveRoleState(res.user.role);
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; role: string }) => {
    const res = await api<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST', body: data,
    });
    localStorage.setItem('token', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    setToken(res.accessToken);
    const admin = ADMIN_EMAILS.includes(res.user.email.toLowerCase());
    setUser({ ...res.user, isAdmin: admin });
    setActiveRoleState(res.user.role);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('elev8_activeRole');
    setToken(null);
    setUser(null);
    setActiveRoleState(null);
  };

  // Override user.role with activeRole for the rest of the app
  const effectiveUser = user && activeRole ? { ...user, role: activeRole } : user;

  return (
    <AuthContext.Provider value={{ user: effectiveUser, token, loading, login, register, logout, activeRole: activeRole || user?.role || null, setActiveRole, isAdminMode }}>
      {children}
    </AuthContext.Provider>
  );
}
