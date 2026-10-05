import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Package, 
  Barcode, 
  CheckCircle2, 
  IndianRupee, 
  AlertCircle,
  Database,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playScanSuccessSound } from '../utils/audio';

export interface QuickAddProductModalProps {
  isOpen: boolean;
  barcode: string;
  initialData?: {
    name?: string;
    brand?: string;
    category?: string;
    mrp?: number;
    sellPrice?: number;
    costPrice?: number;
    hsnCode?: string;
    gstRate?: number;
    stock?: number;
    image?: string;
    source?: string;
  } | null;
  onClose: () => void;
  onSuccess: (product: any) => void;
}

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  isOpen,
  barcode,
  initialData,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('General');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [mrp, setMrp] = useState<string>('');
  const [hsnCode, setHsnCode] = useState('');
  const [gstRate, setGstRate] = useState<number>(18);
  const [stock, setStock] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setBrand(initialData?.brand || '');
      setCategory(initialData?.category || 'General');
      
      const priceVal = initialData?.sellPrice || initialData?.mrp || 0;
      setSellPrice(priceVal > 0 ? String(priceVal) : '');
      setMrp(initialData?.mrp ? String(initialData.mrp) : (priceVal > 0 ? String(priceVal) : ''));
      setHsnCode(initialData?.hsnCode || '1905');
      setGstRate(initialData?.gstRate !== undefined ? initialData.gstRate : 18);
      setStock(initialData?.stock || 10);
      setError(null);

      // Focus strategy: If name is already present from master/API, focus sell price directly!
      // If name is blank, focus name input.
      setTimeout(() => {
        if (initialData?.name) {
          priceInputRef.current?.focus();
          priceInputRef.current?.select();
        } else {
          nameInputRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen, initialData, barcode]);

  // Window escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const numPrice = Number(sellPrice);
    if (!name.trim()) {
      setError('Please provide a product name.');
      nameInputRef.current?.focus();
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid selling price (> ₹0).');
      priceInputRef.current?.focus();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/products/quick-add', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.trim(),
          barcode: barcode.trim(),
          sellPrice: numPrice,
          mrp: mrp ? Number(mrp) : numPrice,
          costPrice: Math.round(numPrice * 0.8),
          hsnCode: hsnCode.trim(),
          gstRate,
          category,
          stock,
          image: initialData?.image || ''
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      playScanSuccessSound();
      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSourceBadge = () => {
    if (initialData?.source === 'offline_master' || initialData?.source === 'pre_seeded') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/40">
          <Database size={13} className="text-emerald-500" /> Pre-Seeded Offline FMCG Master
        </span>
      );
    }
    if (initialData?.source === 'open_food_facts') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300/40">
          <Globe size={13} className="text-blue-500" /> Open Food Facts (Saved to Local DB)
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/40">
        <Sparkles size={13} className="text-amber-500" /> New Unregistered Barcode
      </span>
    );
  };

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm cursor-pointer"
      >
        <motion.div 
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden cursor-default text-slate-900 dark:text-white"
        >
          {/* Header */}
          <div className="p-5 md:p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-[#141414]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Barcode size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Counter Quick-Add Item
                </h3>
                <p className="text-xs font-mono font-bold text-slate-500 dark:text-gray-400">
                  Barcode: <span className="text-blue-600 dark:text-blue-400">{barcode}</span>
                </p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
            {/* Source Banner */}
            <div className="flex items-center justify-between">
              {getSourceBadge()}
              <span className="text-[10px] text-slate-400 font-mono">Press Enter to Bill</span>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Product Name */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">
                Product Name *
              </label>
              <input
                ref={nameInputRef}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Parle-G Biscuits 250g"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Pricing Section (Sell Price & MRP) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">
                  Sell Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    ref={priceInputRef}
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={sellPrice}
                    onChange={(e) => {
                      setSellPrice(e.target.value);
                      if (!mrp) setMrp(e.target.value);
                    }}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl text-base font-mono font-bold text-blue-600 dark:text-blue-400 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">
                  MRP (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl text-base font-mono font-bold outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Statutory Tax Slab & HSN Code */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">
                  GST Rate Slab
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {[0, 5, 12, 18, 28].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGstRate(rate)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                        gstRate === rate
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-[#1A1A1A] text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-[#252525]'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">
                  HSN / SAC Code
                </label>
                <input
                  type="text"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  placeholder="e.g. 1905"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-mono font-bold outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Category & Initial Stock */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-semibold outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                >
                  <option value="General">General</option>
                  <option value="Biscuits & Snacks">Biscuits & Snacks</option>
                  <option value="Dairy & Eggs">Dairy & Eggs</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Staples & Grocery">Staples & Grocery</option>
                  <option value="Personal Care">Personal Care</option>
                  <option value="Home Care">Home Care</option>
                  <option value="Electronics">Electronics</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">
                  Opening Stock
                </label>
                <input
                  type="number"
                  min="1"
                  value={stock}
                  onChange={(e) => setStock(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-mono font-bold outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1A1A1A] dark:hover:bg-[#252525] text-slate-600 dark:text-gray-400 font-bold text-xs uppercase tracking-wider rounded-2xl transition-colors cursor-pointer"
              >
                Skip / Cancel (Esc)
              </button>
              <button
                type="submit"
                disabled={loading}
                className="py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={16} /> Save & Add to Bill (Enter)
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


