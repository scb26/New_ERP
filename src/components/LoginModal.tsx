import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, UserCheck, Lock, X, Check, KeyRound } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_USERS = [
  {
    username: 'admin',
    name: 'Admin Owner',
    role: 'admin' as UserRole,
    description: 'Full Access (POS, Admin, Purchases, Inventory, Settings, P&L)',
    badgeColor: 'bg-red-500/10 text-red-500 border-red-500/20'
  },
  {
    username: 'cashier',
    name: 'Counter Cashier',
    role: 'cashier' as UserRole,
    description: 'Quick Billing POS only. Cost prices and admin settings hidden.',
    badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  },
  {
    username: 'accountant',
    name: 'Lead Accountant',
    role: 'accountant' as UserRole,
    description: 'Audit, Purchases, Sales Register & Taxes. Read & write accounting.',
    badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  }
];

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { user: currentUser, login } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string>(currentUser?.username || 'admin');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelect = async (username: string, role: UserRole) => {
    setSelectedUser(username);
    setLoading(true);
    const success = await login(username, role);
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Switch Operator Profile</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">Multi-User RBAC & Audit Authentication</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* User selector list */}
          <div className="p-6 space-y-3">
            {PRESET_USERS.map((u) => {
              const isCurrent = currentUser?.username === u.username;
              return (
                <div
                  key={u.username}
                  onClick={() => handleSelect(u.username, u.role)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                    isCurrent
                      ? 'bg-blue-50/70 dark:bg-blue-900/20 border-blue-500/50 shadow-sm'
                      : 'bg-slate-50/50 dark:bg-[#161616] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      u.role === 'admin'
                        ? 'bg-red-500/10 text-red-500'
                        : u.role === 'cashier'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-blue-500/10 text-blue-500'
                    }`}
                  >
                    <UserCheck size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{u.name}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${u.badgeColor}`}>
                          {u.role}
                        </span>
                      </div>
                      {isCurrent && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">
                          <Check size={12} /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-gray-400">{u.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="p-4 bg-slate-50 dark:bg-[#0D0D0D] border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-gray-500 px-6">
            <span className="flex items-center gap-1.5 font-medium">
              <KeyRound size={13} className="text-slate-400 dark:text-gray-500" />
              Role bound to all transactions & logs
            </span>
            <span className="font-mono text-[10px]">v2.0 ACID Engine</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
