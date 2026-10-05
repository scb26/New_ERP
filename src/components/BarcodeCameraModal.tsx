import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Camera, 
  Upload, 
  AlertCircle, 
  Sparkles, 
  Barcode, 
  Keyboard, 
  ArrowRight,
  SwitchCamera,
  CheckCircle2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { playScanSuccessSound } from '../utils/audio';

// --- GS1 Checksum Utilities ---

export function isValidEan13Checksum(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(code[12], 10);
}

export function isValidUpcAChecksum(code: string): boolean {
  if (!/^\d{12}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(code[i], 10);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(code[11], 10);
}

export function isValidEan8Checksum(code: string): boolean {
  if (!/^\d{8}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(code[i], 10);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(code[7], 10);
}

interface BarcodeCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

interface CameraDevice {
  id: string;
  label: string;
}

const SAMPLE_TEST_BARCODES = [
  { name: 'Parle-G 250g', code: '8901719101037', tag: 'Offline Master' },
  { name: 'Amul Butter 500g', code: '8901262010125', tag: 'Store Stock' },
  { name: 'Maggi Noodles 70g', code: '8901058852331', tag: 'Store Stock' },
  { name: 'Dettol Liquid 550ml', code: '8901396321012', tag: 'Store Stock' },
  { name: 'Nutella 350g', code: '3017620422003', tag: 'Open Food Facts' },
];

// Unique IDs for viewfinders to avoid conflicts
const NATIVE_VIDEO_ID = 'barcode-native-video';
const H5Q_CONTAINER_ID = 'barcode-h5q-container';

export const BarcodeCameraModal: React.FC<BarcodeCameraModalProps> = ({
  isOpen,
  onClose,
  onScan
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [engineLabel, setEngineLabel] = useState<string>('Initializing...');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [detectionSuccess, setDetectionSuccess] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null!);
  const isStoppingRef = useRef(false);
  const scanLockRef = useRef(false);
  const engineModeRef = useRef<'native' | 'html5' | 'none'>('none');

  // ─── CLEANUP ───────────────────────────────────────────────────────────────
  const stopAllStreams = useCallback(async () => {
    isStoppingRef.current = true;

    // Cancel native RAF loop
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Stop raw MediaStream
    if (currentStreamRef.current) {
      currentStreamRef.current.getTracks().forEach(t => { try { t.stop(); } catch {} });
      currentStreamRef.current = null;
    }

    // Detach video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Stop Html5Qrcode
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch {}
      try { html5QrCodeRef.current.clear(); } catch {}
      html5QrCodeRef.current = null;
    }

    engineModeRef.current = 'none';
    setCameraActive(false);
    setHasTorch(false);
    setTorchOn(false);
    isStoppingRef.current = false;
  }, []);

  // ─── SCAN SUCCESS ──────────────────────────────────────────────────────────
  const triggerScanSuccess = useCallback((barcode: string) => {
    if (scanLockRef.current) return;
    scanLockRef.current = true;

    setDetectionSuccess(true);
    playScanSuccessSound();

    setTimeout(() => {
      onScan(barcode);
      onClose();
    }, 300);
  }, [onScan, onClose]);

  // ─── CAMERA ENUMERATION ───────────────────────────────────────────────────
  const enumerateCameras = useCallback(async (): Promise<CameraDevice[]> => {
    try {
      const allDevs = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = allDevs.filter(d => d.kind === 'videoinput');
      const valid = videoDevs.filter(d => {
        const lbl = (d.label || '').toLowerCase();
        return !lbl.includes('ir camera') &&
               !lbl.includes('infrared') &&
               !lbl.includes('hello face') &&
               !lbl.includes('depth');
      });
      const list: CameraDevice[] = (valid.length > 0 ? valid : videoDevs).map((d, i) => ({
        id: d.deviceId,
        label: d.label || `Camera ${i + 1}`
      }));
      setDevices(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  // ─── TORCH ────────────────────────────────────────────────────────────────
  const toggleTorch = async () => {
    if (!currentStreamRef.current) return;
    const track = currentStreamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const next = !torchOn;
      await (track as any).applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {}
  };

  // ─── ENGINE A: Native BarcodeDetector + raw video stream ──────────────────
  const startNativeEngine = async (deviceId?: string): Promise<boolean> => {
    if (typeof window === 'undefined' || !('BarcodeDetector' in window)) {
      console.log('[Scanner] BarcodeDetector not available');
      return false;
    }

    try {
      // Get supported formats
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      let supportedFormats: string[] = [];
      try {
        supportedFormats = await BarcodeDetectorClass.getSupportedFormats();
      } catch {}

      const desired = ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code', 'itf', 'codabar'];
      const formats = supportedFormats.length > 0
        ? desired.filter(f => supportedFormats.includes(f))
        : desired;

      console.log('[Scanner] BarcodeDetector formats:', formats);

      const detector = new BarcodeDetectorClass({ formats: formats.length > 0 ? formats : undefined });

      // Build camera constraints - permissive to avoid OverconstrainedError
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };

      console.log('[Scanner] Requesting getUserMedia...', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      currentStreamRef.current = stream;
      console.log('[Scanner] Got stream, tracks:', stream.getVideoTracks().length);

      // Try to enable continuous autofocus/exposure
      try {
        const track = stream.getVideoTracks()[0];
        if (track?.applyConstraints) {
          await track.applyConstraints({ advanced: [{ focusMode: 'continuous', exposureMode: 'continuous' } as any] }).catch(() => {});
        }
        // Check torch capability
        const caps = (track as any).getCapabilities?.() || {};
        setHasTorch(!!caps.torch);
      } catch {}

      // Attach to video element
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach(t => t.stop());
        return false;
      }

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        const onReady = () => {
          video.removeEventListener('loadeddata', onReady);
          resolve();
        };
        video.addEventListener('loadeddata', onReady);
        video.play().catch(err => {
          console.warn('[Scanner] play() failed:', err);
          resolve();
        });
      });

      console.log('[Scanner] Video ready. videoWidth:', video.videoWidth, 'videoHeight:', video.videoHeight, 'readyState:', video.readyState);

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        // Video didn't initialize properly - might happen on some browsers
        // Wait a bit more
        await new Promise(r => setTimeout(r, 500));
        console.log('[Scanner] After wait - videoWidth:', video.videoWidth, 'videoHeight:', video.videoHeight);
      }

      setCameraActive(true);
      setEngineLabel('Native GPU · BarcodeDetector');
      engineModeRef.current = 'native';
      setCameraError(null);

      // RAF detection loop
      let lastDetectTime = 0;
      let detecting = false;
      let frameCount = 0;

      const loop = async () => {
        if (isStoppingRef.current || scanLockRef.current) return;

        const now = performance.now();
        frameCount++;

        // Attempt detection at most every 40ms (~25 fps detection rate)
        if (!detecting && (now - lastDetectTime) >= 40) {
          detecting = true;
          lastDetectTime = now;

          try {
            if (video.readyState >= 2 && video.videoWidth > 0) {
              const results = await detector.detect(video);
              if (results && results.length > 0) {
                const val = results[0].rawValue?.trim();
                console.log('[Scanner] ✅ Detected barcode:', val, 'format:', results[0].format);
                if (val) {
                  triggerScanSuccess(val);
                  return;
                }
              }
              // Log every 100 frames to confirm loop is alive
              if (frameCount % 100 === 0) {
                console.log(`[Scanner] Loop alive - frame ${frameCount}, readyState: ${video.readyState}, size: ${video.videoWidth}x${video.videoHeight}`);
              }
            } else {
              if (frameCount % 50 === 0) {
                console.warn(`[Scanner] Video not ready - readyState: ${video.readyState}, size: ${video.videoWidth}x${video.videoHeight}`);
              }
            }
          } catch (err) {
            console.warn('[Scanner] detect() error:', err);
          } finally {
            detecting = false;
          }
        }

        if (!isStoppingRef.current && !scanLockRef.current) {
          rafRef.current = requestAnimationFrame(loop);
        }
      };

      rafRef.current = requestAnimationFrame(loop);
      return true;
    } catch (err: any) {
      console.error('[Scanner] Native engine failed:', err?.name, err?.message);
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(t => t.stop());
        currentStreamRef.current = null;
      }
      return false;
    }
  };

  // ─── ENGINE B: Html5Qrcode fallback (attaches to the fallback div) ─────────
  const startHtml5Engine = async (deviceId?: string): Promise<boolean> => {
    try {
      const container = document.getElementById(H5Q_CONTAINER_ID);
      if (!container) {
        console.error('[Scanner] H5Q container not found in DOM!');
        return false;
      }

      console.log('[Scanner] Starting Html5Qrcode engine...');

      const h5q = new Html5Qrcode(H5Q_CONTAINER_ID, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
        useBarCodeDetectorIfSupported: true,
      });
      html5QrCodeRef.current = h5q;

      const camConfig = deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: 'environment' };

      await h5q.start(
        camConfig,
        { fps: 20, disableFlip: false },
        (decodedText) => {
          if (scanLockRef.current) return;
          const val = decodedText?.trim();
          console.log('[Scanner] ✅ Html5Qrcode decoded:', val);
          if (val) triggerScanSuccess(val);
        },
        () => { /* ignore per-frame errors */ }
      );

      setCameraActive(true);
      setEngineLabel('Html5Qrcode · Wasm');
      engineModeRef.current = 'html5';
      setCameraError(null);
      console.log('[Scanner] Html5Qrcode started');
      return true;
    } catch (err: any) {
      console.error('[Scanner] Html5Qrcode failed:', err?.name, err?.message);
      return false;
    }
  };

  // ─── BOOT: Try Native → Fallback to Html5Qrcode ───────────────────────────
  const bootScanner = useCallback(async (deviceId?: string) => {
    console.log('[Scanner] bootScanner called, deviceId:', deviceId);
    await stopAllStreams();
    scanLockRef.current = false;
    setDetectionSuccess(false);
    setCameraError(null);
    setEngineLabel('Starting camera...');

    // Populate camera list first (needed for getUserMedia labels)
    const devs = await enumerateCameras();
    const effectiveId = deviceId || (devs.length > 0 ? devs[0].id : undefined);
    if (effectiveId) setSelectedDeviceId(effectiveId);

    // Try Native BarcodeDetector first (GPU-accelerated, fastest)
    const nativeOk = await startNativeEngine(effectiveId);
    if (nativeOk) {
      console.log('[Scanner] Native engine running ✓');
      return;
    }

    // Fallback: Html5Qrcode library
    console.log('[Scanner] Falling back to Html5Qrcode...');
    const h5qOk = await startHtml5Engine(effectiveId);
    if (h5qOk) {
      console.log('[Scanner] Html5Qrcode running ✓');
      return;
    }

    // Complete failure
    console.error('[Scanner] All engines failed');
    setCameraError('Camera unavailable. Please allow camera access, or type the barcode number below.');
  }, [stopAllStreams, enumerateCameras]);

  // ─── LIFECYCLE ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => bootScanner(), 150);
    return () => {
      clearTimeout(timer);
      stopAllStreams();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [isOpen, onClose]);

  // ─── HANDLERS ─────────────────────────────────────────────────────────────
  const handleDeviceChange = async (newId: string) => {
    setSelectedDeviceId(newId);
    await bootScanner(newId);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Need a temporary div for the scanner
      let tempDiv = document.getElementById('barcode-file-scanner-temp');
      if (!tempDiv) {
        tempDiv = document.createElement('div');
        tempDiv.id = 'barcode-file-scanner-temp';
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
      }
      const h5q = new Html5Qrcode('barcode-file-scanner-temp', { verbose: false });
      const decoded = await h5q.scanFile(file, true);
      try { h5q.clear(); } catch {}
      if (decoded?.trim()) triggerScanSuccess(decoded.trim());
    } catch {
      alert('Could not detect a barcode in this photo. Try better lighting or type the code below.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (code.length >= 3) triggerScanSuccess(code);
  };

  if (!isOpen) return null;

  // Determine which viewfinder to show based on what's active
  const useNativeVideo = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  return (
    <AnimatePresence>
      <div
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md cursor-pointer"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-xl bg-white dark:bg-[#0E0E0E] border border-slate-200 dark:border-white/10 rounded-[32px] sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-white cursor-default"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-[#141414]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Camera size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Barcode Scanner
                  </h3>
                  {cameraActive && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-gray-400">{engineLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  title="Toggle Flash"
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    torchOn
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                      : 'bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-white/10'
                  }`}
                >
                  <Zap size={18} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Camera selector toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 dark:bg-[#151515] p-2.5 rounded-2xl border border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <SwitchCamera size={16} className="text-slate-400 shrink-0" />
                <select
                  value={selectedDeviceId}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-slate-700 dark:text-gray-200 outline-none cursor-pointer truncate"
                >
                  {devices.length === 0 ? (
                    <option value="">Default Camera</option>
                  ) : (
                    devices.map((d) => (
                      <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                        {d.label}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <button
                type="button"
                onClick={() => bootScanner(selectedDeviceId)}
                title="Reconnect Camera"
                className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Manual barcode entry */}
            <form onSubmit={handleManualSubmit} className="space-y-1.5 bg-blue-50/70 dark:bg-blue-950/20 p-3 rounded-2xl border border-blue-200/70 dark:border-blue-900/40">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Keyboard size={14} /> Type / Paste Barcode Digits
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
                    placeholder="Enter digits under barcode..."
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={manualCode.trim().length < 3}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/20 shrink-0"
                >
                  <ArrowRight size={14} /> Add
                </button>
              </div>
            </form>

            {/* Camera Viewfinder */}
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-black border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-2xl">
              {/* Native video element — always mounted so BarcodeDetector RAF loop can reference it */}
              <video
                ref={videoRef}
                id={NATIVE_VIDEO_ID}
                className={`w-full h-full object-cover ${useNativeVideo ? 'block' : 'hidden'}`}
                autoPlay
                playsInline
                muted
              />

              {/* Html5Qrcode fallback container — always mounted, visible when native not available */}
              <div
                id={H5Q_CONTAINER_ID}
                className={`w-full h-full ${useNativeVideo ? 'hidden' : 'block'}`}
              />

              {/* Success flash */}
              <AnimatePresence>
                {detectionSuccess && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-emerald-500/40 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center pointer-events-none"
                  >
                    <motion.div
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1.1 }}
                      className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/50"
                    >
                      <CheckCircle2 size={36} />
                    </motion.div>
                    <span className="mt-3 text-sm font-black uppercase tracking-widest text-white drop-shadow-md">
                      ✓ Barcode Scanned!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scanning reticle (only when camera is live and not yet successful) */}
              {cameraActive && !detectionSuccess && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20">
                  <div className="flex justify-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-black/80 px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-xs flex items-center gap-1.5 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Scanning — Point at any barcode
                    </span>
                  </div>

                  {/* Scanning laser line */}
                  <div className="relative w-full max-w-[320px] h-32 mx-auto flex items-center justify-center">
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-500 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-500 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-500 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-500 rounded-br-lg" />
                    {/* Laser sweep */}
                    <motion.div
                      animate={{ y: [-50, 50, -50] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                      className="w-full h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444,0_0_20px_#dc2626]"
                    />
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] text-white/80 bg-black/80 px-3.5 py-1 rounded-full backdrop-blur-xs border border-white/10 shadow-lg">
                      Hold steady • No alignment needed • Auto-detects instantly
                    </span>
                  </div>
                </div>
              )}

              {/* Error overlay */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3 z-20">
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

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {/* Quick-test barcodes */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-gray-500 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-500" /> Quick Test Barcodes
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload size={11} /> Upload Image
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_TEST_BARCODES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => triggerScanSuccess(item.code)}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-100 dark:bg-[#1E1E1E] hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/80 dark:border-white/5 transition-all text-slate-700 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer"
                    title={`Simulate scan: ${item.code}`}
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
