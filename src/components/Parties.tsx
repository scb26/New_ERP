import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Parties() {
  const [parties, setParties] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'customer' | 'vendor'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newParty, setNewParty] = useState({ name: '', type: 'customer', phone: '', email: '', balance: 0 });

  useEffect(() => {
    fetch('/api/parties')
      .then(res => res.json())
      .then(data => setParties(data));
  }, []);

  const handleAddParty = async () => {
    const res = await fetch('/api/parties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newParty)
    });
    const party = await res.json();
    setParties([party, ...parties]);
    setShowAddModal(false);
    setNewParty({ name: '', type: 'customer', phone: '', email: '', balance: 0 });
  };

  const filteredParties = parties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.phone?.includes(searchTerm);
    const matchesType = filter === 'all' || p.type === filter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={16} /> Add New Party
          </button>
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search contacts..."
              className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-xs focus:outline-none focus:border-blue-500/50 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'customer', 'vendor'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type as any)}
                className={`flex-1 py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${filter === type ? 'bg-white border-white text-black' : 'bg-[#0A0A0A] border-white/5 text-gray-500 hover:text-gray-300'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredParties.map((p) => (
          <motion.div 
            layout
            key={p.id}
            className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[32px] hover:border-blue-500/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-500 font-black text-xl border border-white/5">
                {p.name.charAt(0)}
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${p.type === 'customer' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                {p.type}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-gray-200 mb-4">{p.name}</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <Phone size={14} className="text-blue-500/50" />
                <span>{p.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <Mail size={14} className="text-blue-500/50" />
                <span className="truncate">{p.email || 'No email provided'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Balance</p>
                <p className={`text-lg font-black ${p.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                   ₹{Math.abs(p.balance).toLocaleString()}
                   <span className="text-[10px] ml-1 uppercase font-bold opacity-60">
                    {p.balance >= 0 ? 'Receive' : 'Pay'}
                   </span>
                </p>
              </div>
              <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
                <ArrowUpRight size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredParties.length === 0 && (
        <div className="py-24 flex flex-col items-center justify-center text-gray-600">
          <Users size={48} className="mb-4 opacity-10" />
          <p className="text-sm font-bold uppercase tracking-widest opacity-30">No contacts found</p>
          <p className="text-xs mt-1">Try a different search or add a new party.</p>
        </div>
      )}

      {/* Add Party Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-[40px] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl mx-4"
            >
              <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                <h3 className="text-xl md:text-2xl font-bold">New Party</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setNewParty({...newParty, type: 'customer'})}
                    className={`p-4 rounded-2xl text-xs font-bold uppercase transition-all ${newParty.type === 'customer' ? 'bg-blue-600 border-blue-500' : 'bg-[#111111] border-white/5 text-gray-500'}`}
                  >
                    Customer
                  </button>
                  <button 
                    onClick={() => setNewParty({...newParty, type: 'vendor'})}
                    className={`p-4 rounded-2xl text-xs font-bold uppercase transition-all ${newParty.type === 'vendor' ? 'bg-orange-600 border-orange-500' : 'bg-[#111111] border-white/5 text-gray-500'}`}
                  >
                    Vendor
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Party Name</label>
                    <input 
                      placeholder="Enter name"
                      className="w-full bg-[#111111] border border-white/5 rounded-2xl px-4 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                      value={newParty.name}
                      onChange={(e) => setNewParty({...newParty, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Phone</label>
                      <input 
                        placeholder="10-digit number"
                        className="w-full bg-[#111111] border border-white/5 rounded-2xl px-4 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                        value={newParty.phone}
                        onChange={(e) => setNewParty({...newParty, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Initial Balance</label>
                      <input 
                        type="number"
                        placeholder="₹ 0.00"
                        className="w-full bg-[#111111] border border-white/5 rounded-2xl px-4 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                        value={newParty.balance}
                        onChange={(e) => setNewParty({...newParty, balance: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleAddParty}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all mt-4"
                >
                  SAVE PARTY ACCOUNT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
