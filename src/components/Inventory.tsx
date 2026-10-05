import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  MoreVertical, 
  AlertTriangle,
  ArrowUpRight,
  Filter,
  Truck,
  LayoutGrid,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Purchases from './Purchases';
import { useAuth } from '../context/AuthContext';
import BulkImportModal from './BulkImportModal';

export default function Inventory() {
  const { user, token } = useAuth();
  const isCashier = user?.role === 'cashier';
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    barcode: '',
    hsnCode: '',
    gstRate: 18,
    costPrice: 0, 
    sellPrice: 0, 
    mrp: 0,
    discount: 0,
    discountType: 'amount' as 'amount' | 'percent',
    stock: 0, 
    category: 'General',
    image: ''
  });

  const validatePricing = () => {
    if (newProduct.costPrice > newProduct.sellPrice) return "Cost Price cannot be greater than Sell Price (Loss Alert)";
    if (newProduct.sellPrice > newProduct.mrp) return "Sell Price cannot exceed MRP";
    return null;
  };

  const calculateSellPrice = (mrp: number, disc: number, type: 'amount' | 'percent') => {
    let price = 0;
    if (type === 'percent') {
      price = mrp - (mrp * (disc / 100));
    } else {
      price = mrp - disc;
    }
    return Math.max(0, price);
  };

  const handlePriceChange = (field: string, value: number | string) => {
    setNewProduct(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate sell price if MRP or Discount changes
      if (field === 'mrp' || field === 'discount' || field === 'discountType') {
        updated.sellPrice = calculateSellPrice(
          Number(updated.mrp), 
          Number(updated.discount), 
          updated.discountType
        );
      }
      
      return updated;
    });
  };
  const fetchProducts = () => {
    fetch('/api/products', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error('Error fetching products:', err));
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const handleAddProduct = async () => {
    const error = validatePricing();
    if (error) {
       alert(error);
       return;
    }

    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';
    
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(newProduct)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.message || 'Operation failed');
      return;
    }
    fetchProducts();
    setShowAddModal(false);
    setNewProduct({ 
      name: '', 
      barcode: '',
      hsnCode: '',
      gstRate: 18,
      costPrice: 0, 
      sellPrice: 0, 
      mrp: 0,
      discount: 0,
      discountType: 'amount',
      stock: 0, 
      category: 'General',
      image: ''
    });
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (isCashier) {
      alert("Permission Denied: Cashiers cannot delete inventory items.");
      return;
    }
    if (confirm('Are you sure you want to delete this product?')) {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/products/${id}`, { 
        method: 'DELETE',
        headers
      });
      if (res.status === 403) {
        alert("Permission Denied: Cashiers cannot delete inventory items.");
        return;
      }
      fetchProducts();
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      barcode: product.barcode || '',
      hsnCode: product.hsnCode || '',
      gstRate: product.gstRate !== undefined ? Number(product.gstRate) : 18,
      costPrice: product.costPrice || 0,
      sellPrice: product.sellPrice || product.price || 0,
      mrp: product.mrp || 0,
      discount: product.discount || 0,
      discountType: product.discountType || 'amount',
      stock: product.stock,
      category: product.category,
      image: product.image || ''
    });
    setShowAddModal(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Inventory Stock</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Manage barcodes, pricing, stock levels & catalog import.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              window.open('/api/products/export', '_blank');
            }}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 rounded-2xl font-bold text-xs hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-xs cursor-pointer"
            title="Download full catalog as CSV"
          >
            <Download size={16} /> Export (CSV)
          </button>

          {!isCashier && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 rounded-2xl font-bold text-xs hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-xs cursor-pointer"
              title="Bulk import products from CSV"
            >
              <FileSpreadsheet size={16} className="text-emerald-500" /> Bulk Import
            </button>
          )}

          <button 
            onClick={() => {
              setEditingProduct(null);
              setNewProduct({ 
                name: '', 
                barcode: '',
                hsnCode: '',
                gstRate: 18,
                costPrice: 0, 
                sellPrice: 0, 
                mrp: 0,
                discount: 0,
                discountType: 'amount',
                stock: 0, 
                category: 'General',
                image: ''
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={18} /> Add New Product
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by product name or ID..."
            className="w-full bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all font-medium shadow-xs dark:shadow-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="w-12 h-12 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-center text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs dark:shadow-none cursor-pointer">
          <Filter size={18} />
        </button>
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-[32px] overflow-x-auto shadow-xs dark:shadow-none">
        <table className="w-full min-w-[800px]">
          <thead className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
            <tr>
              <th className="px-8 py-5 text-left">Product Details</th>
              <th className="px-6 py-5 text-left">Category</th>
              <th className="px-6 py-5 text-left">HSN/SAC</th>
              <th className="px-6 py-5 text-left">GST Slab</th>
              <th className="px-6 py-5 text-left">Selling Price</th>
              <th className="px-6 py-5 text-left">Stock Level</th>
              <th className="px-8 py-5 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {filteredProducts.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    {p.image ? (
                      <img src={p.image} className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/5" alt={p.name} />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#111111] flex items-center justify-center text-blue-500 font-bold border border-slate-200 dark:border-white/5">
                        {p.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-gray-200">{p.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-gray-600 font-mono">{p.barcode || `ID: #${p.id.padStart(4, '0')}`}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 bg-slate-100 dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-full text-[10px] font-bold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                    {p.category}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-gray-300">
                    {p.hsnCode || '—'}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-lg text-xs font-black">
                    {p.gstRate !== undefined ? p.gstRate : 18}%
                  </span>
                </td>
                <td className="px-6 py-5 font-black text-slate-900 dark:text-gray-200">
                  <div className="flex flex-col">
                    <span>₹{(p.sellPrice || p.price).toLocaleString()}</span>
                    {p.mrp > (p.sellPrice || p.price) && (
                      <span className="text-[9px] text-gray-500 line-through font-medium">₹{p.mrp}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${p.stock < 15 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'}`} 
                        style={{ width: `${Math.min(p.stock, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${p.stock < 15 ? 'text-red-500' : 'text-gray-400'}`}>
                      {p.stock}
                    </span>
                    {p.stock < 15 && <AlertTriangle size={12} className="text-red-500 animate-pulse" />}
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(p)}
                      className="w-8 h-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 flex items-center justify-center transition-all"
                    >
                      <ArrowUpRight size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(p.id)}
                      className="w-8 h-8 rounded-lg hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredProducts.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-gray-600">
            <Package size={48} className="mb-4 opacity-10" />
            <p className="text-sm font-bold uppercase tracking-widest opacity-30">Inventory Empty</p>
            <p className="text-xs mt-1">Start by adding your first product.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-[40px] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl mx-4"
            >
              <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                <h3 className="text-xl md:text-2xl font-bold">{editingProduct ? 'Edit Product Master' : 'New Product Master'}</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="space-y-4">
                  {/* Image Upload Placeholder */}
                  <div className="flex items-center gap-4 p-4 bg-[#111111] border border-white/5 rounded-2xl">
                    <div className="w-16 h-16 rounded-xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center text-gray-600 gap-1 overflow-hidden relative">
                       {newProduct.image ? (
                         <img src={newProduct.image} className="w-full h-full object-cover" />
                       ) : (
                         <Plus size={16} />
                       )}
                       <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setNewProduct({...newProduct, image: reader.result as string});
                            reader.readAsDataURL(file);
                          }
                        }}
                       />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400">Product Image</p>
                      <p className="text-[9px] text-gray-600">JPG, PNG or SVG. Max 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Product Name</label>
                      <input 
                        placeholder="e.g. Wireless Mouse"
                        className="w-full bg-[#111111] border border-white/5 rounded-2xl px-4 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-medium text-white"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Barcode Number</label>
                      <input 
                        placeholder="e.g. 6901234567890"
                        className="w-full bg-[#111111] border border-white/5 rounded-2xl px-4 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-medium text-white font-mono"
                        value={newProduct.barcode}
                        onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">HSN / SAC Code</label>
                      <input 
                        placeholder="e.g. 8517 / 9983"
                        className="w-full bg-[#111111] border border-white/5 rounded-2xl px-4 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-medium text-white font-mono uppercase"
                        value={newProduct.hsnCode}
                        onChange={(e) => setNewProduct({...newProduct, hsnCode: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">GST Slab Rate</label>
                      <select 
                        className="w-full bg-[#111111] border border-white/5 rounded-2xl px-4 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-medium text-white cursor-pointer"
                        value={newProduct.gstRate}
                        onChange={(e) => setNewProduct({...newProduct, gstRate: Number(e.target.value)})}
                      >
                        <option value={0}>0% (Nil / Exempt)</option>
                        <option value={5}>5% (Essential items)</option>
                        <option value={12}>12% (Standard goods)</option>
                        <option value={18}>18% (Standard goods/services)</option>
                        <option value={28}>28% (Luxury / De-merit goods)</option>
                      </select>
                    </div>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-3xl space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MRP (₹)</label>
                        <input 
                          type="number"
                          className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-all font-bold text-white"
                          value={newProduct.mrp}
                          onChange={(e) => handlePriceChange('mrp', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2 relative">
                        <div className="flex justify-between items-center pr-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Discount</label>
                          <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5 scale-90 origin-right">
                             <button 
                               onClick={() => handlePriceChange('discountType', 'amount')}
                               className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold transition-all ${newProduct.discountType === 'amount' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                             >₹</button>
                             <button 
                               onClick={() => handlePriceChange('discountType', 'percent')}
                               className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold transition-all ${newProduct.discountType === 'percent' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                             >%</button>
                          </div>
                        </div>
                        <input 
                          type="number"
                          className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-all font-bold text-white text-green-500"
                          value={newProduct.discount}
                          onChange={(e) => handlePriceChange('discount', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2 col-span-2 md:col-span-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sell Price (₹)</label>
                        <div className="px-4 py-3 bg-blue-600 rounded-xl font-black text-white shadow-lg shadow-blue-900/40 text-center">
                          ₹{newProduct.sellPrice.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      {!isCashier ? (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cost Price (₹)</label>
                          <input 
                            type="number"
                            className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-all font-bold text-white"
                            value={newProduct.costPrice}
                            onChange={(e) => handlePriceChange('costPrice', Number(e.target.value))}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2 opacity-50 cursor-not-allowed">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cost Price</label>
                          <div className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 font-mono text-gray-500 text-xs flex items-center">
                            Restricted (Admin Only)
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Initial Stock</label>
                        <input 
                          type="number"
                          className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-all font-bold text-white"
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                        />
                      </div>
                    </div>

                    {validatePricing() && (
                      <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                        <AlertTriangle size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{validatePricing()}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category</label>
                    <select 
                      className="w-full bg-[#111111] border border-white/5 rounded-2xl px-4 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-medium text-white appearance-none"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    >
                      <option>General</option>
                      <option>Electronics</option>
                      <option>Beverages</option>
                      <option>Stationary</option>
                      <option>Hardware</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleAddProduct}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all mt-4"
                >
                  {editingProduct ? 'UPDATE PRODUCT' : 'ADD TO INVENTORY'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk CSV Import Modal */}
      <BulkImportModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => fetchProducts()}
      />
    </div>
  );
}
