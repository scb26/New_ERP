import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode,
  Banknote,
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Zap, 
  CreditCard,
  User,
  Camera,
  X,
  CheckCircle2,
  Keyboard,
  Wallet,
  Coins,
  Layers,
  IndianRupee,
  Sparkles,
  Barcode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarcodeCameraModal } from './BarcodeCameraModal';
import ThermalReceiptModal, { ReceiptData } from './ThermalReceiptModal';
import LocalQRCode from './LocalQRCode';
import CashDrawerModal from './CashDrawerModal';
import { QuickAddProductModal } from './QuickAddProductModal';
import { playScanSuccessSound, playScanAlertSound } from '../utils/audio';
import { useAuth } from '../context/AuthContext';

export default function QuickBill() {
  const { token } = useAuth();
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'credit' | 'split' | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm)) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const [settings, setSettings] = useState<any>(null);
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);

  // Cash Register Shift state
  const [activeShift, setActiveShift] = useState<any>(null);
  const [showDrawerModal, setShowDrawerModal] = useState(false);

  // Barcode Lookup & Quick-Add Counter State
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceVal, setEditPriceVal] = useState<string>('');
  const [saveToInventory, setSaveToInventory] = useState<boolean>(false);
  const [quickAddBarcode, setQuickAddBarcode] = useState('');
  const [quickAddInitialData, setQuickAddInitialData] = useState<any>(null);
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false);
  const [liveLookupResult, setLiveLookupResult] = useState<any>(null);
  const [isLiveLookingUp, setIsLiveLookingUp] = useState(false);
  const [scanNotification, setScanNotification] = useState<{ message: string; type: 'success' | 'alert' | 'info' } | null>(null);

  // Multi-tender split state
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitUpi, setSplitUpi] = useState<number>(0);
  const [splitCard, setSplitCard] = useState<number>(0);
  const [splitCredit, setSplitCredit] = useState<number>(0);
  const [cardRef, setCardRef] = useState<string>('');
  const [upiRef, setUpiRef] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  const fetchShift = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/shifts/current', { headers });
      if (res.ok) {
        const data = await res.json();
        setActiveShift(data.shift);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchProducts();
    fetchShift();
    fetch('/api/parties')
      .then(res => res.json())
      .then(data => {
        setParties(data.filter((p: any) => p.type === 'customer'));
      });
    
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data));
  }, [token]);

  const fetchProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  };

    // As-you-type debounced lookup for numbers / unmapped barcodes entered into search
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 3 || filteredProducts.length > 0) {
      setLiveLookupResult(null);
      setIsLiveLookingUp(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLiveLookingUp(true);
        const headers = {};
        if (token) headers['Authorization'] = 'Bearer ' + token;

        const res = await fetch('/api/barcode/lookup/' + encodeURIComponent(trimmed), { headers });
        const data = await res.json();
        setLiveLookupResult(data);
      } catch (err) {
        setLiveLookupResult({ found: false, source: 'none', barcode: trimmed });
      } finally {
        setIsLiveLookingUp(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchTerm, filteredProducts.length, token]);

  const handleDirectAddFromMaster = async (productData: any) => {
    try {
      setLoading(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;

      const sellPrice = Number(productData.sellPrice || productData.mrp || 0);
      if (sellPrice <= 0) {
        setQuickAddBarcode(productData.barcode || searchTerm.trim());
        setQuickAddInitialData(productData);
        setQuickAddModalOpen(true);
        return;
      }

      const res = await fetch('/api/products/quick-add', { 
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: productData.name,
          brand: productData.brand || '',
          barcode: productData.barcode || searchTerm.trim(),
          sellPrice,
          mrp: Number(productData.mrp || sellPrice),
          costPrice: Number(productData.costPrice || Math.round(sellPrice * 0.8)),
          hsnCode: productData.hsnCode || '1905',
          gstRate: productData.gstRate !== undefined ? productData.gstRate : 18,
          category: productData.category || 'General',
          stock: 10,
          image: productData.image || ''
        })
      });

      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || 'Failed to add product');

      playScanSuccessSound();
      setSearchTerm('');
      setLiveLookupResult(null);
      fetchProducts();
      addToCart(saved);
      setScanNotification({ message: 'Added to bill: ' + saved.name, type: 'success' });
      setTimeout(() => setScanNotification(null), 2500);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Hybrid Barcode Scanner Engine: Local Products -> Local Offline Master -> Open Food Facts API
  const handleBarcodeScan = async (scannedCode: string) => {
    if (!scannedCode || scannedCode.trim().length < 3) return;
    const cleanCode = scannedCode.trim();

    // 1. Check if item already exists in local active products
    const matched = products.find(
      p => p.barcode === cleanCode || p.id === cleanCode || p.name.toLowerCase() === cleanCode.toLowerCase()
    );
    if (matched) {
      playScanSuccessSound();
      addToCart(matched);
      setScanNotification({ message: `Added to cart: ${matched.name}`, type: 'success' });
      setTimeout(() => setScanNotification(null), 2500);
      return;
    }

    // 2. Barcode is unmapped in active store catalog -> Trigger hybrid lookup
    playScanAlertSound();
    try {
      setIsLookingUpBarcode(true);
      setScanNotification({ message: `🔍 Looking up barcode ${cleanCode}...`, type: 'info' });
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/barcode/lookup/${encodeURIComponent(cleanCode)}`, { headers });
      const data = await res.json();
      setScanNotification(null);

      setQuickAddBarcode(cleanCode);
      if (data.found && data.product) {
        setQuickAddInitialData({
          ...data.product,
          source: data.source
        });
      } else {
        setQuickAddInitialData({
          barcode: cleanCode,
          name: '',
          source: 'none'
        });
      }
      setQuickAddModalOpen(true);
    } catch (err) {
      console.error("Barcode lookup failed:", err);
      setScanNotification(null);
      setQuickAddBarcode(cleanCode);
      setQuickAddInitialData({ barcode: cleanCode, name: '', source: 'none' });
      setQuickAddModalOpen(true);
    } finally {
      setIsLookingUpBarcode(false);
    }
  };

  // 1. Hardware Barcode Scanner Buffer Listener & Keyboard Hotkeys (F2, Esc, Enter)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if QuickAddModal is currently open
      if (quickAddModalOpen) return;

      // Hotkey F2: Focus product search
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Hotkey Esc: Close modals or clear search
      if (e.key === 'Escape') {
        if (showCheckoutModal) {
          setShowCheckoutModal(false);
          setPaymentMethod(null);
        } else if (isScanning) {
          setIsScanning(false);
        } else if (searchTerm) {
          setSearchTerm('');
        }
        return;
      }

      // Hotkey Enter inside Checkout Modal with selected payment method: trigger completion
      if (e.key === 'Enter' && showCheckoutModal && paymentMethod && !loading) {
        e.preventDefault();
        handleCheckout();
        return;
      }

      // Hardware barcode scanner & keyboard buffer detection
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      const isInputFocused = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';

      if (e.key === 'Enter') {
        const scannedCode = barcodeBufferRef.current.trim();
        barcodeBufferRef.current = '';
        if (scannedCode.length >= 3) {
          handleBarcodeScan(scannedCode);
          if (isInputFocused && document.activeElement === searchInputRef.current) {
            setSearchTerm('');
          }
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (isInputFocused) {
          // Inside input: buffer rapid scanner streams (< 85ms)
          if (timeDiff < 85 || barcodeBufferRef.current.length > 0) {
            barcodeBufferRef.current += e.key;
          } else {
            barcodeBufferRef.current = e.key;
          }
        } else {
          // Outside input: buffer scanner or keypad digits (reset if idle > 1500ms)
          if (timeDiff < 1500) {
            barcodeBufferRef.current += e.key;
          } else {
            barcodeBufferRef.current = e.key;
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [products, showCheckoutModal, paymentMethod, loading, isScanning, searchTerm, quickAddModalOpen]);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    const itemPrice = product.sellPrice || product.price || 0;
    const itemTaxRate = product.gstRate !== undefined ? Number(product.gstRate) : 18;
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { 
        ...product, 
        price: itemPrice, 
        gstRate: itemTaxRate,
        hsnCode: product.hsnCode || '',
        qty: 1 
      }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const setDirectQty = (id: string, qty: number) => {
    const validQty = Math.max(1, isNaN(qty) ? 1 : qty);
    setCart(cart.map(item => item.id === id ? { ...item, qty: validQty } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const startEditingPrice = (item: any) => {
    setEditingPriceId(item.id);
    setEditPriceVal(String(item.price));
    setSaveToInventory(false);
  };

  const commitPriceEdit = async (item: any) => {
    const newPrice = Number(editPriceVal);
    if (!isNaN(newPrice) && newPrice >= 0) {
      setCart(cart.map(c => c.id === item.id ? { ...c, price: newPrice } : c));
      
      if (saveToInventory && item.id.startsWith('PROD-')) {
        try {
          const res = await fetch(`/api/products/${item.id}`, {
            headers: { ...(token ? {'Authorization': `Bearer ${token}`} : {}) }
          });
          if (res.ok) {
             const prodData = await res.json();
             await fetch(`/api/products/${item.id}`, {
               method: 'PUT',
               headers: { 'Content-Type': 'application/json', ...(token ? {'Authorization': `Bearer ${token}`} : {}) },
               body: JSON.stringify({ ...prodData, sellPrice: newPrice, mrp: newPrice })
             });
             fetchProducts();
          }
        } catch (e) {
          console.error('Failed to update inventory price', e);
        }
      }
    }
    setEditingPriceId(null);
  };

  const clearCart = () => {
    setCart([]);
    setSelectedParty(null);
  };

  // Per-item GST Tax calculation & Section 170 Round-off
    const totalAmountUnrounded = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const totalTax = cart.reduce((acc, item) => {
    const rate = item.gstRate !== undefined ? Number(item.gstRate) : 18;
    const itemTotal = item.price * item.qty;
    return acc + (itemTotal - (itemTotal / (1 + rate / 100)));
  }, 0);

  const subtotal = totalAmountUnrounded - totalTax;
  const unroundedTotal = totalAmountUnrounded;
  const roundedTotal = Math.round(unroundedTotal);
  const roundOff = +(roundedTotal - unroundedTotal).toFixed(2);
  const totalAmount = roundedTotal;

  const [showPartyList, setShowPartyList] = useState(false);

  const openCheckout = () => {
    setPaymentMethod(null);
    setSplitCash(totalAmount);
    setSplitUpi(0);
    setSplitCard(0);
    setSplitCredit(0);
    setCardRef('');
    setUpiRef('');
    setShowCheckoutModal(true);
  };

  const totalTendered = paymentMethod === 'split' 
    ? (Number(splitCash) + Number(splitUpi) + Number(splitCard) + Number(splitCredit))
    : totalAmount;
  const remainingDue = Math.max(0, totalAmount - totalTendered);
  const changeToReturn = (Number(splitCash) > 0 && totalTendered > totalAmount)
    ? (totalTendered - totalAmount)
    : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'credit' && !selectedParty) {
      alert('Credit (Udhar) billing requires selecting a registered customer.');
      return;
    }

    if (paymentMethod === 'split') {
      if (splitCredit > 0 && !selectedParty) {
        alert('Credit split portion requires selecting a registered customer.');
        return;
      }
      if (remainingDue > 0) {
        alert(`Bill balance of ₹${remainingDue.toFixed(2)} is remaining. Please tender the full amount or assign to customer credit.`);
        return;
      }
    }

    setLoading(true);
    try {
      const splitPaymentsPayload = (paymentMethod === 'split')
        ? [
            ...(splitCash > 0 ? [{ mode: 'cash', amount: splitCash }] : []),
            ...(splitUpi > 0 ? [{ mode: 'upi', amount: splitUpi, reference: upiRef || undefined }] : []),
            ...(splitCard > 0 ? [{ mode: 'card', amount: splitCard, reference: cardRef || undefined }] : []),
            ...(splitCredit > 0 ? [{ mode: 'credit', amount: splitCredit, partyId: selectedParty?.id }] : [])
          ]
        : null;

      const payload = {
        items: cart,
        subtotal,
        tax: totalTax,
        total: totalAmount,
        customer: selectedParty ? selectedParty.name : 'Walk-in Customer',
        customerId: selectedParty?.id,
        paymentMethod: paymentMethod === 'split' ? 'split' : (paymentMethod || 'cash'),
        splitPayments: splitPaymentsPayload,
        shiftId: activeShift?.id || null
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const createdInvoice = await res.json();
      if (!res.ok) throw new Error(createdInvoice.error || 'Checkout failed');

      fetchProducts(); // Refresh stock
      fetchShift(); // Refresh shift stats

      // Prepare receipt for thermal slip & WhatsApp
      setActiveReceipt({
        invoiceId: createdInvoice.id,
        date: createdInvoice.date || new Date().toISOString(),
        customerName: selectedParty ? selectedParty.name : 'Walk-in Customer',
        customerPhone: selectedParty?.phone || '',
        items: cart.map(i => ({
          id: i.id,
          name: i.name,
          qty: i.qty,
          price: i.price,
          hsnCode: i.hsnCode,
          gstRate: i.gstRate !== undefined ? i.gstRate : 18
        })),
        subtotal,
        totalTax,
        roundOff: createdInvoice.roundOff !== undefined ? createdInvoice.roundOff : roundOff,
        totalAmount: createdInvoice.total || totalAmount,
        paymentMethod: createdInvoice.paymentMethod || paymentMethod || 'cash',
        splitPayments: splitPaymentsPayload || [
          { mode: paymentMethod || 'cash', amount: totalAmount }
        ],
        business: {
          name: settings?.businessName,
          address: settings?.address,
          gstNumber: settings?.gstNumber,
          phone: settings?.phone,
          upiId: settings?.upiId
        }
      });

      setCart([]);
      setSelectedParty(null);
      setPaymentMethod(null);
      setShowCheckoutModal(false);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to complete billing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // duplicate filteredProducts removed
  //  p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //  (p.barcode && p.barcode.includes(searchTerm)) ||
  //  p.id.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 xl:h-[calc(100vh-160px)] min-h-0">
      {/* Product Selection Area */}
      <div className="flex flex-col gap-6 xl:overflow-hidden min-h-[400px]">
        {/* Search & Action Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={18} />
            <input 
              ref={searchInputRef}
              placeholder="Scan barcode or type name... (Press F2 to focus)"
              className="w-full bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-16 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 shadow-xs dark:shadow-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  e.preventDefault();
                  const term = searchTerm.trim();
                  const exact = filteredProducts.find(
                    p => p.barcode === term || p.id === term || p.name.toLowerCase() === term.toLowerCase()
                  );
                  if (exact) {
                    playScanSuccessSound();
                    addToCart(exact);
                    setSearchTerm('');
                  } else if (filteredProducts.length === 1) {
                    playScanSuccessSound();
                    addToCart(filteredProducts[0]);
                    setSearchTerm('');
                  } else {
                    setSearchTerm('');
                    handleBarcodeScan(term);
                  }
                }
              }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-400 hidden sm:inline-block">
              F2
            </span>
          </div>

          <button 
            type="button"
            onClick={() => setShowDrawerModal(true)}
            className={`px-4 h-14 rounded-2xl flex items-center gap-2.5 border transition-all cursor-pointer shrink-0 shadow-xs ${
              activeShift 
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40' 
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
            }`}
            title="Click to manage cash drawer float, petty cash in/out, or print Day-End Z-Report"
          >
            <Wallet size={18} />
            <div className="text-left hidden sm:block">
              <p className="text-[9px] font-black uppercase tracking-wider">
                {activeShift ? 'Register Open' : 'Register Closed'}
              </p>
              <p className="text-xs font-mono font-bold">
                {activeShift ? `₹${activeShift.expectedCash.toLocaleString()}` : 'Open Shift'}
              </p>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setIsScanning(true)}
            className="px-6 h-14 bg-blue-600 text-white rounded-2xl flex items-center gap-3 hover:bg-blue-700 transition-all shadow-[0_10px_20px_rgba(37,99,235,0.3)] active:scale-95 group cursor-pointer shrink-0"
          >
            <div className="relative">
              <Camera size={20} className="group-hover:rotate-6 transition-transform" />
              <Zap size={10} className="absolute -top-1 -right-1 fill-yellow-400 text-yellow-400 animate-pulse" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Scan</span>
          </button>
        </div>

                {/* Live Barcode / Number Below Barcode Match Card (When no active store product matches) */}
        {searchTerm.trim().length >= 2 && filteredProducts.length === 0 && (
          <div className="bg-white dark:bg-[#111111] border border-blue-500/30 rounded-3xl p-5 shadow-lg space-y-4">
            {isLiveLookingUp ? (
              <div className="flex items-center gap-3 text-slate-500 dark:text-gray-400 py-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold">
                  Searching 10,000+ FMCG master items & Open Food Facts for "{searchTerm}"...
                </span>
              </div>
            ) : liveLookupResult?.found && liveLookupResult?.product ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/20 shrink-0">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                        {liveLookupResult.source === 'open_food_facts' ? 'Open Food Facts Match' : 'Master Catalog Match'}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Code: {liveLookupResult.product.barcode || searchTerm}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {liveLookupResult.product.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                      {liveLookupResult.product.brand ? liveLookupResult.product.brand + ' • ' : ''}
                      HSN: {liveLookupResult.product.hsnCode || '1905'} • GST: {liveLookupResult.product.gstRate ?? 18}%
                      {liveLookupResult.product.mrp > 0 ? ' • MRP: ₹' + liveLookupResult.product.mrp : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDirectAddFromMaster(liveLookupResult.product)}
                    className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus size={16} /> Quick-Add & Bill {liveLookupResult.product.mrp > 0 ? '(₹' + liveLookupResult.product.mrp + ')' : ''} (Enter)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickAddBarcode(liveLookupResult.product.barcode || searchTerm.trim());
                      setQuickAddInitialData(liveLookupResult.product);
                      setQuickAddModalOpen(true);
                    }}
                    className="px-4 py-3.5 bg-slate-100 dark:bg-[#1E1E1E] text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-[#252525] rounded-2xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Edit Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <Barcode size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
                        Uncataloged Barcode / Item
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-gray-300">
                        "{searchTerm}"
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                      This item is not yet in your inventory. Add it once to bill now and save forever.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const code = searchTerm.trim();
                      setQuickAddBarcode(code);
                      setQuickAddInitialData({ barcode: code, name: '', source: 'none' });
                      setQuickAddModalOpen(true);
                    }}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus size={16} /> Register & Add to Bill (Enter)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar pb-8">
          {filteredProducts.map(p => (
            <motion.div 
              whileHover={{ y: -4 }}
              key={p.id}
              onClick={() => addToCart(p)}
              className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 p-4 rounded-3xl cursor-pointer hover:border-blue-500/40 transition-all group flex flex-col shadow-xs dark:shadow-none"
            >
              <div className="aspect-square bg-slate-100 dark:bg-[#111111] rounded-2xl mb-4 flex items-center justify-center text-2xl font-black text-slate-600 dark:text-gray-800 group-hover:text-blue-500 transition-colors relative overflow-hidden">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  p.name.charAt(0)
                )}
                {p.stock <= 5 && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-500 text-[8px] font-bold rounded-md">
                    LOW STOCK
                  </div>
                )}
                <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[8px] font-black">
                  GST {p.gstRate !== undefined ? p.gstRate : 18}%
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-gray-200 truncate text-sm">{p.name}</h4>
              <div className="flex items-center justify-between mt-2">
                <span className="text-blue-600 dark:text-blue-500 font-black text-sm">₹{p.sellPrice || p.price}</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-gray-600 uppercase tracking-widest">{p.stock} Units</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart & Checkout Area */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-[40px] flex flex-col overflow-hidden shadow-xl dark:shadow-2xl">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
              <ShoppingCart size={20} className="text-blue-500" /> Cart
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {cart.length} Items
              </span>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider px-2 py-1 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          
          <button 
            type="button"
            onClick={() => setShowPartyList(!showPartyList)}
            className="w-full p-4 bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-2xl flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#161616] transition-colors group cursor-pointer"
          >
             <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
                <User size={18} />
             </div>
             <div className="text-left flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-500 dark:text-gray-600 uppercase tracking-widest leading-none mb-1">Customer</p>
                <p className="text-sm font-bold text-slate-900 dark:text-gray-300 truncate">{selectedParty ? selectedParty.name : 'Walk-in Customer'}</p>
             </div>
             <Plus className={`text-slate-400 dark:text-gray-600 transition-transform ${showPartyList ? 'rotate-45' : ''}`} size={16} />
          </button>

          <AnimatePresence>
            {showPartyList && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-8 right-8 top-[140px] bg-white dark:bg-[#0F0F0F] border border-slate-200 dark:border-white/20 rounded-2xl shadow-2xl z-20 max-h-60 overflow-y-auto custom-scrollbar"
              >
                <div 
                  onClick={() => { setSelectedParty(null); setShowPartyList(false); }}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer border-b border-slate-100 dark:border-white/5 text-sm font-bold text-blue-600 dark:text-blue-500"
                >
                  Walk-in Customer
                </div>
                {parties.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => { setSelectedParty(p); setShowPartyList(false); }}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer border-b border-slate-100 dark:border-white/5 flex flex-col"
                  >
                    <span className="text-sm font-bold text-slate-900 dark:text-gray-200">{p.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-gray-500 font-medium">Balance: ₹{p.balance}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cart Item Rows */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
          <AnimatePresence initial={false}>
            {cart.map(item => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={item.id}
                className="flex items-center gap-3 md:gap-4 bg-slate-50 dark:bg-[#111111] p-3 md:p-4 rounded-2xl group border border-slate-100 dark:border-transparent hover:border-blue-500/20 dark:hover:border-white/5 transition-all text-xs"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate text-slate-900 dark:text-gray-200 tracking-tight">{item.name}</h4>
                  
                  {editingPriceId === item.id ? (
                    <div className="mt-1 flex flex-col gap-1.5 items-start">
                      <div className="flex items-center gap-1 bg-white dark:bg-[#1A1A1A] rounded p-1 border border-blue-500 shadow-sm">
                        <span className="text-xs text-slate-500 px-1">₹</span>
                        <input 
                          autoFocus
                          type="number" 
                          value={editPriceVal}
                          onChange={(e) => setEditPriceVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitPriceEdit(item);
                            if (e.key === 'Escape') setEditingPriceId(null);
                          }}
                          onBlur={() => commitPriceEdit(item)}
                          className="w-16 text-xs font-black outline-none bg-transparent text-blue-600 dark:text-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={saveToInventory} 
                          onMouseDown={(e) => {
                             e.preventDefault(); 
                             setSaveToInventory(!saveToInventory);
                          }}
                          onChange={() => {}} 
                          className="w-3 h-3 rounded text-blue-600 border-gray-300 focus:ring-blue-500" 
                        />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Save to inventory</span>
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <button 
                        type="button"
                        onClick={() => startEditingPrice(item)}
                        className="text-xs text-blue-600 dark:text-blue-500 font-black hover:underline cursor-pointer flex items-center gap-0.5"
                        title="Click to edit price"
                      >
                        ₹{item.price.toLocaleString()} {item.qty > 1 && <span className="text-[9px] text-slate-400 font-medium">x {item.qty} = ₹{(item.price * item.qty).toLocaleString()}</span>}
                      </button>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        +{item.gstRate !== undefined ? item.gstRate : 18}% GST
                      </span>
                    </div>
                  )}
                </div>

                {/* Direct Quantity Input + Incrementor */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-black/40 rounded-xl p-1 border border-slate-200 dark:border-white/5 shadow-xs">
                  <button 
                    type="button"
                    onClick={() => updateQty(item.id, -1)} 
                    className="w-6 h-6 flex items-center justify-center hover:text-blue-600 dark:hover:text-white text-slate-500 dark:text-gray-600 transition-colors cursor-pointer"
                  >
                    <Minus size={12} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => setDirectQty(item.id, parseInt(e.target.value, 10))}
                    className="text-xs font-black w-8 text-center bg-transparent border-none outline-none text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    title="Click to type quantity directly"
                  />
                  <button 
                    type="button"
                    onClick={() => updateQty(item.id, 1)} 
                    className="w-6 h-6 flex items-center justify-center hover:text-blue-600 dark:hover:text-white text-slate-500 dark:text-gray-600 transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={() => removeFromCart(item.id)} 
                  className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-gray-700 space-y-4 opacity-30 py-12 text-center">
              <ShoppingCart size={48} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Scan barcode or search to start</p>
            </div>
          )}
        </div>

        {/* Totals & Section 170 Round-off */}
        <div className="p-6 md:p-8 bg-slate-50 dark:bg-[#0D0D0D] border-t border-slate-200 dark:border-white/5 space-y-5">
          <div className="space-y-2.5">
             <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest">
                <span>Subtotal (Taxable)</span>
                <span className="text-slate-800 dark:text-gray-300 font-mono">₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
             </div>
             <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest">
                <span>Total GST</span>
                <span className="text-slate-800 dark:text-gray-300 font-mono">₹{totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
             </div>
             {roundOff !== 0 && (
               <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest">
                  <span>Round Off (Sec 170)</span>
                  <span className="text-slate-800 dark:text-gray-300 font-mono">
                    {roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}
                  </span>
               </div>
             )}
             <div className="flex justify-between text-2xl font-black text-slate-900 dark:text-white pt-3 border-t border-slate-200 dark:border-white/5">
                <span className="tracking-tight">Grand Total</span>
                <span className="text-blue-600 dark:text-blue-500 tracking-tight font-mono">₹{totalAmount.toLocaleString()}</span>
             </div>
          </div>

          <button 
            type="button"
            disabled={cart.length === 0 || loading}
            onClick={openCheckout}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-[0_20px_40px_rgba(37,99,235,0.25)] hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 uppercase tracking-widest cursor-pointer"
          >
            <CreditCard size={18} /> Checkout
          </button>
        </div>
      </div>

      {/* Barcode Camera Scanner Modal */}
      <BarcodeCameraModal
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScan={(code) => handleBarcodeScan(code)}
      />

      {/* Multi-Tender Settlement Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
             <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-[40px] w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl mx-4 text-slate-900 dark:text-white"
             >
               <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-[#111111]">
                  <div>
                    <h3 className="text-lg font-bold">Complete Settlement</h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      Customer: <strong className="text-slate-800 dark:text-gray-200">{selectedParty ? selectedParty.name : 'Walk-in Customer'}</strong>
                    </p>
                  </div>
                  <button type="button" onClick={() => { setShowCheckoutModal(false); setPaymentMethod(null); }} className="text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"><X size={24}/></button>
               </div>

               <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                  {/* Payable Amount Banner */}
                  <div className="text-center bg-slate-50 dark:bg-[#141414] p-5 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">Payable Amount (Section 170 Rounded)</p>
                    <p className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white font-mono">₹{totalAmount.toLocaleString()}</p>
                    {roundOff !== 0 && (
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 font-mono">
                        Sec 170 Round-off: {roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}
                      </p>
                    )}
                  </div>

                  {!paymentMethod ? (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-center text-slate-500 dark:text-gray-400 uppercase tracking-widest">Select Payment Tender</p>
                      
                      {/* Quick 1-Click Single Tender Modes */}
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          type="button"
                          onClick={() => setPaymentMethod('cash')}
                          className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-3xl gap-2 hover:bg-blue-600 hover:text-white group transition-all cursor-pointer shadow-xs"
                        >
                          <Banknote size={28} className="text-slate-500 dark:text-gray-400 group-hover:text-white" />
                          <span className="text-xs font-black uppercase tracking-wider group-hover:text-white">100% Cash</span>
                          <span className="text-[10px] text-slate-400 group-hover:text-blue-100">Single tender</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => setPaymentMethod('upi')}
                          className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-3xl gap-2 hover:bg-blue-600 hover:text-white group transition-all cursor-pointer shadow-xs"
                        >
                          <QrCode size={28} className="text-slate-500 dark:text-gray-400 group-hover:text-white" />
                          <span className="text-xs font-black uppercase tracking-wider group-hover:text-white">100% UPI QR</span>
                          <span className="text-[10px] text-slate-400 group-hover:text-blue-100">GPay, PhonePe, Paytm</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-3xl gap-2 hover:bg-blue-600 hover:text-white group transition-all cursor-pointer shadow-xs"
                        >
                          <CreditCard size={28} className="text-slate-500 dark:text-gray-400 group-hover:text-white" />
                          <span className="text-xs font-black uppercase tracking-wider group-hover:text-white">Card Swipe</span>
                          <span className="text-[10px] text-slate-400 group-hover:text-blue-100">Debit / Credit POS</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => {
                            if (!selectedParty) {
                              alert('Credit (Udhar) billing requires selecting a registered customer from the party list.');
                            } else {
                              setPaymentMethod('credit');
                            }
                          }}
                          className={`flex flex-col items-center justify-center p-5 rounded-3xl gap-2 transition-all cursor-pointer shadow-xs border ${
                            selectedParty 
                              ? 'bg-slate-50 dark:bg-[#111111] border-slate-200 dark:border-white/5 hover:bg-blue-600 hover:text-white group' 
                              : 'bg-slate-100/50 dark:bg-neutral-900/40 border-slate-200/50 dark:border-white/5 opacity-60'
                          }`}
                        >
                          <User size={28} className="text-slate-500 dark:text-gray-400 group-hover:text-white" />
                          <span className="text-xs font-black uppercase tracking-wider group-hover:text-white">Credit (Udhar)</span>
                          <span className="text-[10px] text-slate-400 group-hover:text-blue-100">
                            {selectedParty ? selectedParty.name : 'Requires Party'}
                          </span>
                        </button>
                      </div>

                      {/* Prominent Multi-Tender Split Button */}
                      <button 
                        type="button"
                        onClick={() => {
                          setPaymentMethod('split');
                          setSplitCash(totalAmount);
                          setSplitUpi(0);
                          setSplitCard(0);
                          setSplitCredit(0);
                        }}
                        className="w-full p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl flex items-center justify-between hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md active:scale-98 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                            <Layers size={20} />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-black uppercase tracking-wider">Multi-Tender Split Payment</p>
                            <p className="text-[10px] text-blue-100">Split across Cash, UPI, Card, and Credit</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl">Split Bill ↵</span>
                      </button>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      
                      {/* MODE 1: SINGLE CASH */}
                      {paymentMethod === 'cash' && (
                        <div className="space-y-4">
                          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-6 rounded-3xl text-center space-y-2">
                             <Banknote size={42} className="mx-auto text-emerald-600 dark:text-emerald-400" />
                             <p className="text-base font-bold text-slate-900 dark:text-white">Collect ₹{totalAmount.toLocaleString()} in Cash</p>
                             <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 font-medium">Verify tender currency notes before handover</p>
                          </div>
                        </div>
                      )}

                      {/* MODE 2: SINGLE UPI */}
                      {paymentMethod === 'upi' && (
                        <div className="flex flex-col items-center gap-4">
                           <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-200">
                              <LocalQRCode 
                                value={`upi://pay?pa=${settings?.upiId || 'merchant@upi'}&pn=${encodeURIComponent(settings?.businessName || 'Unidex ERP')}&am=${totalAmount}&cu=INR`}
                                size={190}
                              />
                           </div>
                           <div className="text-center">
                             <p className="text-sm font-bold mb-1">Scan with GPay, PhonePe, Paytm, BHIM</p>
                             <p className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest font-mono">
                               Pay to: {settings?.upiId || 'merchant@upi'} • Amount: ₹{totalAmount.toLocaleString()}
                             </p>
                           </div>
                        </div>
                      )}

                      {/* MODE 3: SINGLE CARD */}
                      {paymentMethod === 'card' && (
                        <div className="space-y-4 bg-slate-50 dark:bg-[#141414] p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                               <CreditCard size={20} />
                             </div>
                             <div>
                               <p className="text-sm font-bold">Swipe / Insert Card on POS Terminal</p>
                               <p className="text-xs text-slate-500 dark:text-gray-400">Total charge: ₹{totalAmount.toLocaleString()}</p>
                             </div>
                           </div>
                           <div>
                             <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Card Auth / Txn Reference (Optional)</label>
                             <input
                               type="text"
                               value={cardRef}
                               onChange={(e) => setCardRef(e.target.value)}
                               placeholder="e.g. Auth Code: 489281 or Last 4 digits"
                               className="w-full px-4 py-2.5 bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                             />
                           </div>
                        </div>
                      )}

                      {/* MODE 4: SINGLE CREDIT */}
                      {paymentMethod === 'credit' && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-6 rounded-3xl space-y-3">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                               <User size={20} />
                             </div>
                             <div>
                               <p className="text-sm font-bold">Charge Full Bill to Customer Khata</p>
                               <p className="text-xs text-amber-800 dark:text-amber-300">Customer: {selectedParty?.name}</p>
                             </div>
                           </div>
                           <div className="p-3 bg-white dark:bg-[#1A1A1A] rounded-2xl text-xs space-y-1">
                             <div className="flex justify-between text-slate-500 dark:text-gray-400">
                               <span>Current Balance:</span>
                               <span className="font-mono font-bold">₹{Number(selectedParty?.balance || 0).toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-100 dark:border-white/5 pt-1">
                               <span>New Balance after Invoice:</span>
                               <span className="font-mono text-red-500">₹{(Number(selectedParty?.balance || 0) + totalAmount).toLocaleString()}</span>
                             </div>
                           </div>
                        </div>
                      )}

                      {/* MODE 5: MULTI-TENDER SPLIT */}
                      {paymentMethod === 'split' && (
                        <div className="space-y-5">
                          {/* Split Tender Inputs */}
                          <div className="space-y-3">
                            
                            {/* Tender: CASH */}
                            <div className="p-3.5 bg-slate-50 dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-gray-200">
                                  <Banknote size={15} className="text-emerald-500" /> Cash Portion
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-bold text-slate-400">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={splitCash || ''}
                                    onChange={(e) => setSplitCash(Math.max(0, Number(e.target.value) || 0))}
                                    placeholder="0"
                                    className="w-24 text-right py-1 px-2 bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-xl font-mono font-bold text-sm outline-none focus:border-blue-500"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {[100, 500, 2000].map(amt => (
                                  <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setSplitCash(prev => prev + amt)}
                                    className="text-[10px] font-bold px-2 py-0.5 bg-white dark:bg-[#202020] border border-slate-200 dark:border-white/10 rounded-lg hover:border-blue-500 transition-colors text-slate-600 dark:text-gray-400"
                                  >
                                    +₹{amt}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => setSplitCash(remainingDue > 0 ? (splitCash + remainingDue) : totalAmount)}
                                  className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 rounded-lg"
                                >
                                  Remainder
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSplitCash(0)}
                                  className="text-[10px] text-slate-400 hover:text-red-500 px-1"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            {/* Tender: UPI */}
                            <div className="p-3.5 bg-slate-50 dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-gray-200">
                                  <QrCode size={15} className="text-blue-500" /> UPI QR Portion
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-bold text-slate-400">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={splitUpi || ''}
                                    onChange={(e) => setSplitUpi(Math.max(0, Number(e.target.value) || 0))}
                                    placeholder="0"
                                    className="w-24 text-right py-1 px-2 bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-xl font-mono font-bold text-sm outline-none focus:border-blue-500"
                                  />
                                </div>
                              </div>
                              {splitUpi > 0 && (
                                <div className="p-3 bg-white dark:bg-[#1A1A1A] rounded-xl flex items-center gap-3">
                                  <div className="bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                                    <LocalQRCode 
                                      value={`upi://pay?pa=${settings?.upiId || 'merchant@upi'}&pn=${encodeURIComponent(settings?.businessName || 'Unidex ERP')}&am=${splitUpi}&cu=INR`}
                                      size={64}
                                    />
                                  </div>
                                  <div className="text-[10px]">
                                    <p className="font-bold text-slate-800 dark:text-gray-200">Scan for exactly ₹{splitUpi.toLocaleString()}</p>
                                    <p className="text-slate-400 font-mono">Pay to: {settings?.upiId || 'merchant@upi'}</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Tender: CARD */}
                            <div className="p-3.5 bg-slate-50 dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-gray-200">
                                  <CreditCard size={15} className="text-indigo-500" /> Card Portion
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-bold text-slate-400">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={splitCard || ''}
                                    onChange={(e) => setSplitCard(Math.max(0, Number(e.target.value) || 0))}
                                    placeholder="0"
                                    className="w-24 text-right py-1 px-2 bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-xl font-mono font-bold text-sm outline-none focus:border-blue-500"
                                  />
                                </div>
                              </div>
                              {splitCard > 0 && (
                                <input
                                  type="text"
                                  value={cardRef}
                                  onChange={(e) => setCardRef(e.target.value)}
                                  placeholder="Card Auth / Last 4 digits (Optional)"
                                  className="w-full px-3 py-1.5 text-[11px] bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-lg outline-none"
                                />
                              )}
                            </div>

                            {/* Tender: CREDIT (UDHAR) */}
                            <div className="p-3.5 bg-slate-50 dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-gray-200">
                                  <User size={15} className="text-amber-500" /> Credit (Udhar) Portion
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-bold text-slate-400">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    disabled={!selectedParty}
                                    value={splitCredit || ''}
                                    onChange={(e) => setSplitCredit(Math.max(0, Number(e.target.value) || 0))}
                                    placeholder="0"
                                    className="w-24 text-right py-1 px-2 bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-xl font-mono font-bold text-sm outline-none focus:border-blue-500 disabled:opacity-40"
                                  />
                                </div>
                              </div>
                              {!selectedParty && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                  * Customer credit requires selecting a registered party.
                                </p>
                              )}
                            </div>

                          </div>

                          {/* Split Balance & Change Reconciliation Bar */}
                          <div className="p-4 bg-slate-100 dark:bg-[#161616] rounded-2xl space-y-1.5 text-xs">
                            <div className="flex justify-between font-bold text-slate-500 dark:text-gray-400">
                              <span>Total Bill Due:</span>
                              <span className="font-mono text-slate-900 dark:text-white">₹{totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-500 dark:text-gray-400">
                              <span>Total Tendered:</span>
                              <span className="font-mono text-blue-600 dark:text-blue-400">₹{totalTendered.toLocaleString()}</span>
                            </div>
                            {remainingDue > 0 && (
                              <div className="flex justify-between font-black text-amber-600 dark:text-amber-400 pt-1 border-t border-slate-200 dark:border-white/5">
                                <span>Remaining Unpaid:</span>
                                <span className="font-mono">₹{remainingDue.toFixed(2)}</span>
                              </div>
                            )}
                            {changeToReturn > 0 && (
                              <div className="flex justify-between font-black text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-white/5">
                                <span>Change to Return (Cash):</span>
                                <span className="font-mono text-sm">₹{changeToReturn.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Modal Action Buttons */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                        <button 
                          type="button"
                          onClick={() => setPaymentMethod(null)}
                          className="py-4 bg-slate-100 dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                        >
                          Change Tender (Esc)
                        </button>
                        <button 
                          type="button"
                          disabled={paymentMethod === 'split' && remainingDue > 0}
                          onClick={handleCheckout}
                          className="py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                        >
                          <CheckCircle2 size={16} /> Confirm Order (Enter)
                        </button>
                      </div>
                    </motion.div>
                  )}
               </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cash Drawer Shift Modal */}
      <CashDrawerModal
        isOpen={showDrawerModal}
        onClose={() => {
          setShowDrawerModal(false);
          fetchShift();
        }}
        onShiftStatusChange={(s) => setActiveShift(s)}
      />

      {/* Thermal Receipt & WhatsApp Modal */}
      {activeReceipt && (
        <ThermalReceiptModal 
          receipt={activeReceipt} 
          onClose={() => setActiveReceipt(null)} 
        />
      )}

      {/* Barcode Quick-Add Counter Modal */}
      <QuickAddProductModal
        isOpen={quickAddModalOpen}
        barcode={quickAddBarcode}
        initialData={quickAddInitialData}
        onClose={() => setQuickAddModalOpen(false)}
        onSuccess={(newProduct) => {
          fetchProducts();
          addToCart(newProduct);
        }}
      />

      {/* Scan Status Toast Notification */}
      <AnimatePresence>
        {scanNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-[260] px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold border backdrop-blur-md ${
              scanNotification.type === 'success' 
                ? 'bg-emerald-600 text-white border-emerald-400/40 shadow-emerald-900/30'
                : scanNotification.type === 'alert'
                ? 'bg-amber-600 text-white border-amber-400/40 shadow-amber-900/30'
                : 'bg-slate-900 dark:bg-slate-800 text-white border-white/10 shadow-black/40'
            }`}
          >
            <span>{scanNotification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

