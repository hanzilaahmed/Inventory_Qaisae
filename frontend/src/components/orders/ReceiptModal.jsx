'use client';

import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Printer, CheckCircle2 } from 'lucide-react';

export default function ReceiptModal({ isOpen, onClose, order }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.createdAt || Date.now()).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sale Completed - Receipt" maxWidth="500px">
      <div className="modal-body" style={{ backgroundColor: '#f8fafc', padding: '1.5rem' }}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px dashed #cbd5e1',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          fontFamily: 'var(--font-sans)',
        }}>
          {/* Receipt Header */}
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              marginBottom: '0.5rem',
            }}>
              <CheckCircle2 size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>StockPro Retail</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Store Inventory & Sales Receipt</p>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#334155', fontWeight: 600 }}>
              Order #: {order.orderNumber}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{formattedDate}</div>
          </div>

          {/* Customer Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '1rem', color: '#475569' }}>
            <div>
              <span>Customer: </span>
              <strong>{order.customerName || 'Walk-in Customer'}</strong>
            </div>
            <div>
              <span>Payment: </span>
              <strong>{order.paymentMethod || 'CASH'}</strong>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '0.75rem 0', marginBottom: '1rem' }}>
            <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#64748b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ paddingBottom: '0.4rem' }}>Item</th>
                  <th style={{ paddingBottom: '0.4rem', textAlign: 'center' }}>Unit</th>
                  <th style={{ paddingBottom: '0.4rem', textAlign: 'center' }}>Qty</th>
                  <th style={{ paddingBottom: '0.4rem', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px dotted #f1f5f9' }}>
                    <td style={{ padding: '0.4rem 0', fontWeight: 600, color: '#1e293b' }}>
                      {item.productName}
                    </td>
                    <td style={{ padding: '0.4rem 0', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '4px',
                        backgroundColor: item.unitSold === 'BOX' ? '#eff6ff' : '#f0fdf4',
                        color: item.unitSold === 'BOX' ? '#1e40af' : '#166534',
                        fontWeight: 700,
                      }}>
                        {item.unitSold}
                      </span>
                    </td>
                    <td style={{ padding: '0.4rem 0', textAlign: 'center', color: '#475569' }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      ${Number(item.totalPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Subtotal:</span>
              <span>${Number(order.subtotal || 0).toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                <span>Discount:</span>
                <span>-${Number(order.discount).toFixed(2)}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Tax:</span>
                <span>+${Number(order.tax).toFixed(2)}</span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#0f172a',
              borderTop: '2px solid #0f172a',
              paddingTop: '0.5rem',
              marginTop: '0.25rem',
            }}>
              <span>Total Paid:</span>
              <span>${Number(order.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.7rem', color: '#94a3b8' }}>
            Thank you for shopping with us!
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" icon={Printer} onClick={handlePrint}>
          Print Receipt
        </Button>
      </div>
    </Modal>
  );
}
