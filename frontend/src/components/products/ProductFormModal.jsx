'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Package, Box, Layers, HelpCircle, AlertCircle } from 'lucide-react';

export default function ProductFormModal({ isOpen, onClose, onSave, editingProduct = null }) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    sellingUnitType: 'BOTH', // 'PIECE_ONLY', 'BOX_ONLY', 'BOTH'
    piecesPerBox: 12,
    pricePerPiece: '',
    pricePerBox: '',
    costPrice: '',
    initialStock: 0,
    stockUnitInput: 'BOX', // 'BOX' or 'PIECE'
    minStockAlert: 10,
    minStockAlertUnit: 'PIECE', // 'BOX' or 'PIECE'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingProduct) {
      const isBoxOnly = editingProduct.sellingUnitType === 'BOX_ONLY';
      const ppb = editingProduct.piecesPerBox || 1;
      const alertUnit = isBoxOnly ? 'BOX' : 'PIECE';
      const alertQty = isBoxOnly
        ? Math.max(1, Math.round((editingProduct.minStockAlert || 10) / ppb))
        : (editingProduct.minStockAlert || 10);

      setFormData({
        name: editingProduct.name || '',
        sku: editingProduct.sku || '',
        category: editingProduct.category || '',
        description: editingProduct.description || '',
        sellingUnitType: editingProduct.sellingUnitType || 'BOTH',
        piecesPerBox: editingProduct.piecesPerBox || 1,
        pricePerPiece: editingProduct.pricePerPiece ?? '',
        pricePerBox: editingProduct.pricePerBox ?? '',
        costPrice: editingProduct.costPrice ?? '',
        initialStock: editingProduct.stockPieces || 0,
        stockUnitInput: 'PIECE',
        minStockAlert: alertQty,
        minStockAlertUnit: alertUnit,
      });
    } else {
      setFormData({
        name: '',
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        category: 'General',
        description: '',
        sellingUnitType: 'BOTH',
        piecesPerBox: 12,
        pricePerPiece: '',
        pricePerBox: '',
        costPrice: '',
        initialStock: 0,
        stockUnitInput: 'BOX',
        minStockAlert: 5,
        minStockAlertUnit: 'BOX',
      });
    }
    setError('');
  }, [editingProduct, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Helper auto-calculation
      if (field === 'pricePerBox' && value && (!prev.pricePerPiece || prev.pricePerPiece === '0')) {
        const ppb = parseInt(updated.piecesPerBox, 10) || 1;
        if (ppb > 0) {
          updated.pricePerPiece = (parseFloat(value) / ppb).toFixed(2);
        }
      }

      return updated;
    });
  };

  const calculateTotalBasePieces = () => {
    const qty = parseInt(formData.initialStock, 10) || 0;
    const ppb = parseInt(formData.piecesPerBox, 10) || 1;
    if (formData.stockUnitInput === 'BOX') {
      return qty * ppb;
    }
    return qty;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.sku.trim()) {
      setError('Product name and SKU are required');
      return;
    }

    if (formData.sellingUnitType === 'BOX_ONLY' && (!formData.pricePerBox || parseFloat(formData.pricePerBox) <= 0)) {
      setError('Please provide a valid price per box');
      return;
    }

    if (formData.sellingUnitType === 'PIECE_ONLY' && (!formData.pricePerPiece || parseFloat(formData.pricePerPiece) <= 0)) {
      setError('Please provide a valid price per piece');
      return;
    }

    if (formData.sellingUnitType === 'BOTH') {
      if (!formData.pricePerPiece || parseFloat(formData.pricePerPiece) <= 0) {
        setError('Please provide price per piece for Both selling mode');
        return;
      }
      if (!formData.pricePerBox || parseFloat(formData.pricePerBox) <= 0) {
        setError('Please provide price per box for Both selling mode');
        return;
      }
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = Boolean(editingProduct);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Product Details' : 'Add New Product to Inventory'}
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body" style={{ maxHeight: '70vh' }}>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Energy Drink 250ml or Ballpoint Pens"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SKU / Barcode Code *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. PRD-9021"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Beverages, Stationery, Electronics"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cost Price ($ Purchase Cost)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="0.00"
                value={formData.costPrice}
                onChange={(e) => handleChange('costPrice', e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: SELLING UNIT CONFIGURATION (USER'S CORE FEATURE) */}
          <div style={{
            margin: '1.5rem 0',
            padding: '1.25rem',
            backgroundColor: '#f8fafc',
            border: '2px solid #e2e8f0',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <Layers size={18} color="#4f46e5" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                  Selling Unit Mode *
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Choose how you want to sell this product to customers at the counter:
              </p>
            </div>

            {/* 3 Unit Mode Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {/* Option 1: Both */}
              <div
                onClick={() => handleChange('sellingUnitType', 'BOTH')}
                style={{
                  padding: '1rem',
                  border: formData.sellingUnitType === 'BOTH' ? '2px solid #6366f1' : '1px solid #cbd5e1',
                  backgroundColor: formData.sellingUnitType === 'BOTH' ? '#eef2ff' : '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ marginBottom: '0.4rem', color: formData.sellingUnitType === 'BOTH' ? '#4f46e5' : '#64748b' }}>
                  <Layers size={22} style={{ margin: '0 auto' }} />
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Piece & Box</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>Sell either single pieces or whole boxes</div>
              </div>

              {/* Option 2: Piece Only */}
              <div
                onClick={() => handleChange('sellingUnitType', 'PIECE_ONLY')}
                style={{
                  padding: '1rem',
                  border: formData.sellingUnitType === 'PIECE_ONLY' ? '2px solid #10b981' : '1px solid #cbd5e1',
                  backgroundColor: formData.sellingUnitType === 'PIECE_ONLY' ? '#ecfdf5' : '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ marginBottom: '0.4rem', color: formData.sellingUnitType === 'PIECE_ONLY' ? '#059669' : '#64748b' }}>
                  <Package size={22} style={{ margin: '0 auto' }} />
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Piece Only</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>Sell only individual loose pieces</div>
              </div>

              {/* Option 3: Box Only */}
              <div
                onClick={() => handleChange('sellingUnitType', 'BOX_ONLY')}
                style={{
                  padding: '1rem',
                  border: formData.sellingUnitType === 'BOX_ONLY' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: formData.sellingUnitType === 'BOX_ONLY' ? '#eff6ff' : '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ marginBottom: '0.4rem', color: formData.sellingUnitType === 'BOX_ONLY' ? '#2563eb' : '#64748b' }}>
                  <Box size={22} style={{ margin: '0 auto' }} />
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Box Only</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>Sell only full sealed cartons / boxes</div>
              </div>
            </div>

            {/* Sub-inputs based on Selected Mode */}
            <div style={{ display: 'grid', gridTemplateColumns: formData.sellingUnitType === 'BOTH' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '1rem' }}>
              {(formData.sellingUnitType === 'BOTH' || formData.sellingUnitType === 'BOX_ONLY') && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Pieces in 1 Box *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-input"
                    placeholder="e.g. 12 or 24"
                    value={formData.piecesPerBox}
                    onChange={(e) => handleChange('piecesPerBox', e.target.value)}
                  />
                  <span className="form-hint">e.g. 1 Box = {formData.piecesPerBox || 1} Pcs</span>
                </div>
              )}

              {(formData.sellingUnitType === 'BOTH' || formData.sellingUnitType === 'PIECE_ONLY') && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Selling Price ($ per Piece) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="form-input"
                    placeholder="0.00"
                    value={formData.pricePerPiece}
                    onChange={(e) => handleChange('pricePerPiece', e.target.value)}
                  />
                  <span className="form-hint">Price charged per single unit</span>
                </div>
              )}

              {(formData.sellingUnitType === 'BOTH' || formData.sellingUnitType === 'BOX_ONLY') && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Selling Price ($ per Box) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="form-input"
                    placeholder="0.00"
                    value={formData.pricePerBox}
                    onChange={(e) => handleChange('pricePerBox', e.target.value)}
                  />
                  <span className="form-hint">Price charged for 1 full box</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Inventory Setup */}
          {!isEditing && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Starting Stock Quantity (Optional)
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Leave 0 if you don&apos;t have physical stock in store yet
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">How many boxes/pieces do you have in stock?</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="form-input"
                    value={formData.initialStock}
                    onChange={(e) => handleChange('initialStock', e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Counted in:</label>
                  <select
                    className="form-select"
                    value={formData.stockUnitInput}
                    onChange={(e) => handleChange('stockUnitInput', e.target.value)}
                  >
                    {(formData.sellingUnitType === 'BOTH' || formData.sellingUnitType === 'BOX_ONLY') && (
                      <option value="BOX">Boxes ({formData.piecesPerBox || 1} pcs/box)</option>
                    )}
                    <option value="PIECE">Individual Loose Pieces</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#4338ca', fontWeight: 600 }}>
                {calculateTotalBasePieces() > 0 ? (
                  <>
                    📦 Will add: <strong>{formData.initialStock} {formData.stockUnitInput === 'BOX' ? 'Boxes' : 'Pieces'}</strong> ({calculateTotalBasePieces()} total individual pieces)
                  </>
                ) : (
                  <span style={{ color: '#64748b' }}>
                    ℹ️ Starting stock will be <strong>0 (Out of stock)</strong> until you receive a shipment.
                  </span>
                )}
              </div>
            </div>
          )}

          <div style={{
            padding: '1rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
          }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
              Low Stock Warning Alert
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Alert When Stock &le;</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="form-input"
                  value={formData.minStockAlert}
                  onChange={(e) => handleChange('minStockAlert', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Threshold Unit</label>
                <select
                  className="form-select"
                  value={formData.minStockAlertUnit}
                  onChange={(e) => handleChange('minStockAlertUnit', e.target.value)}
                >
                  {(formData.sellingUnitType === 'BOTH' || formData.sellingUnitType === 'BOX_ONLY') && (
                    <option value="BOX">Boxes ({formData.piecesPerBox || 1} pcs/box)</option>
                  )}
                  <option value="PIECE">Individual Pieces</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: '0.65rem', fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>
              ⚠️ Low stock warning will trigger when stock drops to or below:{' '}
              <strong>
                {formData.minStockAlert} {formData.minStockAlertUnit === 'BOX' ? 'Boxes' : 'Pieces'}
                {formData.minStockAlertUnit === 'BOX' && ` (${(parseInt(formData.minStockAlert, 10) || 0) * (parseInt(formData.piecesPerBox, 10) || 1)} pieces)`}
              </strong>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              rows="2"
              className="form-textarea"
              placeholder="Add product specifications, notes, brand, location in store..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
