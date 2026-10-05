import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Camera, 
  Upload, 
  AlertCircle, 
  Sparkles, 
  Barcode, 
  Keyboard, 
  ArrowRight
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { playScanSuccessSound } from '../utils/audio';

interface BarcodeCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

const SAMPLE_TEST_BARCODES = [
  { name: 'Parle-G 250g', code: '8901719101037', tag: 'Offline Master' },
  { name: 'Amul Butter 500g', code: '8901262010125', tag: 'Store Stock' },
  { name: 'Maggi Noodles 70g', code: '8901058852331', tag: 'Store Stock' },
  { name: 'Dettol Liquid 550ml', code: '8901396321012', tag: 'Store Stock' },
  { name: 'Nutella 350g', code: '3017620422003', tag: 'Open Food Facts' },
];

export const BarcodeCameraModal: React.FC<BarcodeCameraModalProps> = ({
  isOpen,
  onClose,
  onScan
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize and start camera (Full canvas 100% field of view, no alignment bounding box required)
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const scannerId = "interactive-barcode-viewfinder";

    const startScanner = async () => {
      try {
        setCameraError(null);
        setCameraActive(false);

        // Allow DOM to settle
        await new Promise(res => setTimeout(res, 200));
        if (!isMounted) return;

        const container = document.getElementById(scannerId);
        if (!container) return;

        const html5QrCode = new Html5Qrcode(scannerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
          ],
          verbose: false
        });
        scannerRef.current = html5QrCode;

        // Omit qrbox to scan the full camera canvas without requiring exact box alignment
        const config = {
          fps: 20,
          aspectRatio: 1.333333,
          disableFlip: false
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (!isMounted) return;
            const clean = decodedText.trim();
            if (clean) {
              playScanSuccessSound();
              onScan(clean);
              onClose();
            }
          },
          () => {
            // Frame parse failure silently ignored
          }
        );

        if (isMounted) {
          setCameraActive(true);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn("Camera start exception:", err);
        setCameraError(
          err?.message?.includes('Permission') 
            ? "Camera permission denied. Please allow camera access in browser settings."
            : "No active webcam stream available. You can type the numbers printed below the barcode or upload an image."
        );
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          });
      }
    };
  }, [isOpen, onClose, onScan]);

  // Window escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle image upload scan
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = scannerRef.current || new Html5Qrcode("interactive-barcode-viewfinder", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE
        ],
        verbose: false
      });

      const decodedText = await html5QrCode.scanFile(file, true);
      const clean = decodedText.trim();
      if (clean) {
        playScanSuccessSound();
        onScan(clean);
        onClose();
      }
    } catch {
      alert("Could not detect a clear barcode in this photo. Please ensure good lighting or type the code.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCode.trim();
    if (clean.length >= 3) {
      onScan(clean);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
      >
        <motion.div 
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-white dark:bg-[#0E0E0E] border border-slate-200 dark:border-white/10 rounded-[36px] shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-white cursor-default"
        >
          {/* Header */}
          <div className="p-5 md:p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-[#141414]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Camera size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Omni Barcode Scanner
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Full-canvas auto-detection & manual digits entry
                </p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Direct Input for numbers printed below barcode */}
            <form onSubmit={handleManualSubmit} className="space-y-1.5 bg-blue-50/70 dark:bg-blue-950/20 p-3.5 rounded-2xl border border-blue-200/70 dark:border-blue-900/40">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Keyboard size={14} /> Type / Paste Number Below Barcode
                </label>
                <span className="text-[10px] text-slate-400 font-mono">e.g. 8901719101037</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Enter printed digits under barcode..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={manualCode.trim().length < 3}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/20 shrink-0"
                >
                  <ArrowRight size={14} /> Find & Add
                </button>
              </div>
            </form>

            {/* Camera Viewfinder Box (100% Full-Canvas Auto Detection) */}
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-inner">
              <div id="interactive-barcode-viewfinder" className="w-full h-full object-cover"></div>

              {/* Full-viewfinder Active Laser & Auto-Detection Status */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-black/75 px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      Auto-Scanning Entire Frame
                    </span>
                    <span className="text-[10px] font-bold text-white/80 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
                      No alignment needed
                    </span>
                  </div>
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-pulse"></div>
                  <div className="text-center">
                    <span className="text-[10px] text-white/70 bg-black/70 px-3 py-1 rounded-full backdrop-blur-xs">
                      Hold barcode anywhere in front of camera
                    </span>
                  </div>
                </div>
              )}

              {/* Error fallback if camera is blocked/unavailable */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3">
                  <AlertCircle size={36} className="text-amber-400" />
                  <p className="text-xs font-medium max-w-xs">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Upload size={14} /> Upload Barcode Image
                  </button>
                </div>
              )}
            </div>

            {/* Hidden File Upload for barcode photos */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload} 
            />

            {/* 1-Click Test Simulator for QA & Testing */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-gray-500 flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-500" /> 1-Click Test Barcodes (QA Verification)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_TEST_BARCODES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      onScan(item.code);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-slate-100 dark:bg-[#1E1E1E] hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/80 dark:border-white/5 transition-all text-slate-700 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer"
                    title={`Click to simulate scanning ${item.code}`}
                  >
                    <span className="font-bold">{item.name}</span>
                    <span className="text-[9px] font-mono opacity-60">({item.tag})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
