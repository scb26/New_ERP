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
  <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[24px] relative overflow-hidden group hover:border-blue-500/20 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-12 bg-blue-500/5 rounded-xl flex items-center justify-center text-blue-500">
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${trendType === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
        {trendType === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        {trend}
      </div>
    </div>
    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{label}</p>
    <h3 className="text-3xl font-black mt-1 text-white tracking-tight">{value}</h3>
    <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
      <Icon size={120} />
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Revenue" value={`₹${(stats.totalSales || 0).toLocaleString()}`} trend="+12.5%" trendType="up" icon={TrendingUp} />
        <StatCard label="Procurement" value={`₹${(stats.purchaseVolume || 0).toLocaleString()}`} trend="Stock In" trendType="up" icon={Truck} />
        <StatCard label="Total Invoices" value={stats.invoiceCount} trend="+3 new" trendType="up" icon={Users} />
        <StatCard label="Inv. Products" value={stats.activeProducts} trend="Stable" trendType="up" icon={Package} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">Recent Transactions</h3>
            <button 
              onClick={() => onNavigate('sales')}
              className="text-xs font-bold text-blue-500 hover:text-white transition-colors"
            >
              View All Invoices
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-white/5">
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
                  <tr key={inv.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="py-4 font-bold text-blue-500">{inv.id}</td>
                    <td className="py-4 text-gray-300">{inv.customer || 'Walk-in'}</td>
                    <td className="py-4 text-gray-500 text-xs">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="py-4 text-right font-black">₹{inv.total.toLocaleString()}</td>
                    <td className="py-4 text-center">
                      <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-md">PAID</span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-gray-600 font-bold uppercase tracking-widest text-xs">No recent activity detected</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-8">
            <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
            <div className="space-y-4">
              <button 
                onClick={() => onNavigate('bill')}
                className="w-full p-4 bg-blue-600 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:bg-blue-700 transition-all"
              >
                <Plus size={18} /> Create New Invoice
              </button>
              <button 
                onClick={() => onNavigate('purchases')}
                className="w-full p-4 bg-orange-600 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm shadow-[0_10px_20px_rgba(234,88,12,0.2)] hover:bg-orange-700 transition-all text-white"
              >
                <Truck size={18} /> Record Purchase
              </button>
              <button 
                onClick={() => onNavigate('inventory')}
                className="w-full p-4 bg-[#111111] border border-white/5 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm text-gray-300 hover:bg-[#161616] transition-all"
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
