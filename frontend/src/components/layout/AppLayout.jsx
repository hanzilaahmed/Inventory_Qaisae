'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const { admin, loading } = useAuth();

  // If on login page, don't show admin sidebar/header
  if (pathname === '/login') {
    return <main>{children}</main>;
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1rem',
        backgroundColor: 'var(--bg-main)',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-default)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
          Loading Inventory System...
        </p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}
