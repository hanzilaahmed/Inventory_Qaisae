'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/layout/Header';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ReceiptModal from '../../components/orders/ReceiptModal';
import ApiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  Package,
  Box,
  Layers,
  User,
  CreditCard,
  Banknote,
  Receipt,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export default function PosPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Cart state: Array of { product, unitSold: 'PIECE' | 'BOX', quantity, unitPrice, lineTotal }
  const [cart, setCart] = useState([]);

  // Order meta state
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Receipt Modal state
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const toast = useToast();

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getProducts({ limit: 100 });
      setProducts(data.products || []);
      const cats = await ApiClient.getCategories();
      setCategories(cats || []);
    } catch (err) {
      toast.error('Failed to load products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = !selectedCategory || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  // Add item to cart with specified unit
  const addToCart = (product, unitSold) => {
    const unitPrice = unitSold === 'BOX' ? product.pricePerBox : product.pricePerPiece;
    const piecesMultiplier = unitSold === 'BOX' ? product.piecesPerBox : 1;

    setCart((prevCart) => {
      // Find if already in cart with same unit
      const existingIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.unitSold === unitSold
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + 1;
        const totalPiecesDeducted = newQty * piecesMultiplier;

        // Check stock availability
        if (totalPiecesDeducted > product.stockPieces) {
          toast.error(
            `Insufficient stock for ${product.name}! Only ${product.stockPieces} pieces available.`
          );
          return prevCart;
        }

        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          lineTotal: Number((newQty * unitPrice).toFixed(2)),
        };
        return updated;
      } else {
        // New cart entry
        if (piecesMultiplier > product.stockPieces) {
          toast.error(
            `Insufficient stock for ${product.name}! Requires ${piecesMultiplier} pcs, available ${product.stockPieces}.`
          );
          return prevCart;
        }

        return [
          ...prevCart,
          {
            product,
            unitSold,
            quantity: 1,
            unitPrice,
            lineTotal: Number(unitPrice.toFixed(2)),
          },
        ];
      }
    });
  };

  const updateCartQty = (index, delta) => {
    setCart((prevCart) => {
      const item = prevCart[index];
      const newQty = item.quantity + delta;

      if (newQty <= 0) {
        return prevCart.filter((_, i) => i !== index);
      }

      const piecesMultiplier = item.unitSold === 'BOX' ? item.product.piecesPerBox : 1;
      const totalPiecesDeducted = newQty * piecesMultiplier;

      if (totalPiecesDeducted > item.product.stockPieces) {
        toast.error(`Exceeds available stock (${item.product.stockPieces} pieces)`);
        return prevCart;
      }

      const updated = [...prevCart];
      updated[index] = {
        ...item,
        quantity: newQty,
        lineTotal: Number((newQty * item.unitPrice).toFixed(2)),
      };
      return updated;
    });
  };

  const removeFromCart = (index) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.lineTotal, 0);
  }, [cart]);

  const parsedDiscount = parseFloat(discount) || 0;
  const parsedTax = parseFloat(tax) || 0;
  const grandTotal = Math.max(0, subtotal - parsedDiscount + parsedTax);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty. Please add products first.');
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone ? customerPhone.trim() : null,
        paymentMethod,
        discount: parsedDiscount,
        tax: parsedTax,
        notes: notes ? notes.trim() : null,
        items: cart.map((item) => ({
          productId: item.product.id,
          unitSold: item.unitSold,
          quantity: item.quantity,
          customPrice: item.unitPrice,
        })),
      };

      const result = await ApiClient.createOrder(orderPayload);
      toast.success(`Order ${result.orderNumber} created! Inventory automatically updated in DB.`);

      // Set completed order & open receipt
      setCompletedOrder(result);
      setIsReceiptOpen(true);

      // Reset cart and customer fields
      clearCart();
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setDiscount('');
      setTax('');
      setNotes('');

      // Refresh product stock in real-time
      fetchCatalog();
    } catch (err) {
      toast.error(err.message || 'Failed to complete order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header
        title="Create Order / Point of Sale"
        subtitle="Sell products per piece or per box with instant stock deduction"
      />

      <div className="page-body" style={{ paddingBottom: '3rem' }}>
        <div className="pos-layout">
          {/* LEFT: Product Catalog Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
            {/* Search and Category Filter */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <input
                  type="text"
                  placeholder="Search products or scan SKU barcode..."
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search
                  size={16}
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                />
              </div>

              {categories.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                  <button
                    onClick={() => setSelectedCategory('')}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      backgroundColor: !selectedCategory ? '#4f46e5' : '#ffffff',
                      color: !selectedCategory ? '#ffffff' : '#64748b',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: selectedCategory === cat ? '#4f46e5' : '#ffffff',
                        color: selectedCategory === cat ? '#ffffff' : '#64748b',
                        border: '1px solid #e2e8f0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Products Grid */}
            {/* Products Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gridAutoRows: 'max-content',
              alignItems: 'start',
              gap: '1.25rem',
              overflowY: 'auto',
              flex: 1,
              maxHeight: 'calc(100vh - 210px)',
              paddingRight: '0.5rem',
              paddingBottom: '2.5rem',
            }}>
              {loading ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                  <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #cbd5e1', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>Loading catalog...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0' }}>
                  <Package size={36} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ color: '#475569', fontWeight: 600 }}>No matching products</p>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.stockPieces <= 0;
                  const piecesPerBox = p.piecesPerBox || 1;
                  const totalBoxes = Math.floor(p.stockPieces / piecesPerBox);

                  return (
                    <div
                      key={p.id}
                      className="card"
                      style={{
                        padding: '1.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '230px',
                        overflow: 'visible',
                        opacity: isOutOfStock ? 0.6 : 1,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                            {p.name}
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                            <Badge type={p.sellingUnitType} icon={false} />
                            {p.isLowStock && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                backgroundColor: '#fef2f2',
                                color: '#b91c1c',
                                border: '1px solid #fca5a5',
                                borderRadius: 'var(--radius-full)',
                                padding: '0.15rem 0.5rem',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                              }}>
                                <AlertTriangle size={11} strokeWidth={2.5} /> Low Stock
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                          SKU: <span style={{ fontFamily: 'var(--font-mono)' }}>{p.sku}</span>
                        </div>

                        {/* Stock Balance display */}
                        <div style={{
                          backgroundColor: p.isLowStock ? '#fffbeb' : '#f8fafc',
                          border: p.isLowStock ? '1px solid #fde68a' : '1px solid #e2e8f0',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '1rem',
                          fontSize: '0.8rem',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: '#334155' }}>
                            <span>Available:</span>
                            <span style={{ color: p.isLowStock ? '#b45309' : '#047857', fontWeight: 700 }}>
                              {p.sellingUnitType === 'BOX_ONLY'
                                ? `${totalBoxes} Box${totalBoxes === 1 ? '' : 'es'} (${p.stockPieces} pcs)`
                                : p.displayStock || `${p.stockPieces} pcs`}
                            </span>
                          </div>
                          {p.sellingUnitType === 'BOTH' && (
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                              📦 {totalBoxes} Boxes ({piecesPerBox} pcs/box)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selling Unit Add Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {/* Option 1: If Both or Piece Only */}
                        {(p.sellingUnitType === 'BOTH' || p.sellingUnitType === 'PIECE_ONLY') && (
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => addToCart(p, 'PIECE')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.55rem 0.85rem',
                              borderRadius: 'var(--radius-md)',
                              border: '1.5px solid #86efac',
                              backgroundColor: '#f0fdf4',
                              color: '#166534',
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Plus size={15} strokeWidth={2.5} />
                              <span>+ 1 Piece</span>
                            </span>
                            <span style={{ backgroundColor: '#dcfce7', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                              ${Number(p.pricePerPiece).toFixed(2)}
                            </span>
                          </button>
                        )}

                        {/* Option 2: If Both or Box Only */}
                        {(p.sellingUnitType === 'BOTH' || p.sellingUnitType === 'BOX_ONLY') && (
                          <button
                            type="button"
                            disabled={p.stockPieces < piecesPerBox}
                            onClick={() => addToCart(p, 'BOX')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.55rem 0.85rem',
                              borderRadius: 'var(--radius-md)',
                              border: '1.5px solid #4338ca',
                              backgroundColor: '#4f46e5',
                              color: '#ffffff',
                              cursor: p.stockPieces < piecesPerBox ? 'not-allowed' : 'pointer',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              boxShadow: '0 2px 5px rgba(79, 70, 229, 0.25)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Plus size={15} strokeWidth={2.5} />
                              <span>+ 1 Box ({piecesPerBox} pcs)</span>
                            </span>
                            <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                              ${Number(p.pricePerBox).toFixed(2)}
                            </span>
                          </button>
                        )}

                        {isOutOfStock && (
                          <span style={{ fontSize: '0.75rem', color: '#dc2626', textAlign: 'center', fontWeight: 600 }}>
                            Out of stock
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Active Cart & Cash Register */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Cart Header */}
            <div className="card-header" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={18} color="#4f46e5" />
                <h3 style={{ fontSize: '0.95rem' }}>Order Register ({cart.length} items)</h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                  <ShoppingCart size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Order cart is empty</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Click &quot;+ 1 Piece&quot; or &quot;+ 1 Box&quot; on products to add to this order
                  </p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${item.unitSold}`}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                          {item.product.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            backgroundColor: item.unitSold === 'BOX' ? '#eff6ff' : '#f0fdf4',
                            color: item.unitSold === 'BOX' ? '#1e40af' : '#166534',
                          }}>
                            {item.unitSold} (${Number(item.unitPrice).toFixed(2)})
                          </span>
                          {item.unitSold === 'BOX' && (
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              ({item.quantity * item.product.piecesPerBox} pcs)
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(idx)}
                        style={{ color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
                        title="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      {/* Qty incrementer */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-sm)' }}>
                        <button
                          onClick={() => updateCartQty(idx, -1)}
                          style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', color: '#475569' }}
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(idx, 1)}
                          style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', color: '#475569' }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                        ${item.lineTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer & Checkout Drawer */}
            <div style={{
              padding: '1.25rem',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}>
              {/* Customer Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Customer Name"
                  className="form-input"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Phone (optional)"
                  className="form-input"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              {/* Payment Method Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                {['CASH', 'CARD', 'ONLINE'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    style={{
                      padding: '0.4rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: paymentMethod === method ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                      backgroundColor: paymentMethod === method ? '#eef2ff' : '#ffffff',
                      color: paymentMethod === method ? '#4338ca' : '#64748b',
                      cursor: 'pointer',
                    }}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {/* Discounts & Taxes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Discount ($)"
                  className="form-input"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Tax ($)"
                  className="form-input"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                />
              </div>

              {/* Order Totals Summary */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {parsedDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#dc2626' }}>
                    <span>Discount:</span>
                    <span>-${parsedDiscount.toFixed(2)}</span>
                  </div>
                )}
                {parsedTax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                    <span>Tax:</span>
                    <span>+${parsedTax.toFixed(2)}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginTop: '0.35rem',
                }}>
                  <span>Total:</span>
                  <span style={{ color: '#4f46e5' }}>${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                variant="primary"
                size="lg"
                disabled={cart.length === 0}
                loading={submitting}
                icon={CheckCircle}
                onClick={handleCheckout}
                style={{ width: '100%', marginTop: '0.25rem' }}
              >
                Complete Sale & Deduct Stock
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={completedOrder}
      />
    </>
  );
}
