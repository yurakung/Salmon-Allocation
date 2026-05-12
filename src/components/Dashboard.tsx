import { useState } from 'react';
import type { CustomerCredit } from '../types';

interface OrderStats {
  EMERGENCY: number;
  OVERDUE: number;
  DAILY: number;
}

interface DashboardProps {
  totalRemainingCredit: number;
  orderStats: OrderStats;
  credits: CustomerCredit[];
}

export default function Dashboard({ totalRemainingCredit, orderStats, credits }: DashboardProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>('ALL');
  
  let displayedCredit = totalRemainingCredit;
  if (selectedCustomer !== 'ALL') {
    const customer = credits.find(c => c.customerId === selectedCustomer);
    if (customer) {
      // เอาวงเงินสูงสุด - เงินที่ใช้ไป (แล้วปัดเศษทศนิยม 2 ตำแหน่ง)
      displayedCredit = Number((customer.maxCredit - customer.usedCredit).toFixed(2));
    } else {
      displayedCredit = 0;
    }
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-5 shrink-0">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col justify-center">
        <div className="flex justify-between items-start mb-1 gap-2">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Credit Available</p>
          
          {/*  Dropdown เลือก Customer */}
          <select 
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="text-[10px] border border-gray-300 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-700 cursor-pointer max-w-[90px] truncate"
          >
            <option value="ALL">All Total</option>
            {credits.map(c => (
              <option key={c.customerId} value={c.customerId}>{c.customerId}</option>
            ))}
          </select>
        </div>
        <p className="text-xl md:text-2xl font-bold text-blue-600">${displayedCredit.toLocaleString()}</p>
      </div>
      
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 border-l-4 border-l-red-500 flex flex-col justify-center">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Emergency Orders</p>
        <p className="text-2xl font-bold text-gray-900">{orderStats.EMERGENCY.toLocaleString()} <span className="text-sm font-normal text-gray-400">รายการ</span></p>
      </div>
      
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 border-l-4 border-l-orange-500 flex flex-col justify-center">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Overdue Orders</p>
        <p className="text-2xl font-bold text-gray-900">{orderStats.OVERDUE.toLocaleString()} <span className="text-sm font-normal text-gray-400">รายการ</span></p>
      </div>
      
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 border-l-4 border-l-green-500 flex flex-col justify-center">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Daily Orders</p>
        <p className="text-2xl font-bold text-gray-900">{orderStats.DAILY.toLocaleString()} <span className="text-sm font-normal text-gray-400">รายการ</span></p>
      </div>
    </div>
  );
}