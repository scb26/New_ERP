import React, { useState } from 'react';
import { Printer, Share2, X, Check, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

export interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  hsnCode?: string;
  gstRate?: number;
}

export interface ReceiptData {
  invoiceId: string;
  date: string;
  customerName?: string;
  customerPhone?: string;
  items: ReceiptItem[];
  subtotal: number;
  totalTax: number;
  roundOff?: number;
  totalAmount: number;
  paymentMethod?: string;
  gstType?: string;
  business?: {
    name?: string;
    address?: string;
    gstNumber?: string;
    phone?: string;
    upiId?: string;
  };
}

interface ThermalReceiptModalProps {
  receipt: ReceiptData;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ receipt, onClose }) => {
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [copied, setCopied] = useState(false);

  const businessName = receipt.business?.name || 'UNIDEX ERP';
  const businessAddress = receipt.business?.address || '123 Business Park, Tech City';
  const businessGst = receipt.business?.gstNumber || '22AAAAA0000A1Z5';
  const businessPhone = receipt.business?.phone || '';

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppMessage = () => {
    const itemLines = receipt.items.map((i, idx) => {
      const itemTaxRate = i.gstRate !== undefined ? i.gstRate : 18;
      const itemGst = (i.price * i.qty * itemTaxRate) / 100;
      const itemTotal = i.price * i.qty + itemGst;
      return `${idx + 1}. *${i.name}*\n   Qty: ${i.qty} x ₹${i.price} (GST ${itemTaxRate}%: ₹${itemGst.toFixed(2)}) = *₹${itemTotal.toFixed(2)}*`;
    }).join('\n\n');

    const roundOffLine = receipt.roundOff ? `*Round Off (Sec 170):* ${receipt.roundOff > 0 ? '+' : ''}₹${receipt.roundOff.toFixed(2)}\n` : '';

    return `🧾 *TAX INVOICE - ${businessName}*\n` +
      `────────────────────────\n` +
      `*Invoice No:* ${receipt.invoiceId}\n` +
      `*Date:* ${new Date(receipt.date).toLocaleString()}\n` +
      `*Customer:* ${receipt.customerName || 'Walk-in Customer'}\n` +
      (businessGst ? `*GSTIN:* ${businessGst}\n` : '') +
      `────────────────────────\n` +
      `*ITEMS PURCHASED:*\n${itemLines}\n` +
      `────────────────────────\n` +
      `*Subtotal:* ₹${receipt.subtotal.toFixed(2)}\n` +
      `*Total GST:* ₹${receipt.totalTax.toFixed(2)}\n` +
      roundOffLine +
      `*Grand Total:* ₹${receipt.totalAmount.toFixed(2)}\n` +
      `*Payment:* ${(receipt.paymentMethod || 'Paid').toUpperCase()}\n` +
      `────────────────────────\n` +
      `_Thank you for your business!_`;
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getWhatsAppMessage());
    const phone = (receipt.customerPhone || '').replace(/\D/g, '');
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(getWhatsAppMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-[28px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto"
      >
        {/* Modal Controls Header */}
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-4 bg-slate-50 dark:bg-[#161616]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider">Width:</span>
            <div className="flex bg-slate-200 dark:bg-black/50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  paperWidth === '80mm'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  paperWidth === '58mm'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                58mm
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Thermal Receipt Preview Area */}
        <div className="p-6 overflow-y-auto max-h-[60vh] flex justify-center bg-slate-200 dark:bg-black/80 custom-scrollbar">
          <div
            id="thermal-receipt-print-area"
            style={{ width: paperWidth === '80mm' ? '320px' : '230px' }}
            className="bg-white text-black p-4 font-mono text-[11px] leading-tight shadow-lg transition-all select-text border border-slate-300"
          >
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-black">
              <h2 className="text-sm font-black uppercase tracking-wider">{businessName}</h2>
              {businessAddress && <p className="text-[10px] mt-0.5">{businessAddress}</p>}
              {businessPhone && <p className="text-[10px]">Ph: {businessPhone}</p>}
              {businessGst && <p className="text-[10px] font-bold">GSTIN: {businessGst}</p>}
              <p className="text-[9px] uppercase tracking-widest mt-1 font-bold">TAX INVOICE</p>
            </div>

            {/* Meta */}
            <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Inv: #{receipt.invoiceId}</span>
                <span>{new Date(receipt.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cust: {receipt.customerName || 'Walk-in'}</span>
                <span>{new Date(receipt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-black">
              <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-black">
                <span>Item [GST%]</span>
                <span className="text-right">Total (₹)</span>
              </div>
              <div className="divide-y divide-dotted divide-gray-300 pt-1">
                {receipt.items.map((item, index) => {
                  const rate = item.gstRate !== undefined ? item.gstRate : 18;
                  const itemTax = (item.price * item.qty * rate) / 100;
                  const itemTot = item.price * item.qty + itemTax;
                  return (
                    <div key={index} className="py-1">
                      <div className="flex justify-between font-bold">
                        <span className="truncate pr-1">{item.name}</span>
                        <span>₹{itemTot.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-600">
                        <span>
                          {item.qty} x ₹{item.price} {item.hsnCode ? `[HSN:${item.hsnCode}]` : ''}
                        </span>
                        <span>+{rate}% GST (₹{itemTax.toFixed(2)})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals Calculation */}
            <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Taxable Value:</span>
                <span>₹{receipt.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total GST:</span>
                <span>₹{receipt.totalTax.toFixed(2)}</span>
              </div>
              {receipt.roundOff !== undefined && receipt.roundOff !== 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Round Off (Sec 170):</span>
                  <span>{receipt.roundOff > 0 ? '+' : ''}₹{receipt.roundOff.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-black pt-1 border-t border-black">
                <span>GRAND TOTAL:</span>
                <span>₹{receipt.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[9px] text-gray-600 pt-0.5">
                <span>Payment Mode:</span>
                <span className="uppercase font-bold">{receipt.paymentMethod || 'CASH / UPI'}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[9px] space-y-0.5">
              <p className="font-bold">Thank you for visiting!</p>
              <p className="text-[8px] text-gray-500">Goods once sold will not be taken back</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 md:p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#161616] flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-900/20 active:scale-95 transition-all cursor-pointer"
          >
            <Printer size={16} /> Print Thermal Slip
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer"
          >
            <MessageSquare size={16} /> Share on WhatsApp
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="py-3 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-[#222222] dark:hover:bg-[#2a2a2a] text-slate-800 dark:text-gray-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Copy invoice text to clipboard"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ThermalReceiptModal;
