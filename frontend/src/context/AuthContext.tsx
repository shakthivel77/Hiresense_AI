import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'student' | 'professional' | 'admin';
  institution?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, role: 'student' | 'professional') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('hiresense_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('hiresense_token');
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user && token) {
      localStorage.setItem('hiresense_user', JSON.stringify(user));
      localStorage.setItem('hiresense_token', token);
    } else {
      localStorage.removeItem('hiresense_user');
      localStorage.removeItem('hiresense_token');
    }
  }, [user, token]);

  const login = async (email: string) => {
    setLoading(true);
    try {
      // Mock / Supabase client auth handler
      const mockUser: UserProfile = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        email,
        displayName: email.split('@')[0],
        role: 'student',
      };
      const mockToken = 'mock-dev-token';
      setUser(mockUser);
      setToken(mockToken);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, _pass: string, name: string, role: 'student' | 'professional') => {
    setLoading(true);
    try {
      const mockUser: UserProfile = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        email,
        displayName: name || email.split('@')[0],
        role,
      };
      const mockToken = 'mock-dev-token';
      setUser(mockUser);
      setToken(mockToken);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
