import { useState, useMemo, useRef, useEffect, useDeferredValue, useCallback } from 'react';
import Header from './components/Header';
import AllocationTable from './components/AllocationTable';
import { generateMockOrders, mockStocks, mockCredits, mockPrices } from './utils/mockData';
import { runAutoAllocation, bankersRounding } from './utils/allocationLogic';
import type { Order, WarehouseStock, CustomerCredit } from './types';
import Searchbar from './components/Searchbar';
import ManualAllocationModal from './components/ManualAllocationModal';
import Dashboard from './components/Dashboard';
import AutoAllocateButton from './components/AutoAllocateButton';

function App() {
  // --- 1. States ---
  const [orders, setOrders] = useState<Order[]>(generateMockOrders);
  const [stocks, setStocks] = useState<WarehouseStock[]>(mockStocks);
  const [credits, setCredits] = useState<CustomerCredit[]>(mockCredits);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [searchField, setSearchField] = useState('ALL');
  
  // State สำหรับเก็บว่ากำลังแก้ Order ไหนอยู่ (ถ้าเป็น null คือปิด Modal)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  const hasRunAutoAlloc = useRef(false);

  // --- 2. Auto-Allocation on Page Load ---
  useEffect(() => {
    if (hasRunAutoAlloc.current) return;
    const { updatedOrders, updatedStocks, updatedCredits } = runAutoAllocation(
      orders, stocks, credits, mockPrices
    );
    setOrders(updatedOrders);
    setStocks(updatedStocks);
    setCredits(updatedCredits);
    hasRunAutoAlloc.current = true;
  }, [orders, stocks, credits]);

  // --- 3. Derived Data ---
  const totalRemainingStock = useMemo(() => {
    return stocks.reduce((sum, s) => sum + s.remainingQty, 0);
  }, [stocks]);

  const totalRemainingCredit = useMemo(() => {
    return credits.reduce((sum, c) => sum + bankersRounding(c.maxCredit - c.usedCredit), 0);
  }, [credits]);

  const orderStats = useMemo(() => {
    return orders.reduce((acc, order) => {
      acc[order.type] = (acc[order.type] || 0) + 1;
      return acc;
    }, { EMERGENCY: 0, OVERDUE: 0, DAILY: 0 });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const lower = deferredSearchTerm.toLowerCase();
    return orders.filter(o => {
      if (searchField === 'ALL') {
        return o.orderId.toLowerCase().includes(lower) ||
               o.customerId.toLowerCase().includes(lower);
      }
      const targetValue = String(o[searchField as keyof Order] || '').toLowerCase();
      return targetValue.includes(lower); 
    });
  }, [orders, deferredSearchTerm, searchField]);

  // --- 4. Handlers ---
  const handleEditClick = useCallback((order: Order) => {
    setEditingOrder(order);
  }, []);

  // ฟังก์ชันนีปุ่ม Auto Allocate 
  const handleRunAutoAllocationClick = useCallback(() => {
    // 1. ดึงข้อมูลดิบตั้งต้น (Mock Data) มาใหม่ทั้งหมด เพื่อรีเซ็ตค่าที่เคย Manual ไว้
    const initialOrders = typeof generateMockOrders === 'function' ? generateMockOrders() : structuredClone(generateMockOrders);
    const initialStocks = structuredClone(mockStocks);
    const initialCredits = structuredClone(mockCredits);

    // 2. โยนเข้าฟังก์ชัน Auto Allocation
    const { updatedOrders, updatedStocks, updatedCredits } = runAutoAllocation(
      initialOrders, initialStocks, initialCredits, mockPrices
    );

    // 3. อัปเดต State ทั้งหมด
    setOrders(updatedOrders);
    setStocks(updatedStocks);
    setCredits(updatedCredits);
    
    alert('✅ ระบบได้ทำการ Run Auto Allocation ใหม่เรียบร้อยแล้ว!');
  }, []);

  const handleManualConfirm = (subOrderId: string, val: number | string) => {
    let newQty = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(newQty) || newQty < 0) newQty = 0;

    const orderIndex = orders.findIndex(o => o.subOrderId === subOrderId);
    if (orderIndex === -1) return;
    const order = orders[orderIndex];

    if (newQty > order.request) newQty = order.request;
    
    // หาผลต่าง (เช่น จาก 50 ไป 40 -> deltaQty = -10 แปลว่าต้องคืนของ 10 ชิ้น)
    const oldQty = order.allocatedQty || 0;
    const deltaQty = newQty - oldQty;
    
    if (deltaQty === 0) {
      setEditingOrder(null); 
      return;
    }
    
    // คำนวณราคาต่อหน่วยสำหรับออเดอร์นี้
    const priceInfo = mockPrices.find(p => p.itemId === order.itemId && (p.supplierId === order.supplierId || order.supplierId === 'SP-000'));
    const basePrice = priceInfo ? priceInfo.basePrice : 100;
    const multiplier = order.type === 'EMERGENCY' ? 1.25 : order.type === 'OVERDUE' ? 1.00 : 0.90;
    const unitPrice = bankersRounding(basePrice * multiplier);
    
    // ผลต่างของเงินที่ต้องใช้เพิ่ม (หรือได้คืนถ้าติดลบ)
    const deltaCost = bankersRounding(deltaQty * unitPrice);

    // ก๊อปปี้ State เพื่อเตรียมอัปเดต
    const updatedStocks = structuredClone(stocks);
    const updatedCredits = structuredClone(credits);
    const customerCredit = updatedCredits.find(c => c.customerId === order.customerId);

    // Validation (ทำเฉพาะตอนที่ User "เพิ่ม" จำนวน)
    if (deltaQty > 0) {
      // เช็คสต็อก
      const validStocks = updatedStocks.filter(s => s.itemId === order.itemId && (order.warehouseId === 'WH-000' || s.warehouseId === order.warehouseId) && (order.supplierId === 'SP-000' || s.supplierId === order.supplierId));
      const totalAvailable = validStocks.reduce((sum, s) => sum + s.remainingQty, 0);
      
      if (deltaQty > totalAvailable) {
        alert('❌ สต็อกแซลมอนไม่พอสำหรับการจัดสรรเพิ่ม!');
        return;
      }

      // เช็คเครดิต
      if (customerCredit && bankersRounding(customerCredit.usedCredit + deltaCost) > customerCredit.maxCredit) {
        alert(`⛔ การจัดสรรนี้ใช้เงินเกินวงเงินเครดิตคงเหลือของลูกค้า (${order.customerId})`);
        return;
      }
    }

    // อัปเดตเครดิต (หักเงินเพิ่ม หรือ คืนเงิน)
    if (customerCredit) {
      customerCredit.usedCredit = bankersRounding(customerCredit.usedCredit + deltaCost);
    }

    // อัปเดตสต็อก (ตัดสต็อก หรือ คืนสต็อก)
    let remainingDelta = Math.abs(deltaQty);
    if (deltaQty > 0) {
      // กรณีเพิ่มของ: วิ่งหาโกดังที่มีของแล้วทยอยหัก
      const validStocks = updatedStocks.filter(s => s.itemId === order.itemId && s.remainingQty > 0 && (order.warehouseId === 'WH-000' || s.warehouseId === order.warehouseId) && (order.supplierId === 'SP-000' || s.supplierId === order.supplierId));
      for (const s of validStocks) {
        if (remainingDelta <= 0) break;
        const deduct = Math.min(s.remainingQty, remainingDelta);
        s.remainingQty -= deduct;
        remainingDelta -= deduct;
      }
    } else {
      // กรณีลดของ: คืนของกลับเข้าโกดัง (คืนเข้าอันแรกที่หาเจอ)
      const targetStock = updatedStocks.find(s => s.itemId === order.itemId && (order.warehouseId === 'WH-000' || s.warehouseId === order.warehouseId) && (order.supplierId === 'SP-000' || s.supplierId === order.supplierId));
      if (targetStock) targetStock.remainingQty += remainingDelta;
    }

    // อัปเดตตารางออเดอร์
    const updatedOrders = [...orders];
    updatedOrders[orderIndex] = { 
      ...order, 
      allocatedQty: newQty, 
      status: newQty === order.request ? 'ALLOCATED' : newQty > 0 ? 'PARTIAL' : 'PENDING'
    };
    
    // เซฟ State ทั้งหมดลง React
    setOrders(updatedOrders);
    setStocks(updatedStocks);  
    setCredits(updatedCredits);  
    setEditingOrder(null);
  };

  // --- 5. Render Components ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      <Header 
        totalRemainingStock={totalRemainingStock}
      />

      <main className="flex-1 p-3 md:p-6 flex flex-col overflow-hidden">
        <Dashboard 
          totalRemainingCredit={totalRemainingCredit} 
          orderStats={orderStats}
          credits={credits}
        />
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center mb-4 gap-4 shrink-0">
          
          <Searchbar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchField={searchField}
            setSearchField={setSearchField}
          />
          
          {/* เรียกใช้งานปุ่ม Auto Allocate ตรงนี้ */}
          <AutoAllocateButton onClick={handleRunAutoAllocationClick} />

        </div>
        
        {/* onEditClick ให้ตาราง เพื่อบอกว่าให้เอา Order ไหนมาเปิด Modal */}
        <div className="flex-1 overflow-hidden min-h-[300px] mt-2">
          <AllocationTable 
            filteredOrders={filteredOrders} 
            onEditClick={handleEditClick} 
          />
        </div>
      </main>

      {editingOrder && (
        <ManualAllocationModal
          order={editingOrder}
          stocks={stocks}
          credits={credits}
          prices={mockPrices}
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          onConfirm={handleManualConfirm}
        />
      )}
    </div>
  );
}

export default App;