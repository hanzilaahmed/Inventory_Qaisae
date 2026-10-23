'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import StockAdjustModal from '../components/products/StockAdjustModal';
import ReceiptModal from '../components/orders/ReceiptModal';
import ApiClient from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Receipt,
  Boxes,
  ArrowRight,
  SlidersHorizontal,
  Eye,
  Plus,
} from 'lucide-react';

export default function DashboardPage() {
  const { admin } = useAuth();
  const toast = useToast();

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchMetrics = async () => {
    try {
      const data = await ApiClient.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleAdjustStock = async (id, adjustData) => {
    try {
      await ApiClient.adjustStock(id, adjustData);
      toast.success('Stock adjusted successfully!');
      fetchMetrics();
    } catch (err) {
      throw err;
    }
  };

  const overview = metrics?.overview || {
    totalProducts: 0,
    lowStockCount: 0,
    totalOrders: 0,
    todayOrdersCount: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    totalInventoryValue: 0,
  };

  return (
    <>
      <Header
        title={`Welcome, ${admin?.name || 'Administrator'}`}
        subtitle="Real-time retail inventory & sales dashboard"
      />

      <div className="page-body">
        {/* Quick Hero POS Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem 2rem',
          color: '#ffffff',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.4)',
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              <span>🛒 Shop Floor Point of Sale</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
              Customer at the counter?
            </h2>
            <p style={{ color: '#c7d2fe', fontSize: '0.9rem', maxWidth: '520px' }}>
              Create a sales order instantly. Choose whether to sell per individual piece or full box with automated live inventory deductions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/pos">
              <Button
                variant="primary"
                size="lg"
                icon={ShoppingCart}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#4338ca',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                }}
              >
                Open POS Register
              </Button>
            </Link>
            <Link href="/products">
              <Button
                variant="outline"
                size="lg"
                icon={Plus}
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                Add Product
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {/* Card 1: Today Revenue */}
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Today&apos;s Sales</div>
              <div className="stat-value" style={{ color: '#059669' }}>
                ${Number(overview.todayRevenue).toFixed(2)}
              </div>
              <div className="stat-desc">{overview.todayOrdersCount} orders placed today</div>
            </div>
            <div className="stat-icon-wrapper stat-icon-green">
              <DollarSign size={24} />
            </div>
          </div>

          {/* Card 2: Total Revenue */}
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value" style={{ color: '#4f46e5' }}>
                ${Number(overview.totalRevenue).toFixed(2)}
              </div>
              <div className="stat-desc">{overview.totalOrders} total completed sales</div>
            </div>
            <div className="stat-icon-wrapper stat-icon-indigo">
              <TrendingUp size={24} />
            </div>
          </div>

          {/* Card 3: Total Products */}
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Catalog Products</div>
              <div className="stat-value">{overview.totalProducts}</div>
              <div className="stat-desc">${Number(overview.totalInventoryValue).toFixed(0)} inventory value</div>
            </div>
            <div className="stat-icon-wrapper stat-icon-blue">
              <Boxes size={24} />
            </div>
          </div>

          {/* Card 4: Low Stock Warnings */}
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Low Stock Alerts</div>
              <div className="stat-value" style={{ color: overview.lowStockCount > 0 ? '#dc2626' : '#059669' }}>
                {overview.lowStockCount}
              </div>
              <div className="stat-desc">Products near threshold</div>
            </div>
            <div className="stat-icon-wrapper stat-icon-amber">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        {/* Two Column Layout: Low Stock Warning & Recent Sales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
          {/* Section: Low Stock Warning */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="#d97706" />
                <h3>Low Stock Warning</h3>
              </div>
              <Link href="/products" style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                All Products <ArrowRight size={14} />
              </Link>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {!metrics?.lowStockProducts || metrics.lowStockProducts.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🎉</div>
                  <p style={{ fontWeight: 600 }}>All inventory items are well-stocked!</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Available Stock</th>
                        <th>Selling Mode</th>
                        <th style={{ textAlign: 'right' }}>Restock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.lowStockProducts.map((p) => {
                        const ppb = p.piecesPerBox || 1;
                        const totalBoxes = Math.floor(p.stockPieces / ppb);

                        return (
                          <tr key={p.id}>
                            <td>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.sku}</div>
                            </td>
                            <td>
                              <span style={{ color: '#dc2626', fontWeight: 800 }}>
                                {p.stockPieces} pcs
                              </span>
                              {p.sellingUnitType !== 'PIECE_ONLY' && (
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  ({totalBoxes} boxes)
                                </div>
                              )}
                            </td>
                            <td>
                              <Badge type={p.sellingUnitType} icon={false} />
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <Button
                                variant="outline"
                                size="sm"
                                icon={SlidersHorizontal}
                                onClick={() => {
                                  setAdjustingProduct(p);
                                  setIsAdjustOpen(true);
                                }}
                              >
                                Restock
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Section: Recent Orders */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={18} color="#4f46e5" />
                <h3>Recent Sales Orders</h3>
              </div>
              <Link href="/orders" style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                View All History <ArrowRight size={14} />
              </Link>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {!metrics?.recentOrders || metrics.recentOrders.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                  <ShoppingCart size={32} color="#cbd5e1" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontWeight: 600 }}>No orders placed yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.recentOrders.map((ord) => (
                        <tr key={ord.id}>
                          <td>
                            <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#4f46e5' }}>
                              {ord.orderNumber}
                            </code>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{ord.customerName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {ord.items?.length || 0} item(s)
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: '#0f172a' }}>
                              ${Number(ord.totalAmount).toFixed(2)}
                            </strong>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Eye}
                              onClick={() => {
                                setSelectedOrder(ord);
                                setIsReceiptOpen(true);
                              }}
                            >
                              Receipt
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Restock Modal */}
      <StockAdjustModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        product={adjustingProduct}
        onAdjust={handleAdjustStock}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={selectedOrder}
      />
    </>
  );
}
