'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  History,
  LogOut,
  Boxes,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      label: 'Create Order (POS)',
      href: '/pos',
      icon: ShoppingCart,
      highlight: true,
    },
    {
      label: 'Products Catalog',
      href: '/products',
      icon: Package,
    },
    {
      label: 'Sales History',
      href: '/orders',
      icon: Receipt,
    },
    {
      label: 'Stock Movements',
      href: '/history',
      icon: History,
    },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-icon-box">
          <Boxes size={22} />
        </div>
        <div className="brand-text">
          <h1>StockPro</h1>
          <p>Inventory & Point of Sale</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Store Management</div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={item.highlight && !isActive ? { borderLeft: '3px solid #6366f1' } : {}}
            >
              <div className="nav-item-inner">
                <Icon size={18} color={isActive ? '#818cf8' : item.highlight ? '#a5b4fc' : '#94a3b8'} />
                <span>{item.label}</span>
              </div>
              {item.highlight && (
                <span className="nav-badge" style={{ backgroundColor: '#4f46e5' }}>
                  POS
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Admin Profile & Logout */}
      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-avatar">
            <ShieldCheck size={18} />
          </div>
          <div className="user-info">
            <div className="user-name">{admin?.name || 'Administrator'}</div>
            <div className="user-role">{admin?.email || 'admin@inventory.com'}</div>
          </div>
          <button
            onClick={logout}
            className="btn btn-ghost btn-sm"
            title="Log Out"
            style={{ color: '#ef4444', padding: '0.4rem', borderRadius: '6px' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
