import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  History, 
  Clock, 
  FileText,
  Lock,
  Unlock,
  Coins,
  RefreshCw,
  IndianRupee
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export interface CashShift {
  id: string;
  userId: string;
  username: string;
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  cashSales: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  actualCash?: number | null;
  discrepancy?: number | null;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface DrawerTransaction {
  id: string;
  shiftId: string;
  type: 'CASH_IN' | 'CASH_OUT';
  amount: number;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export interface ZReportData {
  zReportNumber: string;
  generatedAt: string;
  shiftId: string;
  cashier: string;
  openedAt: string;
  closedAt: string;
  openingFloat: number;
  cashSales: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  actualCash: number;
  discrepancy: number;
  status: 'BALANCED' | 'OVERAGE' | 'SHORTAGE';
  nonCashSales: {
    upi: number;
    card: number;
    credit: number;
    totalNonCash: number;
  };
  grossSales: number;
  invoiceCount: number;
  notes?: string;
  denominations?: Record<string, number> | null;
}

interface CashDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftStatusChange?: (shift: CashShift | null) => void;
}

export const CashDrawerModal: React.FC<CashDrawerModalProps> = ({ isOpen, onClose, onShiftStatusChange }) => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'status' | 'petty-cash' | 'close-shift' | 'history'>('status');
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [transactions, setTransactions] = useState<DrawerTransaction[]>([]);
  const [historyShifts, setHistoryShifts] = useState<CashShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Open Shift Form State
  const [openFloat, setOpenFloat] = useState<string>('2000');
  const [openNotes, setOpenNotes] = useState<string>('');

  // Petty Cash Form State
  const [pettyType, setPettyType] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_OUT');
  const [pettyAmount, setPettyAmount] = useState<string>('');
  const [pettyReason, setPettyReason] = useState<string>('');

  // Close Shift & Denomination Counter State
  const [denominations, setDenominations] = useState<Record<string, number>>({
    '2000': 0,
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    '10': 0,
    'coins': 0
  });
  const [manualCountedCash, setManualCountedCash] = useState<string>('');
  const [useDenominations, setUseDenominations] = useState<boolean>(true);
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [activeZReport, setActiveZReport] = useState<ZReportData | null>(null);

  const zReportPrintRef = useRef<HTMLDivElement>(null);

  // Fetch Current Shift
  const fetchCurrentShift = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/shifts/current', { headers });
      if (!res.ok) throw new Error('Failed to load current shift');
      const data = await res.json();
      setCurrentShift(data.shift);
      setTransactions(data.transactions || []);
      if (onShiftStatusChange) {
        onShiftStatusChange(data.shift);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Past Shift History
  const fetchHistory = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/shifts/history', { headers });
      if (res.ok) {
        const data = await res.json();
        setHistoryShifts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCurrentShift();
      fetchHistory();
      setError(null);
      setSuccessMsg(null);
      setActiveZReport(null);
    }
  }, [isOpen]);

  // Denominations Total Calculation
  const denominationTotal = Object.entries(denominations).reduce((acc, [denom, count]) => {
    const val = denom === 'coins' ? 1 : Number(denom);
    return acc + val * (Number(count) || 0);
  }, 0);

  const countedCash = useDenominations ? denominationTotal : Number(manualCountedCash || 0);
  const expectedCash = currentShift ? currentShift.expectedCash : 0;
  const discrepancy = countedCash - expectedCash;

  // Handler: Open Shift
  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const floatAmt = Number(openFloat);
    if (isNaN(floatAmt) || floatAmt < 0) {
      setError('Please enter a valid non-negative opening float amount.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/shifts/open', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          openingFloat: floatAmt,
          notes: openNotes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to open shift');

      setSuccessMsg(`Cash register shift opened successfully with ₹${floatAmt.toLocaleString()} opening float!`);
      await fetchCurrentShift();
      setActiveTab('status');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Petty Cash (Cash In / Cash Out)
  const handlePettyCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) {
      setError('No active shift is open.');
      return;
    }
    const amt = Number(pettyAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }
    if (!pettyReason.trim()) {
      setError('Please provide a reason / category for this drawer transaction.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/shifts/petty-cash', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          shiftId: currentShift.id,
          type: pettyType,
          amount: amt,
          reason: pettyReason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record drawer transaction');

      setSuccessMsg(`${pettyType === 'CASH_IN' ? 'Cash In (₹' + amt + ')' : 'Cash Out (₹' + amt + ')'} recorded successfully!`);
      setPettyAmount('');
      setPettyReason('');
      await fetchCurrentShift();
      setActiveTab('status');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Close Shift & Z-Report
  const handleCloseShift = async () => {
    if (!currentShift) return;
    if (countedCash < 0 || isNaN(countedCash)) {
      setError('Please provide a valid counted cash total.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/shifts/close', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          shiftId: currentShift.id,
          actualCash: countedCash,
          notes: closingNotes,
          denominations: useDenominations ? denominations : null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to close shift');

      setActiveZReport(data.zReport);
      setSuccessMsg('Register shift reconciled and closed successfully!');
      await fetchCurrentShift();
      await fetchHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Print Z-Report
  const handlePrintZReport = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-[#0E0E0E] border border-slate-200 dark:border-white/10 rounded-[32px] w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl my-auto text-slate-900 dark:text-white"
      >
        {/* Header Bar */}
        <div className="p-5 md:p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              currentShift 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}>
              <Wallet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Cash Register & Drawer Management</h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  currentShift 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                }`}>
                  {currentShift ? 'REGISTER OPEN' : 'REGISTER CLOSED'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {currentShift 
                  ? `Shift #${currentShift.id} • Cashier: ${currentShift.username}` 
                  : 'No active shift open. Declare opening float to start billing.'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-white/5 px-6 gap-2 bg-slate-50/50 dark:bg-[#111111] shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => { setActiveTab('status'); setActiveZReport(null); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'status' 
                ? 'border-blue-600 text-blue-600 dark:text-white' 
                : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
            }`}
          >
            <Wallet size={15} /> Shift Status
          </button>
          {currentShift && (
            <>
              <button
                type="button"
                onClick={() => { setActiveTab('petty-cash'); setActiveZReport(null); }}
                className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'petty-cash' 
                    ? 'border-blue-600 text-blue-600 dark:text-white' 
                    : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
                }`}
              >
                <ArrowDownLeft size={15} /> Petty Cash (In/Out)
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('close-shift'); }}
                className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'close-shift' 
                    ? 'border-blue-600 text-blue-600 dark:text-white' 
                    : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
                }`}
              >
                <Lock size={15} /> Close Shift (Z-Report)
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => { setActiveTab('history'); setActiveZReport(null); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'history' 
                ? 'border-blue-600 text-blue-600 dark:text-white' 
                : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
            }`}
          >
            <History size={15} /> Shift History
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          
          {/* TAB 1: STATUS / OPEN REGISTER */}
          {activeTab === 'status' && (
            <div>
              {currentShift ? (
                <div className="space-y-6">
                  {/* Big KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-white/5 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-500">Opening Float</p>
                      <p className="text-xl font-black mt-1 font-mono text-slate-800 dark:text-white">₹{currentShift.openingFloat.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(currentShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/20 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">Cash Sales</p>
                      <p className="text-xl font-black mt-1 font-mono text-emerald-600 dark:text-emerald-400">+₹{currentShift.cashSales.toLocaleString()}</p>
                      <p className="text-[10px] text-emerald-700/60 dark:text-emerald-500/60 mt-1">From QuickBill bills</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-white/5 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-500">Petty In / Out</p>
                      <p className="text-sm font-bold mt-1 text-slate-700 dark:text-gray-300">
                        In: <span className="text-emerald-600 font-mono">+₹{currentShift.cashIn}</span>
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-gray-300">
                        Out: <span className="text-red-500 font-mono">-₹{currentShift.cashOut}</span>
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/30 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400">Expected in Drawer</p>
                      <p className="text-xl font-black mt-1 font-mono text-blue-600 dark:text-blue-400">₹{currentShift.expectedCash.toLocaleString()}</p>
                      <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-1">Float + Sales + Net</p>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('petty-cash')}
                      className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-[#1A1A1A] dark:hover:bg-[#222222] border border-slate-200 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <ArrowDownLeft size={16} /> Record Petty Cash (In / Out)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('close-shift')}
                      className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-900/20 transition-all cursor-pointer"
                    >
                      <Lock size={16} /> Reconcile & Close Shift
                    </button>
                  </div>

                  {/* Recent Drawer Transactions */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-3">Drawer Activity Log</h4>
                    {transactions.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-xs text-slate-400 dark:text-gray-500">
                        No manual petty cash transactions recorded yet for this shift.
                      </div>
                    ) : (
                      <div className="border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
                        {transactions.map(t => (
                          <div key={t.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-[#141414]">
                            <div className="flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                                t.type === 'CASH_IN' 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
                              }`}>
                                {t.type === 'CASH_IN' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 dark:text-gray-200">{t.reason}</p>
                                <p className="text-[10px] text-slate-400 dark:text-gray-500">
                                  {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • By {t.performedBy}
                                </p>
                              </div>
                            </div>
                            <span className={`font-mono font-bold text-sm ${
                              t.type === 'CASH_IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {t.type === 'CASH_IN' ? '+' : '-'}₹{t.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* OPEN REGISTER FORM */
                <form onSubmit={handleOpenShift} className="space-y-6 max-w-lg mx-auto py-4">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-3xl mx-auto flex items-center justify-center border border-blue-500/20">
                      <Unlock size={32} />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white">Start New Cash Register Shift</h4>
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      Declare the starting change (opening float) present in the physical drawer before initiating customer billing.
                    </p>
                  </div>

                  <div className="space-y-4 bg-slate-50 dark:bg-[#141414] p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                        Opening Float (Physical Cash in Drawer)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 font-bold">₹</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={openFloat}
                          onChange={(e) => setOpenFloat(e.target.value)}
                          placeholder="2000"
                          className="w-full pl-9 pr-4 py-3 bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-2xl text-base font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        {[500, 1000, 2000, 5000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setOpenFloat(String(amt))}
                            className="text-[10px] font-bold px-2.5 py-1 bg-white dark:bg-[#222222] border border-slate-200 dark:border-white/10 rounded-lg hover:border-blue-500 transition-colors text-slate-600 dark:text-gray-300"
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                        Shift Opening Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={openNotes}
                        onChange={(e) => setOpenNotes(e.target.value)}
                        placeholder="e.g., Morning Shift Counter 1"
                        className="w-full px-4 py-2.5 bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Unlock size={16} /> Open Register & Start Shift
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: PETTY CASH (IN / OUT) */}
          {activeTab === 'petty-cash' && currentShift && (
            <form onSubmit={handlePettyCash} className="space-y-6 max-w-lg mx-auto py-2">
              <div className="text-center">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Record Drawer Petty Cash</h4>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                  Log quick cash additions (change drops) or small expenses (tea, courier, packaging).
                </p>
              </div>

              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-[#161616] rounded-2xl">
                <button
                  type="button"
                  onClick={() => setPettyType('CASH_OUT')}
                  className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    pettyType === 'CASH_OUT'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowUpRight size={16} /> Cash Out (Expense / Payout)
                </button>
                <button
                  type="button"
                  onClick={() => setPettyType('CASH_IN')}
                  className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    pettyType === 'CASH_IN'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowDownLeft size={16} /> Cash In (Change / Float Add)
                </button>
              </div>

              <div className="space-y-4 bg-slate-50 dark:bg-[#141414] p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 font-bold">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={pettyAmount}
                      onChange={(e) => setPettyAmount(e.target.value)}
                      placeholder="e.g., 150"
                      className="w-full pl-9 pr-4 py-3 bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-2xl text-base font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                    Reason / Description
                  </label>
                  <input
                    type="text"
                    value={pettyReason}
                    onChange={(e) => setPettyReason(e.target.value)}
                    placeholder={pettyType === 'CASH_OUT' ? 'e.g., Tea & snacks for staff / Courier fee' : 'e.g., Added ₹500 change from safe'}
                    className="w-full px-4 py-3 bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    required
                  />
                  {pettyType === 'CASH_OUT' && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['Tea / Refreshment', 'Courier / Delivery', 'Packing Supplies', 'Cleaning', 'Vendor Payout'].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setPettyReason(cat)}
                          className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-[#202020] border border-slate-200 dark:border-white/10 rounded-lg hover:border-blue-500 transition-colors text-slate-600 dark:text-gray-400"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={16} /> Confirm {pettyType === 'CASH_IN' ? 'Cash In' : 'Cash Out'}
              </button>
            </form>
          )}

          {/* TAB 3: CLOSE SHIFT & Z-REPORT */}
          {activeTab === 'close-shift' && currentShift && (
            <div>
              {!activeZReport ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Day-End Shift Reconciliation</h4>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                      Count the physical cash in drawer. The system compares it with the expected cash balance to detect shortages or overages.
                    </p>
                  </div>

                  {/* Summary Comparison Header */}
                  <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/5 rounded-2xl text-center">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-500">Expected Cash</p>
                      <p className="text-lg font-black font-mono text-slate-800 dark:text-white mt-0.5">₹{expectedCash.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">Counted Cash</p>
                      <p className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5">₹{countedCash.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-500">Variance</p>
                      <p className={`text-lg font-black font-mono mt-0.5 ${
                        discrepancy === 0 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : discrepancy > 0 
                          ? 'text-blue-500' 
                          : 'text-red-500'
                      }`}>
                        {discrepancy === 0 ? '₹0.00 (Balanced)' : `${discrepancy > 0 ? '+₹' : '-₹'}${Math.abs(discrepancy).toLocaleString()}`}
                      </p>
                    </div>
                  </div>

                  {/* Mode Toggle: Denomination counter vs Direct entry */}
                  <div className="flex justify-between items-center text-xs px-1">
                    <span className="font-bold text-slate-700 dark:text-gray-300">Physical Cash Counting Method:</span>
                    <button
                      type="button"
                      onClick={() => setUseDenominations(!useDenominations)}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Coins size={14} /> {useDenominations ? 'Switch to Direct Amount' : 'Switch to Denomination Counter'}
                    </button>
                  </div>

                  {useDenominations ? (
                    /* Denomination Breakdown Counter */
                    <div className="bg-slate-50 dark:bg-[#141414] p-5 rounded-3xl border border-slate-200 dark:border-white/5 space-y-3">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-gray-500">
                        Currency Note Denominations Counter
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { key: '2000', label: '₹2,000 Notes' },
                          { key: '500', label: '₹500 Notes' },
                          { key: '200', label: '₹200 Notes' },
                          { key: '100', label: '₹100 Notes' },
                          { key: '50', label: '₹50 Notes' },
                          { key: '20', label: '₹20 Notes' },
                          { key: '10', label: '₹10 Notes' },
                          { key: 'coins', label: 'Coins (₹ Value)' },
                        ].map(({ key, label }) => (
                          <div key={key} className="bg-white dark:bg-[#1E1E1E] p-3 rounded-2xl border border-slate-200 dark:border-white/10">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 truncate mb-1">
                              {label}
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={denominations[key] || ''}
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                  setDenominations({ ...denominations, [key]: val });
                                }}
                                placeholder="0"
                                className="w-full text-right font-mono font-bold text-sm bg-transparent outline-none text-slate-900 dark:text-white"
                              />
                            </div>
                            <p className="text-[10px] text-right font-mono text-slate-400 dark:text-gray-500 mt-1 border-t border-slate-100 dark:border-white/5 pt-1">
                              = ₹{((key === 'coins' ? 1 : Number(key)) * (denominations[key] || 0)).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Direct Cash Amount Input */
                    <div className="bg-slate-50 dark:bg-[#141414] p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                        Total Physical Cash Counted (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 font-bold">₹</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={manualCountedCash}
                          onChange={(e) => setManualCountedCash(e.target.value)}
                          placeholder="e.g. 5240"
                          className="w-full pl-9 pr-4 py-3 bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-2xl text-base font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Closing Notes */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
                      Closing Handover Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={closingNotes}
                      onChange={(e) => setClosingNotes(e.target.value)}
                      placeholder="e.g. Shortage of ₹20 explained by cashier - tea vendor coins"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Close & Generate Z-Report Action */}
                  <button
                    type="button"
                    onClick={handleCloseShift}
                    disabled={loading}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-red-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Lock size={16} /> Reconcile Cash & Generate Printable Z-Report
                  </button>
                </div>
              ) : (
                /* Z-REPORT GENERATED MODAL VIEW */
                <div className="space-y-6">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl text-center">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      ✓ Register Shift #{activeZReport.shiftId} successfully closed! Z-Report Generated.
                    </p>
                  </div>

                  {/* Printable 80mm ESC/POS Thermal Slip Simulation */}
                  <div className="flex justify-center">
                    <div 
                      ref={zReportPrintRef}
                      className="bg-white text-black font-mono p-5 rounded-2xl shadow-md border border-gray-300 w-[300px] text-[10px] space-y-2"
                    >
                      <div className="text-center border-b border-dashed border-black pb-2 space-y-0.5">
                        <h3 className="text-sm font-black uppercase">DAY-END Z-REPORT</h3>
                        <p className="text-[9px] uppercase font-bold text-gray-700">Unidex ERP Retail System</p>
                        <p className="text-[8px] text-gray-600">{new Date(activeZReport.generatedAt).toLocaleString()}</p>
                      </div>

                      <div className="border-b border-dashed border-black pb-2 space-y-0.5 text-[9px]">
                        <div className="flex justify-between">
                          <span>Report Ref:</span>
                          <span className="font-bold">{activeZReport.zReportNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cashier:</span>
                          <span className="font-bold">{activeZReport.cashier}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shift Opened:</span>
                          <span>{new Date(activeZReport.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shift Closed:</span>
                          <span>{new Date(activeZReport.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Invoices Billed:</span>
                          <span className="font-bold">{activeZReport.invoiceCount}</span>
                        </div>
                      </div>

                      <div className="border-b border-dashed border-black pb-2 space-y-1">
                        <p className="font-bold uppercase text-[9px]">Sales by Tender:</p>
                        <div className="flex justify-between pl-2">
                          <span>• Cash Sales:</span>
                          <span>₹{activeZReport.cashSales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span>• UPI Sales:</span>
                          <span>₹{activeZReport.nonCashSales.upi.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span>• Card Sales:</span>
                          <span>₹{activeZReport.nonCashSales.card.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span>• Credit (Khata):</span>
                          <span>₹{activeZReport.nonCashSales.credit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-black border-t border-black pt-1">
                          <span>GROSS TURNOVER:</span>
                          <span>₹{activeZReport.grossSales.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="border-b border-dashed border-black pb-2 space-y-1">
                        <p className="font-bold uppercase text-[9px]">Cash Drawer Reconciliation:</p>
                        <div className="flex justify-between">
                          <span>Opening Float:</span>
                          <span>₹{activeZReport.openingFloat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>(+) Cash Sales:</span>
                          <span>₹{activeZReport.cashSales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>(+) Cash In:</span>
                          <span>₹{activeZReport.cashIn.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>(-) Cash Out:</span>
                          <span>₹{activeZReport.cashOut.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-black pt-1">
                          <span>EXPECTED CASH:</span>
                          <span>₹{activeZReport.expectedCash.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-black text-xs pt-0.5">
                          <span>COUNTED CASH:</span>
                          <span>₹{activeZReport.actualCash.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-black pt-1 border-t border-black text-[9px]">
                          <span>DISCREPANCY:</span>
                          <span className={activeZReport.discrepancy === 0 ? 'text-black' : activeZReport.discrepancy > 0 ? 'text-blue-700' : 'text-red-700'}>
                            {activeZReport.discrepancy === 0 ? '₹0.00 (BALANCED)' : `${activeZReport.discrepancy > 0 ? '+₹' : '-₹'}${Math.abs(activeZReport.discrepancy).toFixed(2)} (${activeZReport.status})`}
                          </span>
                        </div>
                      </div>

                      {activeZReport.notes && (
                        <div className="border-b border-dashed border-black pb-1 text-[8px] text-gray-700">
                          <p><strong>Note:</strong> {activeZReport.notes}</p>
                        </div>
                      )}

                      <div className="text-center pt-2 space-y-0.5 text-[8px] text-gray-600">
                        <p>--- END OF Z-REPORT ---</p>
                        <p>Printed from Unidex ERP</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handlePrintZReport}
                      className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-900/20"
                    >
                      <Printer size={16} /> Print Z-Report Slip
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveZReport(null); setActiveTab('status'); }}
                      className="py-3 px-5 bg-slate-100 dark:bg-[#1E1E1E] text-slate-700 dark:text-gray-300 font-bold text-xs rounded-2xl hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SHIFT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-gray-500">
                  Closed Register Shifts Archive
                </h4>
                <button
                  type="button"
                  onClick={fetchHistory}
                  className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors cursor-pointer"
                  title="Refresh history"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {historyShifts.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-xs text-slate-400 dark:text-gray-500">
                  No shifts recorded yet.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
                  {historyShifts.map(s => (
                    <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-[#141414]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{s.id}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            s.status === 'OPEN'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-gray-300'
                          }`}>
                            {s.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1">
                          Cashier: <strong className="text-slate-700 dark:text-gray-300">{s.username}</strong> • 
                          Opened: {new Date(s.openedAt).toLocaleDateString()} {new Date(s.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {s.closedAt && ` • Closed: ${new Date(s.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Expected</p>
                          <p className="font-mono font-bold text-slate-700 dark:text-gray-300">₹{s.expectedCash.toLocaleString()}</p>
                        </div>
                        {s.actualCash !== null && (
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Counted</p>
                            <p className="font-mono font-bold text-blue-600 dark:text-blue-400">₹{s.actualCash.toLocaleString()}</p>
                          </div>
                        )}
                        {s.discrepancy !== null && (
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Variance</p>
                            <p className={`font-mono font-black ${
                              s.discrepancy === 0 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : s.discrepancy > 0 
                                ? 'text-blue-500' 
                                : 'text-red-500'
                            }`}>
                              {s.discrepancy === 0 ? 'Balanced' : `${s.discrepancy > 0 ? '+₹' : '-₹'}${Math.abs(s.discrepancy).toLocaleString()}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default CashDrawerModal;
