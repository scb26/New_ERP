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
  Flashlight,
  SwitchCamera,
  CheckCircle2,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { playScanSuccessSound } from '../utils/audio';

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

export const BarcodeCameraModal: React.FC<BarcodeCameraModalProps> = ({
  isOpen,
  onClose,
  onScan
}) => {
  // State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [activeEngine, setActiveEngine] = useState<'native' | 'html5qrcode'>('native');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [detectionSuccess, setDetectionSuccess] = useState(false);
  const [fpsCounter, setFpsCounter] = useState(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentStreamRef = useRef<MediaStream | null>(null);
  const nativeAnimFrameRef = useRef<number | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isStoppingRef = useRef(false);
  const scanSuccessLockRef = useRef(false);

  // Stop all camera pipelines cleanly
  const stopAllStreams = useCallback(async () => {
    isStoppingRef.current = true;

    // 1. Stop Native requestAnimationFrame loop
    if (nativeAnimFrameRef.current) {
      cancelAnimationFrame(nativeAnimFrameRef.current);
      nativeAnimFrameRef.current = null;
    }

    // 2. Stop raw MediaStream tracks
    if (currentStreamRef.current) {
      currentStreamRef.current.getTracks().forEach(t => {
        try {
          t.stop();
        } catch {}
      });
      currentStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // 3. Stop Html5Qrcode instance
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch {}
      try {
        html5QrCodeRef.current.clear();
      } catch {}
      html5QrCodeRef.current = null;
    }

    setCameraActive(false);
    setHasTorch(false);
    setTorchOn(false);
    isStoppingRef.current = false;
  }, []);

  // Handle successful scan with feedback animation
  const triggerScanSuccess = useCallback((barcode: string) => {
    if (scanSuccessLockRef.current) return;
    scanSuccessLockRef.current = true;

    setDetectionSuccess(true);
    playScanSuccessSound();

    setTimeout(() => {
      onScan(barcode);
      onClose();
    }, 280);
  }, [onScan, onClose]);

  // Discover and filter camera devices (filtering out IR / Windows Hello sensors)
  const enumerateCameras = useCallback(async (): Promise<CameraDevice[]> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }
      const allDevs = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = allDevs.filter(d => d.kind === 'videoinput');

      // Filter out IR cameras (Windows Hello, RealSense IR)
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

  // Check and setup torch capabilities
  const inspectTorchCapability = (stream: MediaStream) => {
    try {
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        const caps = track.getCapabilities() as any;
        if (caps && caps.torch) {
          setHasTorch(true);
          return;
        }
      }
    } catch {}
    setHasTorch(false);
  };

  // Toggle hardware torch
  const toggleTorch = async () => {
    if (!currentStreamRef.current) return;
    const track = currentStreamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }]
      });
      setTorchOn(nextState);
    } catch (err) {
      console.warn("Torch applyConstraints error:", err);
    }
  };

  // --- Tier 1: Native BarcodeDetector Engine ---
  const startNativeEngine = async (deviceIdToUse?: string): Promise<boolean> => {
    if (typeof window === 'undefined' || !('BarcodeDetector' in window)) {
      return false;
    }

    try {
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      const supportedFormats = await BarcodeDetectorClass.getSupportedFormats().catch(() => []);
      
      const desiredFormats = [
        'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'
      ];
      const formats = desiredFormats.filter(f => supportedFormats.includes(f));

      const detector = new BarcodeDetectorClass({
        formats: formats.length > 0 ? formats : undefined
      });

      const hasExactId = Boolean(deviceIdToUse && deviceIdToUse.trim().length > 0);
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: hasExactId ? { exact: deviceIdToUse } : undefined,
          facingMode: hasExactId ? undefined : { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      currentStreamRef.current = stream;

      inspectTorchCapability(stream);

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach(t => t.stop());
        return false;
      }

      // Attach stream directly - video element is fully visible in DOM
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;

      try {
        await video.play();
      } catch (playErr) {
        console.warn("Video play error (will autoplay on interaction):", playErr);
      }

      setCameraActive(true);
      setActiveEngine('native');
      setCameraError(null);

      // Fast RAF detection loop
      let frames = 0;
      let lastFpsCheck = performance.now();
      let detecting = false;

      const loop = async () => {
        if (isStoppingRef.current || scanSuccessLockRef.current) return;

        frames++;
        const now = performance.now();
        if (now - lastFpsCheck >= 1000) {
          setFpsCounter(frames);
          frames = 0;
          lastFpsCheck = now;
        }

        if (!detecting && video.readyState >= 2) {
          detecting = true;
          try {
            const barcodes = await detector.detect(video);
            if (barcodes && barcodes.length > 0 && !scanSuccessLockRef.current) {
              const rawValue = barcodes[0].rawValue;
              const clean = (rawValue || '').trim();
              if (clean) {
                triggerScanSuccess(clean);
                return;
              }
            }
          } catch {
            // Frame parse error ignored
          } finally {
            detecting = false;
          }
        }

        if (!isStoppingRef.current && !scanSuccessLockRef.current) {
          nativeAnimFrameRef.current = requestAnimationFrame(loop);
        }
      };

      nativeAnimFrameRef.current = requestAnimationFrame(loop);
      return true;
    } catch (err) {
      console.warn("Native BarcodeDetector engine failed:", err);
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(t => t.stop());
        currentStreamRef.current = null;
      }
      return false;
    }
  };

  // --- Tier 2: Html5Qrcode Fallback Engine ---
  const startHtml5QrcodeEngine = async (deviceIdToUse?: string) => {
    try {
      const containerId = "interactive-barcode-fallback-viewfinder";
      const container = document.getElementById(containerId);
      if (!container) return;

      const html5QrCode = new Html5Qrcode(containerId, {
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
      html5QrCodeRef.current = html5QrCode;

      const hasExactId = Boolean(deviceIdToUse && deviceIdToUse.trim().length > 0);
      const cameraConfig = hasExactId ? { deviceId: { exact: deviceIdToUse } } : { facingMode: "environment" };

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 25,
          disableFlip: false
        },
        (decodedText) => {
          if (scanSuccessLockRef.current) return;
          const clean = decodedText.trim();
          if (clean) {
            triggerScanSuccess(clean);
          }
        },
        () => {
          // ignore scan frame error
        }
      );

      setCameraActive(true);
      setActiveEngine('html5qrcode');
      setCameraError(null);
    } catch (err: any) {
      console.warn("Html5Qrcode engine failed:", err);
      setCameraError(
        err?.message?.includes('Permission') || err?.name === 'NotAllowedError'
          ? "Camera permission denied. Please allow camera access in browser settings."
          : "No camera stream available. Type the printed code below or upload an image."
      );
    }
  };

  // Start engine pipeline
  const bootScanner = useCallback(async (deviceId?: string) => {
    await stopAllStreams();
    scanSuccessLockRef.current = false;
    setDetectionSuccess(false);
    setCameraError(null);

    // Populate camera list
    const devs = await enumerateCameras();
    const effectiveDeviceId = deviceId !== undefined ? deviceId : (devs.length > 0 ? devs[0].id : '');
    if (effectiveDeviceId) {
      setSelectedDeviceId(effectiveDeviceId);
    }

    // Try Tier 1 Native engine first
    const nativeStarted = await startNativeEngine(effectiveDeviceId);
    if (!nativeStarted) {
      // Fallback to Tier 2 Html5Qrcode engine
      await startHtml5QrcodeEngine(effectiveDeviceId);
    }
  }, [stopAllStreams, enumerateCameras]);

  // Lifecycle
  useEffect(() => {
    if (!isOpen) return;

    let timer = setTimeout(() => {
      bootScanner();
    }, 150);

    return () => {
      clearTimeout(timer);
      stopAllStreams();
    };
  }, [isOpen, bootScanner, stopAllStreams]);

  // Escape key handler
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

  // Handle switching camera device
  const handleDeviceChange = async (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    await bootScanner(newDeviceId);
  };

  // Handle image upload scan
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("interactive-barcode-fallback-viewfinder", {
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
        triggerScanSuccess(clean);
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
      triggerScanSuccess(clean);
    }
  };

  if (!isOpen) return null;

  const isNativeVisionSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window;

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
                    Industrial Barcode Engine
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                    <Cpu size={10} />
                    {activeEngine === 'native' ? 'Native GPU' : 'Auto Vision'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Full 1080p scan matrix with hardware auto-focus
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  title="Toggle Flash Torch"
                  className={`p-2 rounded-xl transition-all ${
                    torchOn 
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
                      : 'bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-white/10'
                  }`}
                >
                  <Flashlight size={18} />
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
            {/* Camera Select & Status Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 dark:bg-[#151515] p-2.5 rounded-2xl border border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <SwitchCamera size={16} className="text-slate-400 shrink-0" />
                <select
                  value={selectedDeviceId}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-slate-700 dark:text-gray-200 outline-none cursor-pointer truncate"
                >
                  {devices.length === 0 ? (
                    <option value="">Default Counter Camera</option>
                  ) : (
                    devices.map((d) => (
                      <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                        {d.label}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {cameraActive && (
                  <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {fpsCounter > 0 ? `${fpsCounter} FPS` : 'LIVE'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => bootScanner(selectedDeviceId)}
                  title="Reconnect Camera"
                  className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Direct Input for numbers printed below barcode */}
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

            {/* Camera Viewfinder Box with Direct Video Stream & Corner Crosshairs */}
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-black border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-2xl">
              {/* Native Engine HTMLVideoElement - Always mounted and fully visible */}
              {isNativeVisionSupported ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover block"
                  autoPlay
                  playsInline
                  muted
                />
              ) : (
                <div 
                  id="interactive-barcode-fallback-viewfinder" 
                  className="w-full h-full object-cover block"
                />
              )}

              {/* Success Green Flash Animation */}
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
                    <span className="mt-3 text-xs font-black uppercase tracking-widest text-white drop-shadow-md">
                      Barcode Decoded
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Aiming Reticle & Animated Laser Line */}
              {cameraActive && !detectionSuccess && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20">
                  {/* Top Status */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-black/80 px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-xs flex items-center gap-1.5 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Continuous Detection Active
                    </span>
                    <span className="text-[10px] font-bold text-white/80 bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-xs">
                      Omnidirectional
                    </span>
                  </div>

                  {/* Corner Targeting Reticle */}
                  <div className="relative w-full max-w-[320px] aspect-[16/9] mx-auto flex items-center justify-center">
                    {/* Top-Left Corner */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-500 rounded-tl-lg" />
                    {/* Top-Right Corner */}
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-500 rounded-tr-lg" />
                    {/* Bottom-Left Corner */}
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-500 rounded-bl-lg" />
                    {/* Bottom-Right Corner */}
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-500 rounded-br-lg" />

                    {/* Animated Scanning Laser Line */}
                    <motion.div
                      animate={{
                        y: [-50, 50, -50],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.8,
                        ease: "easeInOut"
                      }}
                      className="w-full h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444,0_0_24px_#dc2626]"
                    />
                  </div>

                  {/* Bottom Guide */}
                  <div className="text-center">
                    <span className="text-[10px] text-white/80 bg-black/80 px-3.5 py-1 rounded-full backdrop-blur-xs border border-white/10 shadow-lg">
                      Position any barcode within view • Instant read
                    </span>
                  </div>
                </div>
              )}

              {/* Error fallback if camera is blocked/unavailable */}
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

            {/* Hidden File Upload for barcode photos */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload} 
            />

            {/* 1-Click Test Simulator for QA & Testing */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-gray-500 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-500" /> 1-Click QA Simulation Barcodes
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
                    onClick={() => {
                      triggerScanSuccess(item.code);
                    }}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-100 dark:bg-[#1E1E1E] hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/80 dark:border-white/5 transition-all text-slate-700 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer"
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
