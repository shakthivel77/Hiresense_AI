import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  register: (email: string, pass: string, name: string, role: 'student' | 'professional') => Promise<{ sessionCreated: boolean }>;
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
  const [loading, setLoading] = useState<boolean>(true);

  // Sync state changes to localStorage
  useEffect(() => {
    if (user && token) {
      localStorage.setItem('hiresense_user', JSON.stringify(user));
      localStorage.setItem('hiresense_token', token);
    } else {
      localStorage.removeItem('hiresense_user');
      localStorage.removeItem('hiresense_token');
    }
  }, [user, token]);

  // Session restoration and auth listener
  useEffect(() => {
    let mounted = true;

    if (isSupabaseConfigured() && supabase) {
      // 1. Initial session restoration from Supabase
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!mounted) return;
        if (error) {
          console.warn('[Auth] Failed to restore Supabase session:', error.message);
          setLoading(false);
          return;
        }

        if (session?.user) {
          const metadata = session.user.user_metadata || {};
          const restoredUser: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            displayName: metadata.displayName || metadata.display_name || session.user.email?.split('@')[0] || 'User',
            role: metadata.role || 'student',
            institution: metadata.institution,
          };
          setUser(restoredUser);
          setToken(session.access_token);
        } else {
          setUser(null);
          setToken(null);
        }
        setLoading(false);
      });

      // 2. Real-time auth event subscription
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;

        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
          const metadata = session.user.user_metadata || {};
          const currentUser: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            displayName: metadata.displayName || metadata.display_name || session.user.email?.split('@')[0] || 'User',
            role: metadata.role || 'student',
            institution: metadata.institution,
          };
          setUser(currentUser);
          setToken(session.access_token);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setToken(null);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } else {
      // Supabase is not configured - preserve fallback mock session from localStorage
      const savedUser = localStorage.getItem('hiresense_user');
      const savedToken = localStorage.getItem('hiresense_token');
      if (savedUser && savedToken) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        } catch {
          localStorage.removeItem('hiresense_user');
          localStorage.removeItem('hiresense_token');
        }
      }
      setLoading(false);
      return () => {
        mounted = false;
      };
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.session && data.user) {
          const metadata = data.user.user_metadata || {};
          const userProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            displayName: metadata.displayName || metadata.display_name || email.split('@')[0],
            role: metadata.role || 'student',
            institution: metadata.institution,
          };
          setUser(userProfile);
          setToken(data.session.access_token);
        }
      } else {
        // Fallback in-memory mock dev auth
        const mockUser: UserProfile = {
          id: 'usr-' + Math.random().toString(36).substring(2, 9),
          email,
          displayName: email.split('@')[0],
          role: 'student',
        };
        const mockToken = 'mock-dev-token';
        setUser(mockUser);
        setToken(mockToken);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    pass: string,
    name: string,
    role: 'student' | 'professional'
  ): Promise<{ sessionCreated: boolean }> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: {
              displayName: name,
              role: role,
            },
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.session && data.user) {
          const userProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            displayName: name || email.split('@')[0],
            role: role,
          };
          setUser(userProfile);
          setToken(data.session.access_token);
          return { sessionCreated: true };
        } else {
          return { sessionCreated: false };
        }
      } else {
        // Fallback in-memory mock dev auth
        const mockUser: UserProfile = {
          id: 'usr-' + Math.random().toString(36).substring(2, 9),
          email,
          displayName: name || email.split('@')[0],
          role,
        };
        const mockToken = 'mock-dev-token';
        setUser(mockUser);
        setToken(mockToken);
        return { sessionCreated: true };
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.signOut().catch((err) => {
        console.warn('[Auth] SignOut error:', err);
      });
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('hiresense_user');
    localStorage.removeItem('hiresense_token');
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
