'use client';

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Package, Plus, Minus, AlertCircle } from 'lucide-react';

export default function StockAdjustModal({ isOpen, onClose, product, onAdjust }) {
  const [direction, setDirection] = useState('ADD'); // 'ADD' or 'REMOVE'
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('PIECE'); // 'PIECE' or 'BOX'
  const [reason, setReason] = useState('New shipment restock');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!product) return null;

  const piecesPerBox = product.piecesPerBox > 0 ? product.piecesPerBox : 1;
  const piecesDelta = (parseInt(quantity, 10) || 0) * (unit === 'BOX' ? piecesPerBox : 1);
  const finalDelta = direction === 'ADD' ? piecesDelta : -piecesDelta;
  const projectedStock = product.stockPieces + finalDelta;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (projectedStock < 0) {
      setError(`Cannot reduce stock below 0. Current stock is ${product.stockPieces} pcs.`);
      return;
    }

    setLoading(true);
    try {
      await onAdjust(product.id, {
        quantity: finalDelta,
        unit: 'PIECE',
        type: direction === 'ADD' ? 'RESTOCK' : 'ADJUSTMENT',
        notes: `${direction === 'ADD' ? 'Added' : 'Removed'} ${quantity} ${unit}(s) (${Math.abs(piecesDelta)} pcs). Reason: ${reason}`,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Adjust Inventory - ${product.name}`}
      maxWidth="500px"
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Current Stock Snapshot */}
          <div style={{
            backgroundColor: '#f1f5f9',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CURRENT BALANCE</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                {product.stockPieces} Pieces
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>BREAKDOWN</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4f46e5' }}>
                {Math.floor(product.stockPieces / piecesPerBox)} Boxes, {product.stockPieces % piecesPerBox} Loose
              </div>
            </div>
          </div>

          {/* Direction toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setDirection('ADD')}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: direction === 'ADD' ? '2px solid #10b981' : '1px solid #cbd5e1',
                backgroundColor: direction === 'ADD' ? '#ecfdf5' : '#ffffff',
                color: direction === 'ADD' ? '#065f46' : '#64748b',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <Plus size={16} /> Restock (Add)
            </button>
            <button
              type="button"
              onClick={() => setDirection('REMOVE')}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: direction === 'REMOVE' ? '2px solid #ef4444' : '1px solid #cbd5e1',
                backgroundColor: direction === 'REMOVE' ? '#fef2f2' : '#ffffff',
                color: direction === 'REMOVE' ? '#991b1b' : '#64748b',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <Minus size={16} /> Reduce (Damage/Audit)
            </button>
          </div>

          {/* Quantity & Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Quantity</label>
              <input
                type="number"
                min="1"
                required
                className="form-input"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Unit</label>
              <select
                className="form-select"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="PIECE">Pieces</option>
                {product.sellingUnitType !== 'PIECE_ONLY' && (
                  <option value="BOX">Boxes ({piecesPerBox} pcs/box)</option>
                )}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Reference Notes</label>
            <input
              type="text"
              className="form-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Received shipment from supplier or Damaged package"
            />
          </div>

          {/* Projected Result */}
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: projectedStock < 0 ? '#fef2f2' : '#f0fdf4',
            border: projectedStock < 0 ? '1px solid #fecaca' : '1px solid #bbf7d0',
            fontSize: '0.85rem',
            color: projectedStock < 0 ? '#991b1b' : '#166534',
            fontWeight: 600,
          }}>
            New balance will be: <strong>{projectedStock} Pieces</strong> ({Math.floor(projectedStock / piecesPerBox)} boxes, {projectedStock % piecesPerBox} pcs)
          </div>
        </div>

        <div className="modal-footer">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={direction === 'ADD' ? 'success' : 'danger'}
            type="submit"
            loading={loading}
          >
            Confirm Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
