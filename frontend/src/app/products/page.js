'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/layout/Header';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProductFormModal from '../../components/products/ProductFormModal';
import StockAdjustModal from '../../components/products/StockAdjustModal';
import ApiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Plus,
  Search,
  Filter,
  Package,
  Box,
  Edit2,
  Trash2,
  SlidersHorizontal,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [categories, setCategories] = useState([]);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState(null);

  const toast = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getProducts({
        search: search || undefined,
        category: categoryFilter || undefined,
      });
      setProducts(data.products || []);
    } catch (err) {
      toast.error('Failed to load products: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, toast]);

  const fetchCategories = async () => {
    try {
      const list = await ApiClient.getCategories();
      setCategories(list || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts]);

  const handleSaveProduct = async (formData) => {
    try {
      if (editingProduct) {
        await ApiClient.updateProduct(editingProduct.id, formData);
        toast.success(`Product "${formData.name}" updated successfully!`);
      } else {
        await ApiClient.createProduct(formData);
        toast.success(`Product "${formData.name}" added to inventory!`);
      }
      fetchProducts();
      fetchCategories();
    } catch (err) {
      throw err;
    }
  };

  const handleAdjustStock = async (id, adjustData) => {
    try {
      await ApiClient.adjustStock(id, adjustData);
      toast.success('Stock adjusted successfully!');
      fetchProducts();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteProduct = async (product) => {
    if (confirm(`Are you sure you want to delete product "${product.name}"?`)) {
      try {
        await ApiClient.deleteProduct(product.id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (err) {
        toast.error(err.message || 'Failed to delete product');
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!unitFilter) return true;
    return p.sellingUnitType === unitFilter;
  });

  return (
    <>
      <Header
        title="Products Catalog"
        subtitle="Manage inventory items, pricing, piece & box configurations"
        onAddProduct={() => {
          setEditingProduct(null);
          setIsFormOpen(true);
        }}
      />

      <div className="page-body">
        {/* Top Control Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '450px' }}>
            <input
              type="text"
              placeholder="Search by product name, SKU, or category..."
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

          {/* Filters & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Unit Type Filter */}
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
            >
              <option value="">All Selling Modes</option>
              <option value="BOTH">Piece & Box</option>
              <option value="PIECE_ONLY">Piece Only</option>
              <option value="BOX_ONLY">Box Only</option>
            </select>

            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={fetchProducts}
            >
              Refresh
            </Button>

            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => {
                setEditingProduct(null);
                setIsFormOpen(true);
              }}
            >
              Add Product
            </Button>
          </div>
        </div>

        {/* Products Table Card */}
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU / Barcode</th>
                  <th>Selling Mode</th>
                  <th>Prices</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                      <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #cbd5e1', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>Loading inventory...</div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                      <Package size={42} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
                      <h4 style={{ color: '#334155', fontWeight: 600 }}>No products found</h4>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        Try searching for a different keyword or create your first product.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                          {p.category && (
                            <span style={{ fontSize: '0.75rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                              {p.category}
                            </span>
                          )}
                        </td>
                        <td>
                          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', backgroundColor: '#f8fafc', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            {p.sku}
                          </code>
                        </td>
                        <td>
                          <Badge type={p.sellingUnitType} />
                          {p.sellingUnitType !== 'PIECE_ONLY' && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                              1 Box = {p.piecesPerBox} Pcs
                            </div>
                          )}
                        </td>
                        <td>
                          {p.sellingUnitType === 'BOTH' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                                ${Number(p.pricePerPiece).toFixed(2)} / pc
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 600 }}>
                                ${Number(p.pricePerBox).toFixed(2)} / box
                              </span>
                            </div>
                          )}
                          {p.sellingUnitType === 'PIECE_ONLY' && (
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                              ${Number(p.pricePerPiece).toFixed(2)} / pc
                            </span>
                          )}
                          {p.sellingUnitType === 'BOX_ONLY' && (
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4f46e5' }}>
                              ${Number(p.pricePerBox).toFixed(2)} / box
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {p.displayStock}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Alert threshold: &le; {p.minStockAlert} pcs
                            {p.sellingUnitType !== 'PIECE_ONLY' && (
                              <span style={{ color: '#4338ca', fontWeight: 600, marginLeft: '0.3rem' }}>
                                ({Math.floor(p.minStockAlert / (p.piecesPerBox || 1))} boxes)
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {p.isLowStock ? (
                            <Badge type="LOW_STOCK" text="Low Stock Alert" />
                          ) : (
                            <span className="badge badge-success">In Stock</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={SlidersHorizontal}
                              title="Restock or Adjust Inventory"
                              onClick={() => {
                                setAdjustingProduct(p);
                                setIsAdjustOpen(true);
                              }}
                            >
                              Stock
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Edit2}
                              title="Edit Product"
                              onClick={() => {
                                setEditingProduct(p);
                                setIsFormOpen(true);
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              title="Delete Product"
                              style={{ color: '#ef4444' }}
                              onClick={() => handleDeleteProduct(p)}
                            />
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

      {/* Product Create / Edit Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
      />

      {/* Quick Stock Adjustment Modal */}
      <StockAdjustModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        product={adjustingProduct}
        onAdjust={handleAdjustStock}
      />
    </>
  );
}
