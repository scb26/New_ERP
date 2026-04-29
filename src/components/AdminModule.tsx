import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  ReceiptText, 
  BarChart3, 
  Package, 
  Settings2, 
  ChevronRight, 
  ArrowLeft,
  CircleDot,
  Search,
  Loader2,
  Check,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface CompanyProfile {
  name: string;
  tradeName: string;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  upiId: string;
  businessType: string;
  businessCategory: string;
  logoUrl: string;
}

const INITIAL_DATA: CompanyProfile = {
  name: '',
  tradeName: '',
  gstin: '',
  pan: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  upiId: '',
  businessType: 'Private Limited',
  businessCategory: 'Trading',
  logoUrl: '',
};

// --- Theme Components ---

const SidebarItem = ({ icon: Icon, label, description, active }: { icon: any, label: string, description: string, active?: boolean }) => (
  <div className={`p-4 rounded-2xl flex items-start gap-4 cursor-pointer transition-all border ${active ? 'bg-[#0A1A2F]/40 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-[#111111] hover:bg-[#161616] border-transparent hover:border-white/5'}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-blue-600 text-white' : 'bg-[#1A1A1A] text-gray-500'}`}>
      <Icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className={`text-sm font-bold truncate ${active ? 'text-white' : 'text-gray-300'}`}>{label}</h3>
      <p className="text-[10px] text-gray-500 font-medium truncate">{description}</p>
    </div>
  </div>
);

const InputWrapper = ({ label, required, children, className = "" }: { label: string, required?: boolean, children: React.ReactNode, className?: string }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="block text-[11px] font-bold text-gray-400 capitalize flex items-center gap-1">
      {label} {required && <span className="text-blue-500">*</span>}
    </label>
    {children}
  </div>
);

const DarkInput = ({ placeholder, value, onChange, type = "text", ...props }: any) => (
  <input 
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    {...props}
    className="w-full bg-[#0D0D0D] border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-all focus:ring-4 focus:ring-blue-500/5"
  />
);

const DarkSelect = ({ value, onChange, options }: any) => (
  <div className="relative group">
    <select 
      value={value}
      onChange={onChange}
      className="w-full bg-[#0D0D0D] border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-200 appearance-none focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
    >
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
      <ChevronRight size={14} className="rotate-90" />
    </div>
  </div>
);

export default function AdminModule() {
  const [activeTab, setActiveTab] = useState<'profile' | 'current'>('profile');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [data, setData] = useState<CompanyProfile>(INITIAL_DATA);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(settings => {
        setData(prev => ({
          ...prev,
          name: settings.businessName || prev.name,
          upiId: settings.upiId || prev.upiId,
          gstin: settings.gstNumber || prev.gstin,
          address: settings.address || prev.address
        }));
      });
  }, []);

  const handleFinish = async () => {
    setLoading(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: data.name,
          upiId: data.upiId,
          gstNumber: data.gstin,
          address: data.address
        })
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setActiveTab('current');
      }, 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => setData(prev => ({ ...prev, logoUrl: re.target?.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const checkConnection = async () => {
    setConnectionStatus('testing');
    try {
      const res = await fetch('/api/health');
      if (res.ok) setConnectionStatus('ok');
      else setConnectionStatus('fail');
    } catch (e) {
      setConnectionStatus('fail');
    }
  };

  return (
    <main className="flex-1 flex flex-col gap-6 relative">
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3 border border-white/20"
          >
            <Check size={20} /> Setup Saved Successfully
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Controls */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4 tracking-tight text-gray-200">Admin Configuration</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all border ${activeTab === 'profile' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'}`}
          >
            Company Profile
          </button>
          <button 
            onClick={() => setActiveTab('current')}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all border ${activeTab === 'current' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'}`}
          >
            Current Setup
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.div 
              key="setup-wizard"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 flex flex-col shadow-2xl relative overflow-hidden h-fit"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-bold text-white tracking-tight">Business Setup</h3>
                <div className="flex items-center gap-12 relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -z-10" />
                  {[1, 2, 3].map(s => (
                    <div key={s} className="flex flex-col items-center gap-2">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-[#1A1A1A] text-gray-600'}`}>
                        {s}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${step === s ? 'text-white' : 'text-gray-600'}`}>
                        {s === 1 ? 'IDENTITY' : s === 2 ? 'CONTACT' : 'BILLING'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 space-y-8">
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Top Section: Logo + Identity */}
                    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-none">Add Logo</label>
                        <div className="w-full aspect-square bg-[#0D0D0D] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 relative group hover:border-blue-500/30 transition-all cursor-pointer overflow-hidden shadow-inner">
                          {data.logoUrl ? (
                            <img src={data.logoUrl} className="w-full h-full object-contain p-6" alt="logo" />
                          ) : (
                            <>
                              <div className="w-16 h-16 rounded-full bg-blue-500/5 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                <Plus size={20} />
                              </div>
                              <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider text-center px-4">Upload Logo</span>
                            </>
                          )}
                          <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                      </div>

                      <div className="flex flex-col justify-center gap-6">
                        <InputWrapper label="Business Name" required>
                          <DarkInput placeholder="e.g. Sharma Pip" value={data.name} onChange={(e: any) => setData({...data, name: e.target.value})} />
                        </InputWrapper>
                        <InputWrapper label="Trade / Brand Name (Optional)">
                          <DarkInput placeholder="e.g. SPT Store" value={data.tradeName} onChange={(e: any) => setData({...data, tradeName: e.target.value})} />
                        </InputWrapper>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                      <InputWrapper label="GSTIN (Optional)" className="col-span-1">
                        <div className="relative">
                          <DarkInput placeholder="E.G. 27AABCT1234D1Z5" value={data.gstin} onChange={(e: any) => setData({...data, gstin: e.target.value.toUpperCase()})} />
                          <button className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#161616] border border-white/5 rounded-lg text-[10px] font-bold text-blue-500 hover:bg-blue-600 hover:text-white transition-all">Fetch</button>
                        </div>
                      </InputWrapper>
                      <InputWrapper label="Nature of Business">
                        <DarkSelect value={data.businessCategory} onChange={(e: any) => setData({...data, businessCategory: e.target.value})} options={['Trading', 'Services', 'Retail', 'Manufacturer']} />
                      </InputWrapper>
                      <InputWrapper label="PAN Number (Optional)">
                         <DarkInput placeholder="E.G. ABCDE1234F" value={data.pan} onChange={(e: any) => setData({...data, pan: e.target.value.toUpperCase()})} />
                      </InputWrapper>
                      <InputWrapper label="Business Type">
                        <DarkSelect value={data.businessType} onChange={(e: any) => setData({...data, businessType: e.target.value})} options={['Private Limited', 'Proprietorship', 'Partnership']} />
                      </InputWrapper>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputWrapper label="Mobile Number" required>
                      <DarkInput placeholder="10-digit number" value={data.phone} onChange={(e: any) => setData({...data, phone: e.target.value})} />
                    </InputWrapper>
                    <InputWrapper label="Email Address">
                      <DarkInput placeholder="business@email.com" value={data.email} onChange={(e: any) => setData({...data, email: e.target.value})} />
                    </InputWrapper>
                    <InputWrapper label="Pincode" required>
                      <DarkInput placeholder="6-digit code" value={data.pincode} onChange={(e: any) => setData({...data, pincode: e.target.value})} />
                    </InputWrapper>
                    <InputWrapper label="State">
                       <DarkInput value={data.state} onChange={(e: any) => setData({...data, state: e.target.value})} />
                    </InputWrapper>
                    <div className="md:col-span-2">
                       <InputWrapper label="Office Address" required>
                        <DarkInput placeholder="Building name, Floor, Street..." value={data.address} onChange={(e: any) => setData({...data, address: e.target.value})} />
                      </InputWrapper>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                     <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-[32px] flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl">⚡</div>
                        <div>
                          <h4 className="text-lg font-bold">Payment Configuration</h4>
                          <p className="text-xs text-gray-500">Set up how your customers pay you via Quick Bill.</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <InputWrapper label="Business UPI ID" required>
                          <DarkInput 
                            placeholder="e.g. yourname@upi" 
                            value={data.upiId} 
                            onChange={(e: any) => setData({...data, upiId: e.target.value})} 
                          />
                          <p className="text-[10px] text-gray-600 mt-2 font-medium">Used to generate dynamic QR codes for instant payments.</p>
                        </InputWrapper>

                        <div className="p-6 bg-[#111111] rounded-2xl border border-white/5 flex items-center justify-between">
                           <div>
                             <p className="text-xs font-bold mb-1 text-gray-300">Enable UPI QR</p>
                             <p className="text-[10px] text-gray-500">Show QR on Quick Bill</p>
                           </div>
                           <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-lg" />
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )}
              </div>

              <div className="pt-10 flex justify-between gap-4">
                {step > 1 && (
                  <button 
                    onClick={() => setStep(s => Math.max(1, s - 1))}
                    className="px-8 py-3.5 bg-white/5 text-gray-400 rounded-full font-bold text-sm hover:text-white transition-all"
                  >
                    Previous
                  </button>
                )}
                <button 
                  disabled={loading}
                  onClick={() => {
                    if (step < 3) setStep(s => s + 1);
                    else handleFinish();
                  }}
                  className="px-10 py-3.5 bg-blue-600 text-white rounded-full font-bold text-sm shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 ml-auto flex items-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {step < 3 ? 'Next Step' : 'Finish Setup'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="current-setup"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-2xl font-bold text-white tracking-tight">Active Configuration</h3>
                <div className="px-4 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                  System Live
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Identity Details</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                           <span className="text-sm text-gray-500">Business Name</span>
                           <span className="text-sm font-bold text-gray-200">{data.name || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                           <span className="text-sm text-gray-500">GSTIN Number</span>
                           <span className="text-sm font-bold text-blue-500">{data.gstin || 'Not Provided'}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                           <span className="text-sm text-gray-500">Business Category</span>
                           <span className="text-sm font-bold text-gray-200">{data.businessCategory}</span>
                        </div>
                      </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Payment & Settlement</h4>
                      <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-2xl space-y-4 shadow-inner">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">₹</div>
                            <div>
                               <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Linked UPI ID</p>
                               <p className="text-sm font-bold text-white">{data.upiId || 'Not Set'}</p>
                            </div>
                         </div>
                         <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">QR Payments</span>
                            <span className="text-[10px] font-bold text-green-500 flex items-center gap-1"><Check size={12}/> Active</span>
                         </div>
                      </div>
                    </div>

                      <button 
                         onClick={checkConnection}
                         className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                           connectionStatus === 'ok' ? 'bg-green-600/10 text-green-500 border border-green-500/20' :
                           connectionStatus === 'fail' ? 'bg-red-600/10 text-red-500 border border-red-500/20' :
                           'bg-[#111111] border border-white/5 text-gray-400 hover:text-white'
                         }`}
                       >
                         {connectionStatus === 'testing' ? <Loader2 size={12} className="animate-spin" /> : 
                          connectionStatus === 'ok' ? <Check size={12} /> : 
                          connectionStatus === 'fail' ? <CircleDot size={12} /> : null}
                         {connectionStatus === 'testing' ? 'Testing...' : 
                          connectionStatus === 'ok' ? 'Server Connected' : 
                          connectionStatus === 'fail' ? 'Connection Failed' : 'Check Server Connection'}
                       </button>

                    <button 
                      onClick={() => setActiveTab('profile')}
                      className="w-full py-4 bg-[#111111] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all hover:bg-white/5"
                    >
                      Update Profile
                    </button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Preview Column */}
        <aside className="space-y-6">
          <div className="bg-[#E5E5E5] rounded-[24px] p-8 text-black min-h-[300px] flex flex-col gap-6 shadow-xl relative overflow-hidden">
            <div className="flex items-start justify-between">
               <div className="space-y-4 max-w-[60%]">
                  <div className="w-12 h-12 bg-white/50 rounded-xl flex items-center justify-center">
                     {data.logoUrl ? <img src={data.logoUrl} className="max-w-[70%] max-h-[70%] object-contain" /> : <Building2 className="text-gray-400" size={24} />}
                  </div>
                  <h4 className="text-lg font-black leading-tight truncate uppercase tracking-tight">{data.name || "Your Business Name"}</h4>
               </div>
               <span className="text-[24px] font-black tracking-tighter opacity-70">INVOICE</span>
            </div>

            <div className="text-[10px] space-y-1 font-medium opacity-60">
               <p>{data.address || "Address will appear here."}</p>
               <p>{data.city || "City"}, {data.state || "State"} - {data.pincode || "Pincode"}</p>
            </div>

            <div className="mt-auto pt-6 border-t border-black/10 grid grid-cols-2 gap-4">
               <div className="text-[9px] space-y-1">
                  <p className="flex justify-between"><span>GSTIN:</span> <b>{data.gstin || '-'}</b></p>
                  <p className="flex justify-between"><span>Phone:</span> <b>{data.phone || '-'}</b></p>
               </div>
               <div className="text-[9px] space-y-1 text-right">
                  <p className="flex justify-between"><span>Email:</span> <b>{data.email ? '...' : '-'}</b></p>
                  <p className="flex justify-between"><span>PAN:</span> <b>{data.pan || '-'}</b></p>
               </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
