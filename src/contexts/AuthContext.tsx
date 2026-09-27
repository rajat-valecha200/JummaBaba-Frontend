import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: 'buyer' | 'vendor' | 'admin' | 'employee';
  full_name?: string;
  business_name?: string;
  phone?: string;
  status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  logo_url?: string;
  gst_number?: string;
  pan_number?: string;
  business_type?: string;
  document_paths?: {
    logo?: string;
    pan_card?: string;
    gst_certificate?: string;
    cancelled_cheque?: string;
  };
  business_details?: any;
}

interface Profile {
  id: string;
  full_name: string | null;
  role: 'buyer' | 'vendor' | 'admin' | 'employee' | null;
  business_name?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (credentials: any) => Promise<any>;
  register: (details: any) => Promise<any>;
  signOut: () => void;
  // Patches the cached user/profile in place (e.g. after saving a phone number from a checkout
  // form) without a full re-login or refetch.
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('jb_token');
      if (token) {
        try {
          const userData = await api.auth.getMe();
          setUser(userData);
          setProfile(userData); // In our new system, getMe returns the profile info too
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('jb_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Presence Heartbeat: Update last_seen every 30 seconds when logged in
  useEffect(() => {
    if (!user) return;

    const heartbeat = setInterval(() => {
      api.auth.getMe().catch(() => {}); // This updates last_seen on backend
    }, 30000);

    return () => clearInterval(heartbeat);
  }, [user]);

  const login = async (credentials: any) => {
    const data = await api.auth.login(credentials);
    const { user: userData } = data;
    setUser(userData);
    setProfile(userData);
    return data;
  };

  const register = async (details: any) => {
    const data = await api.auth.register(details);
    const { user: userData } = data;
    setUser(userData);
    setProfile(userData);
    return data;
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const signOut = () => {
    api.auth.logout();
    setUser(null);
    setProfile(null);
    // Use replace to ensure the user cannot go back to protected pages
    window.location.replace('/');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
