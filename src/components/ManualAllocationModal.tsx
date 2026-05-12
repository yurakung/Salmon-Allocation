import { useState, useEffect } from 'react';
import type { Order, WarehouseStock, CustomerCredit, PriceTier } from '../types';
import { bankersRounding } from '../utils/allocationLogic';

interface ManualAllocationModalProps {
  order: Order;
  stocks: WarehouseStock[];
  credits: CustomerCredit[];
  prices: PriceTier[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (subOrderId: string, newQty: number) => void;
}

export default function ManualAllocationModal({
  order,
  stocks,
  credits,
  prices,
  isOpen,
  onClose,
  onConfirm,
}: ManualAllocationModalProps) {
  const [inputVal, setInputVal] = useState<string>('');

  // 1. ดึงข้อมูลที่เกี่ยวข้อง
  const customerCredit = credits.find(c => c.customerId === order.customerId);
  const totalItemStock = stocks.filter(s => s.itemId === order.itemId).reduce((sum, s) => sum + s.remainingQty, 0);
  
  // 2. คำนวณราคาต่อหน่วย
  const priceInfo = prices.find(p => p.itemId === order.itemId && (p.supplierId === order.supplierId || order.supplierId === 'SP-000'));
  const basePrice = priceInfo ? priceInfo.basePrice : 100;
  const multiplier = order.type === 'EMERGENCY' ? 1.25 : order.type === 'OVERDUE' ? 1.00 : 0.90;
  const unitPrice = bankersRounding(basePrice * multiplier);

  // 3. จำลองการ "คืนค่า (Refund)" สต็อกและเครดิตชั่วคราว
  const currentAllocatedQty = order.allocatedQty || 0;
  const currentAllocatedCost = bankersRounding(currentAllocatedQty * unitPrice);

  const availableStock = totalItemStock + currentAllocatedQty; 
  
  const baseAvailableCredit = customerCredit ? bankersRounding(customerCredit.maxCredit - customerCredit.usedCredit) : 0;
  const totalUsableCredit = bankersRounding(baseAvailableCredit + currentAllocatedCost);

  //  4. คำนวณ Max Allocatable (รองรับทศนิยม 2 ตำแหน่ง)
  
  const rawAffordable = unitPrice > 0 ? totalUsableCredit / unitPrice : order.request;
  const affordableQty = Math.floor(rawAffordable * 100) / 100; 
  
  const maxAllocatable = Math.min(order.request, availableStock);
  const Max = Math.min(maxAllocatable, affordableQty);

  // ตั้งค่าเริ่มต้นของ Input เมื่อเปิด Modal
  useEffect(() => {
    if (isOpen) {
      setInputVal(order.allocatedQty !== undefined ? order.allocatedQty.toString() : '');
    }
  }, [isOpen, order.allocatedQty]);

  if (!isOpen) return null;

  const handleMaxClick = () => setInputVal(Max.toString());
  const handleClearClick = () => setInputVal('');

  const handleConfirm = () => {

    let finalQty = parseFloat(inputVal);
    if (isNaN(finalQty) || finalQty < 0) finalQty = 0;
    
    if (finalQty > Max) {
      alert(`ไม่สามารถจัดสรรได้เกิน ${Max} kg (ตรวจสอบสต็อกหรือวงเงิน)`);
      return;
    }
    onConfirm(order.subOrderId, finalQty);
  };

  const currentPreviewPrice = bankersRounding((parseFloat(inputVal) || 0) * unitPrice);

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="bg-white w-full max-w-[500px] mx-4 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manual Allocation</h2>
            <p className="text-xs text-gray-500 mt-1">{order.orderId} · {order.subOrderId}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition">
             ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* ข้อมูล Order */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm mb-6">
            <div>
              <p className="text-gray-500 mb-1">Customer</p>
              <p className="font-semibold">{order.customerId}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Item</p>
              <p className="font-semibold">{order.itemId}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Warehouse</p>
              <p className="font-semibold">{order.warehouseId === 'WH-000' ? 'Any (WH-000)' : order.warehouseId}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Supplier</p>
              <p className="font-semibold">{order.supplierId === 'SP-000' ? 'Any (SP-000)' : order.supplierId}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Type</p>
              <p className="font-semibold uppercase">{order.type}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Requested</p>
              <p className="font-semibold">{order.request} kg</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 mb-1">Remark</p>
              <p className="font-semibold">{order.remark || 'No remark'}</p>
            </div>
          </div>

          {/* สรุปข้อมูล (กล่องสีฟ้า) */}
          <div className="bg-blue-50/50 rounded-xl p-4 text-sm mb-6 border border-blue-100">
            <div className="flex justify-between mb-3 text-blue-700">
              <span>Available stock <span className="text-xs opacity-70">(after releasing current)</span></span>
              <span className="font-bold">{availableStock} kg</span>
            </div>
            <div className="flex justify-between mb-3 text-blue-700">
              <span>Customer credit available <span className="text-xs opacity-70">(limit {customerCredit?.maxCredit.toLocaleString()})</span></span>
              <span className="font-bold">${totalUsableCredit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-blue-200/60 text-blue-900 font-bold">
              <span>Max allocatable</span>
              {/* แสดงตัวเลข Max ที่คำนวณทศนิยมแล้ว */}
              <span>{maxAllocatable} kg</span> 
            </div>
          </div>

          {/* Input & Price Preview */}
          <div className="mb-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">New Allocation (kg)</label>
            <div className="flex gap-2">
              <input 
                type="number"
                min="0"
                max={Max}
                step="0.01" /*  สำคัญมาก: บอก Browser ให้รับค่าทศนิยมได้ */
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <button onClick={handleMaxClick} className="px-4 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition">Max</button>
              <button onClick={handleClearClick} className="px-4 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition">Clear</button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-center text-sm flex justify-between items-center text-gray-600">
            <span>Price preview</span>
    
            <span className="font-medium">{(parseFloat(inputVal) || 0)} kg × ${unitPrice.toFixed(2)} = <span className="text-blue-600 font-bold">${currentPreviewPrice.toLocaleString()}</span></span>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition">
            Cancel
          </button>
          <button onClick={handleConfirm} className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
            Confirm Allocation
          </button>
        </div>

      </div>
    </div>
  );
}