import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  MessageCircle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  QrCode,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LedgerModalProps {
  partyId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

interface LedgerEntry {
  id: string;
  date: string;
  type: string;
  referenceId: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  paymentMode: string;
  notes: string;
}

export default function LedgerModal({ partyId, isOpen, onClose, onRefresh }: LedgerModalProps) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState<{ party: any; entries: LedgerEntry[] } | null>(null);
  
  // Payment settlement state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Settings for UPI link
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    if (partyId && isOpen) {
      loadLedger();
      fetch('/api/settings')
        .then(res => res.json())
        .then(setSettings)
        .catch(() => {});
    }
  }, [partyId, isOpen]);

  const loadLedger = async () => {
    if (!partyId) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/parties/${partyId}/ledger`, { headers });
      if (res.ok) {
        const data = await res.json();
        setLedgerData(data);
        if (data.party) {
          setPaymentAmount(Math.abs(data.party.balance));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !partyId) return null;

  const party = ledgerData?.party;
  const entries = ledgerData?.entries || [];
  const isCustomer = party?.type === 'customer';
  const balance = party?.balance || 0;

  const handleRecordPayment = async () => {
    if (paymentAmount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    setSubmittingPayment(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/parties/${partyId}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: paymentAmount,
          paymentMode,
          notes: paymentNotes
        })
      });

      if (res.ok) {
        setShowPaymentModal(false);
        setPaymentNotes('');
        await loadLedger();
        if (onRefresh) onRefresh();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to record payment');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const sendWhatsAppReminder = () => {
    if (!party) return;
    const phone = (party.phone || '').replace(/\D/g, '');
    const upiId = settings?.upiId || 'merchant@upi';
    const bizName = settings?.businessName || 'Unidex ERP';

    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(bizName)}&am=${balance}&cu=INR`;
    const message = `Hello ${party.name},\nThis is a friendly payment reminder from ${bizName}. Your pending balance is ₹${balance.toLocaleString()}.\n\nYou can pay quickly using this UPI link:\n${upiLink}\n\nThank you for your business!`;

    const waUrl = phone 
      ? `https://wa.me/91${phone.slice(-10)}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white dark:bg-[#0D0D0D] border border-slate-200 dark:border-white/10 rounded-[32px] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <BookOpen size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{party?.name || 'Party Khata'}</h3>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isCustomer ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'
                  }`}>
                    {party?.type || 'Party'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-gray-400">Statement Passbook & Running Balance</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isCustomer && balance > 0 && (
                <button
                  onClick={sendWhatsAppReminder}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Send WhatsApp payment link"
                >
                  <MessageCircle size={14} /> WhatsApp Reminder
                </button>
              )}

              <button
                onClick={() => {
                  setPaymentAmount(Math.abs(balance));
                  setShowPaymentModal(true);
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <CreditCard size={14} /> Record Payment
              </button>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Balance Overview Bar */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-white/5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/30 p-4 text-center shrink-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Contact</p>
              <p className="text-xs font-mono font-bold text-slate-800 dark:text-gray-200 mt-0.5">{party?.phone || 'No phone'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Net Position</p>
              <p className={`text-sm font-black mt-0.5 ${balance > 0 ? 'text-amber-500' : balance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {balance > 0 ? `Receivable: ₹${balance.toLocaleString()}` : balance < 0 ? `Payable: ₹${Math.abs(balance).toLocaleString()}` : 'Settled (₹0)'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Total Entries</p>
              <p className="text-xs font-mono font-bold text-slate-800 dark:text-gray-200 mt-0.5">{entries.length} Transactions</p>
            </div>
          </div>

          {/* Statement Passbook Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {loading ? (
              <div className="py-20 text-center text-slate-400">Loading ledger statement...</div>
            ) : entries.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <Clock size={36} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm font-bold">No ledger transactions found</p>
                <p className="text-xs text-slate-500 mt-1">Invoices and settlements for this party will appear here.</p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#161616] text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="p-3.5">Date & Time</th>
                      <th className="p-3.5">Transaction Details</th>
                      <th className="p-3.5">Mode</th>
                      <th className="p-3.5 text-right">Debit (₹)</th>
                      <th className="p-3.5 text-right">Credit (₹)</th>
                      <th className="p-3.5 text-right">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="p-3.5 whitespace-nowrap text-slate-500 dark:text-gray-400 text-[11px] font-mono">
                          {new Date(entry.date).toLocaleDateString()} {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900 dark:text-white">{entry.description}</p>
                          <p className="text-[10px] text-slate-400 dark:text-gray-500 font-mono">Ref: {entry.referenceId}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1A1A1A] text-[10px] font-mono uppercase font-bold text-slate-600 dark:text-gray-400">
                            {entry.paymentMode || 'Credit'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-slate-900 dark:text-white">
                          ₹{entry.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment Modal */}
          {showPaymentModal && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Record Settlement Payment</h4>
                  <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlement Amount (₹)</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full mt-1 bg-slate-50 dark:bg-[#1C1C1C] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-mono font-bold text-base text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full mt-1 bg-slate-50 dark:bg-[#1C1C1C] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="cash">Cash Settlement</option>
                      <option value="upi">UPI / QR Transfer</option>
                      <option value="bank_transfer">IMPS / NEFT Bank Transfer</option>
                      <option value="cheque">Cheque Clearing</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes / Reference (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR / Cheque No / Cash receipt"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full mt-1 bg-slate-50 dark:bg-[#1C1C1C] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={submittingPayment || paymentAmount <= 0}
                    onClick={handleRecordPayment}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-900/30"
                  >
                    {submittingPayment ? "Recording..." : "Confirm Payment"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
