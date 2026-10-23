'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Plus, Calendar } from 'lucide-react';
import Button from '../ui/Button';

export default function Header({ title, subtitle, onAddProduct }) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="top-header">
      <div className="header-title">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="header-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <Calendar size={14} />
          <span>{currentDate}</span>
        </div>

        {onAddProduct && (
          <Button
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={onAddProduct}
          >
            Add Product
          </Button>
        )}

        <Link href="/pos">
          <Button
            variant="primary"
            size="sm"
            icon={ShoppingCart}
          >
            Create Order
          </Button>
        </Link>
      </div>
    </header>
  );
}
