import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  Truck,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';

const StatCard = ({ label, value, trend, trendType, icon: Icon }: any) => (
  <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 p-4 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all shadow-xs dark:shadow-none">
    <div className="flex justify-between items-start mb-2">
      <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
        <Icon size={20} />
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${trendType === 'up' ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-red-500/10 text-red-600 dark:text-red-500'}`}>
        {trendType === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        {trend}
      </div>
    </div>
    <p className="text-slate-500 dark:text-gray-500 text-[11px] font-bold uppercase tracking-wider">{label}</p>
    <h3 className="text-2xl font-black mt-0.5 text-slate-950 dark:text-white tracking-tight">{value}</h3>
    <div className="absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-[0.02] group-hover:opacity-[0.07] dark:group-hover:opacity-[0.05] transition-opacity text-slate-900 dark:text-white">
      <Icon size={100} />
    </div>
  </div>
);

export default function Dashboard({ onNavigate }: { onNavigate: (mod: any) => void }) {
  const [stats, setStats] = useState({
    totalSales: 0,
    purchaseVolume: 0,
    invoiceCount: '0',
    activeProducts: '0',
    recentInvoices: [] as any[]
  });

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`₹${(stats.totalSales || 0).toLocaleString()}`} trend="+12.5%" trendType="up" icon={TrendingUp} />
        <StatCard label="Procurement" value={`₹${(stats.purchaseVolume || 0).toLocaleString()}`} trend="Stock In" trendType="up" icon={Truck} />
        <StatCard label="Total Invoices" value={stats.invoiceCount} trend="+3 new" trendType="up" icon={Users} />
        <StatCard label="Inv. Products" value={stats.activeProducts} trend="Stable" trendType="up" icon={Package} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-xs dark:shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
            <button 
              onClick={() => onNavigate('sales')}
              className="text-xs font-bold text-blue-600 dark:text-blue-500 hover:text-blue-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              View All Invoices
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-[10px] font-bold text-slate-500 dark:text-gray-600 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="py-4 text-left">Invoice ID</th>
                  <th className="py-4 text-left">Customer</th>
                  <th className="py-4 text-left">Date</th>
                  <th className="py-4 text-right">Amount</th>
                  <th className="py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {stats.recentInvoices.length > 0 ? stats.recentInvoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors">
                    <td className="py-4 font-bold text-blue-600 dark:text-blue-500">{inv.id}</td>
                    <td className="py-4 text-slate-700 dark:text-gray-300">{inv.customer || 'Walk-in'}</td>
                    <td className="py-4 text-slate-500 dark:text-gray-500 text-xs">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="py-4 text-right font-black text-slate-900 dark:text-white">₹{inv.total.toLocaleString()}</td>
                    <td className="py-4 text-center">
                      <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-500 text-[10px] font-bold rounded-md">PAID</span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400 dark:text-gray-600 font-bold uppercase tracking-widest text-xs">No recent activity detected</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-xs dark:shadow-none">
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => onNavigate('bill')}
                className="w-full p-3.5 bg-blue-600 rounded-xl flex items-center justify-center gap-2.5 font-bold text-sm shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:bg-blue-700 transition-all text-white cursor-pointer"
              >
                <Plus size={18} /> Create New Invoice
              </button>
              <button 
                onClick={() => onNavigate('purchases')}
                className="w-full p-3.5 bg-orange-600 rounded-xl flex items-center justify-center gap-2.5 font-bold text-sm shadow-[0_10px_20px_rgba(234,88,12,0.2)] hover:bg-orange-700 transition-all text-white cursor-pointer"
              >
                <Truck size={18} /> Record Purchase
              </button>
              <button 
                onClick={() => onNavigate('inventory')}
                className="w-full p-3.5 bg-slate-100 dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-center gap-2.5 font-bold text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-[#161616] transition-all cursor-pointer"
              >
                Add New Product
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
