'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/layout/Header';
import Button from '../../components/ui/Button';
import ApiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  History,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Filter,
} from 'lucide-react';

export default function HistoryPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const toast = useToast();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getStockLogs({
        type: typeFilter || undefined,
        limit: 100,
      });
      setLogs(data.logs || []);
    } catch (err) {
      toast.error('Failed to load history logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <>
      <Header
        title="Stock Movements & Audit History"
        subtitle="Full chronological tracking of all sales, restocks, adjustments, and returns"
      />

      <div className="page-body">
        {/* Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Movement Types</option>
              <option value="SALE">Sales Outflow</option>
              <option value="RESTOCK">Supplier Restock</option>
              <option value="RETURN">Order Return / Refund</option>
              <option value="INITIAL">Initial Stock</option>
              <option value="ADJUSTMENT">Manual Adjustment</option>
            </select>
          </div>

          <Button variant="outline" size="md" icon={RefreshCw} onClick={fetchLogs}>
            Refresh Logs
          </Button>
        </div>

        {/* Logs Table */}
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product</th>
                  <th>Action Type</th>
                  <th>Quantity Changed</th>
                  <th>Inventory Balance</th>
                  <th>Reference / Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                      <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #cbd5e1', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>Loading movement logs...</div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                      <History size={42} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
                      <h4 style={{ color: '#334155', fontWeight: 600 }}>No stock movements recorded</h4>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        Transactions will automatically appear here when sales, shipments, or adjustments happen.
                      </p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const formattedDate = new Date(log.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const isOutflow = log.quantityChanged < 0;

                    let typeBadgeClass = 'badge badge-piece';
                    if (log.type === 'SALE') typeBadgeClass = 'badge badge-danger';
                    if (log.type === 'RESTOCK') typeBadgeClass = 'badge badge-success';
                    if (log.type === 'RETURN') typeBadgeClass = 'badge badge-box';

                    return (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {formattedDate}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {log.product?.name || 'Unknown Product'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                            {log.product?.sku}
                          </div>
                        </td>
                        <td>
                          <span className={typeBadgeClass}>
                            {log.type}
                          </span>
                        </td>
                        <td>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            color: isOutflow ? '#dc2626' : '#059669',
                          }}>
                            {isOutflow ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                            <span>{log.quantityChanged > 0 ? `+${log.quantityChanged}` : log.quantityChanged} pcs</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                            <span>{log.stockBefore} pcs</span>
                            <span style={{ color: '#94a3b8', margin: '0 0.35rem' }}>&rarr;</span>
                            <strong style={{ color: '#0f172a' }}>{log.stockAfter} pcs</strong>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#475569', maxWidth: '300px' }}>
                          {log.notes || '—'}
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
    </>
  );
}
