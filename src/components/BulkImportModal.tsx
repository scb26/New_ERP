import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  UploadCloud, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow {
  row: number;
  name: string;
  barcode: string;
  hsnCode: string;
  gstRate: number;
  costPrice: number;
  sellPrice: number;
  mrp: number;
  stock: number;
  category: string;
  isValid: boolean;
  errors: string[];
}

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadTemplate = () => {
    const csvContent = `name,barcode,hsnCode,gstRate,costPrice,sellPrice,mrp,stock,category
"Samsung 25W Charger","8901234567800","8504",18,450,999,1299,25,"Electronics"
"Bluetooth Headphones","8901234567801","8518",18,800,1899,2499,15,"Electronics"
"Organic Green Tea 100g","8901234567802","0902",5,120,250,299,50,"Beverages"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'unidex_product_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Regex to split by comma ignoring commas inside quotes
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length < 2) continue;

      const obj: any = {};
      headers.forEach((h, index) => {
        obj[h] = values[index] || '';
      });

      const name = obj.name || values[0] || '';
      const barcode = obj.barcode || values[1] || '';
      const hsnCode = obj.hsnCode || values[2] || '';
      const gstRate = Number(obj.gstRate || values[3] || 18);
      const costPrice = Number(obj.costPrice || values[4] || 0);
      const sellPrice = Number(obj.sellPrice || values[5] || 0);
      const mrp = Number(obj.mrp || values[6] || sellPrice);
      const stock = Number(obj.stock || values[7] || 0);
      const category = obj.category || values[8] || 'General';

      const rowErrors: string[] = [];
      if (!name) rowErrors.push('Missing Name');
      if (isNaN(sellPrice) || sellPrice <= 0) rowErrors.push('Invalid Sell Price');
      if (costPrice > sellPrice && costPrice > 0) rowErrors.push('Cost > Sell Price');

      rows.push({
        row: i,
        name,
        barcode,
        hsnCode,
        gstRate,
        costPrice,
        sellPrice,
        mrp,
        stock,
        category,
        isValid: rowErrors.length === 0,
        errors: rowErrors
      });
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        setPreviewData(parsed);
      };
      reader.readAsText(selected);
    }
  };

  const handleImport = async () => {
    const validRows = previewData.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert("No valid product rows to import. Please check validation errors.");
      return;
    }

    setImporting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          products: validRows.map(r => ({
            name: r.name,
            barcode: r.barcode,
            hsnCode: r.hsnCode,
            gstRate: r.gstRate,
            costPrice: r.costPrice,
            sellPrice: r.sellPrice,
            mrp: r.mrp,
            stock: r.stock,
            category: r.category
          }))
        })
      });

      const data = await res.json();
      if (res.ok) {
        setResultMessage(`Imported ${data.importedCount} items successfully!`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        alert(data.error || 'Failed to import products');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error during bulk import: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const validCount = previewData.filter(r => r.isValid).length;
  const errorCount = previewData.filter(r => !r.isValid).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white dark:bg-[#0D0D0D] border border-slate-200 dark:border-white/10 rounded-[32px] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Import Product Catalog</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">Batch ingest products via CSV with ACID transaction & validation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            {/* Upload Area & Template Button */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center hover:border-blue-500/50 transition-colors flex flex-col items-center justify-center relative cursor-pointer bg-slate-50/50 dark:bg-white/[0.01]">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud size={32} className="text-blue-500 mb-2" />
                <p className="text-sm font-bold text-slate-800 dark:text-gray-200">
                  {file ? file.name : "Choose CSV File or Drag & Drop"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-gray-500 mt-1">Supports standard CSV format with headers</p>
              </div>

              <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-500/20 rounded-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Standard Format</h4>
                  <p className="text-[11px] text-slate-600 dark:text-gray-400">Download pre-configured CSV with sample data and column headers.</p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="mt-3 px-3 py-2 bg-white dark:bg-[#1A1A1A] border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-xs"
                >
                  <Download size={14} /> Download Template
                </button>
              </div>
            </div>

            {/* Validation Banner */}
            {previewData.length > 0 && (
              <div className="flex items-center justify-between p-3.5 bg-slate-100 dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-white/5 text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-900 dark:text-white">Total: {previewData.length}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={14} /> {validCount} Valid
                  </span>
                  {errorCount > 0 && (
                    <span className="text-red-500 font-bold flex items-center gap-1">
                      <AlertTriangle size={14} /> {errorCount} Invalid
                    </span>
                  )}
                </div>
                <span className="text-slate-400 text-[10px]">Invalid rows will be skipped during import</span>
              </div>
            )}

            {/* Preview Table */}
            {previewData.length > 0 && (
              <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-x-auto max-h-64 custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#1A1A1A] text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-white/10 sticky top-0">
                    <tr>
                      <th className="p-3">Status</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Barcode</th>
                      <th className="p-3">HSN</th>
                      <th className="p-3">GST%</th>
                      <th className="p-3">Cost (₹)</th>
                      <th className="p-3">Sell (₹)</th>
                      <th className="p-3">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                    {previewData.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={row.isValid ? 'hover:bg-slate-50 dark:hover:bg-white/[0.02]' : 'bg-red-500/5 hover:bg-red-500/10'}
                      >
                        <td className="p-3">
                          {row.isValid ? (
                            <span className="text-emerald-500 flex items-center gap-1 font-bold text-[10px]">
                              <CheckCircle2 size={12} /> Ready
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1 font-bold text-[10px]" title={row.errors.join(', ')}>
                              <AlertCircle size={12} /> {row.errors[0]}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-slate-800 dark:text-gray-200">{row.name || '—'}</td>
                        <td className="p-3 font-mono text-slate-500 dark:text-gray-400">{row.barcode || '—'}</td>
                        <td className="p-3 font-mono text-slate-500 dark:text-gray-400">{row.hsnCode || '—'}</td>
                        <td className="p-3">{row.gstRate}%</td>
                        <td className="p-3 text-red-500">₹{row.costPrice}</td>
                        <td className="p-3 font-bold text-blue-600 dark:text-blue-400">₹{row.sellPrice}</td>
                        <td className="p-3">{row.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {resultMessage && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> {resultMessage}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 dark:bg-[#111111] border-t border-slate-100 dark:border-white/5 flex items-center justify-between px-6 shrink-0">
            <span className="text-xs text-slate-500 dark:text-gray-400">
              {validCount > 0 ? `${validCount} items ready to ingest` : 'Select a valid CSV file'}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={validCount === 0 || importing}
                onClick={handleImport}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-900/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                {importing ? "Importing..." : "Confirm & Import Catalog"} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
