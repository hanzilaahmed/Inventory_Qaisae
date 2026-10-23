'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/layout/Header';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ReceiptModal from '../../components/orders/ReceiptModal';
import ApiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Receipt,
  Search,
  Eye,
  RotateCcw,
  RefreshCw,
  Calendar,
  FileText,
} from 'lucide-react';

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  // Selected order for receipt view
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const toast = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getOrders({
        search: search || undefined,
        status: statusFilter || undefined,
        paymentMethod: paymentFilter || undefined,
      });
      setOrders(data.orders || []);
    } catch (err) {
      toast.error('Failed to load orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentFilter, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async (order) => {
    const reason = prompt(`Enter reason for cancelling order ${order.orderNumber} (stock will be restored to inventory):`);
    if (reason !== null && reason.trim()) {
      try {
        await ApiClient.cancelOrder(order.id, reason);
        toast.success(`Order ${order.orderNumber} cancelled and stock restored to inventory.`);
        fetchOrders();
      } catch (err) {
        toast.error(err.message || 'Failed to cancel order');
      }
    }
  };

  const handleViewReceipt = (order) => {
    setSelectedOrder(order);
    setIsReceiptOpen(true);
  };

  return (
    <>
      <Header
        title="Sales Orders History"
        subtitle="Chronological record of every completed sale, payment, and items sold"
      />

      <div className="page-body">
        {/* Controls */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', minWidth: '260px', flex: 1, maxWidth: '420px' }}>
            <input
              type="text"
              placeholder="Search by Order # or Customer..."
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="">All Payments</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="ONLINE">Online</option>
            </select>

            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <Button variant="outline" size="md" icon={RefreshCw} onClick={fetchOrders}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Items Purchased</th>
                  <th>Payment</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                      <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #cbd5e1', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>Loading sales history...</div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                      <FileText size={42} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
                      <h4 style={{ color: '#334155', fontWeight: 600 }}>No orders recorded</h4>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        Create a new sale in the POS screen to record your first transaction.
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => {
                    const formattedDate = new Date(ord.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={ord.id}>
                        <td>
                          <code style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: '#4f46e5',
                            backgroundColor: '#eef2ff',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                          }}>
                            {ord.orderNumber}
                          </code>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {formattedDate}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{ord.customerName}</div>
                          {ord.customerPhone && (
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ord.customerPhone}</div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {ord.items?.map((item, i) => (
                              <div key={i} style={{ fontSize: '0.8rem', color: '#334155' }}>
                                <strong>{item.quantity} {item.unitSold.toLowerCase()}{item.quantity > 1 ? 's' : ''}</strong> of {item.productName}
                                <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: '0.35rem' }}>
                                  ({item.piecesDeducted} pcs)
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                          }}>
                            {ord.paymentMethod}
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                            ${Number(ord.totalAmount).toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <Badge type={ord.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Eye}
                              onClick={() => handleViewReceipt(ord)}
                            >
                              Receipt
                            </Button>
                            {ord.status === 'COMPLETED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={RotateCcw}
                                title="Cancel and Restore Stock"
                                style={{ color: '#ef4444' }}
                                onClick={() => handleCancelOrder(ord)}
                              >
                                Refund
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={selectedOrder}
      />
    </>
  );
}
