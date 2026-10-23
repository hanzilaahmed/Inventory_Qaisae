'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ApiClient from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const token = ApiClient.getToken();
      if (!token) {
        setLoading(false);
        if (pathname !== '/login') {
          router.push('/login');
        }
        return;
      }

      try {
        const profile = await ApiClient.getMe();
        setAdmin(profile);
      } catch (err) {
        console.error('Failed to load profile', err);
        localStorage.removeItem('inventory_token');
        setAdmin(null);
        if (pathname !== '/login') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [pathname, router]);

  const login = async (email, password) => {
    try {
      const data = await ApiClient.login(email, password);
      localStorage.setItem('inventory_token', data.token);
      setAdmin(data.admin);
      toast.success(`Welcome back, ${data.admin.name || 'Admin'}!`);
      router.push('/');
      return true;
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('inventory_token');
    setAdmin(null);
    toast.info('You have logged out.');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
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
