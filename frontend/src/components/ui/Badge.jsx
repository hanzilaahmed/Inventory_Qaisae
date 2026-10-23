'use client';

import React from 'react';
import { Package, Box, Layers, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function Badge({ type, text, icon = true }) {
  let className = 'badge';
  let IconComponent = null;
  let label = text;

  switch (type) {
    case 'PIECE_ONLY':
    case 'PIECE':
      className += ' badge-piece';
      IconComponent = Package;
      label = label || 'Piece Only';
      break;
    case 'BOX_ONLY':
    case 'BOX':
      className += ' badge-box';
      IconComponent = Box;
      label = label || 'Box Only';
      break;
    case 'BOTH':
      className += ' badge-both';
      IconComponent = Layers;
      label = label || 'Piece & Box';
      break;
    case 'LOW_STOCK':
      className += ' badge-danger';
      IconComponent = AlertTriangle;
      label = label || 'Low Stock';
      break;
    case 'COMPLETED':
      className += ' badge-success';
      IconComponent = CheckCircle2;
      label = label || 'Completed';
      break;
    case 'CANCELLED':
      className += ' badge-danger';
      IconComponent = AlertTriangle;
      label = label || 'Cancelled';
      break;
    default:
      className += ' badge-piece';
      label = label || type;
  }

  return (
    <span className={className}>
      {icon && IconComponent && <IconComponent size={12} />}
      {label}
    </span>
  );
}
