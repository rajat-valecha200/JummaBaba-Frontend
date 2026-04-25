import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: 'buyer' | 'vendor' | 'admin';
  full_name?: string;
  business_name?: string;
  phone?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

interface Profile {
  id: string;
  full_name: string | null;
  role: 'buyer' | 'vendor' | 'admin' | null;
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

  const signOut = () => {
    api.auth.logout();
    setUser(null);
    setProfile(null);
    // Use replace to ensure the user cannot go back to protected pages
    window.location.replace('/');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, signOut }}>
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
