import type { Order, WarehouseStock, CustomerCredit, PriceTier } from '../types';

// Banker's Rounding (ปัดเศษ .5 ไปหาเลขคู่)
export const bankersRounding = (num: number): number => {
  const m = 100; // 2 decimal places
  const n = +(num * m).toFixed(8);
  const i = Math.floor(n);
  const f = n - i;
  if (f > 0.5 - 1e-8 && f < 0.5 + 1e-8) {
    return (i % 2 === 0 ? i : i + 1) / m;
  }
  return Math.round(n) / m;
};

export const runAutoAllocation = (
  orders: Order[],
  initialStocks: WarehouseStock[],
  initialCredits: CustomerCredit[],
  prices: PriceTier[]
) => {
  const stocks = structuredClone(initialStocks);
  const credits = structuredClone(initialCredits);
  const allocatedOrders: Order[] = [];

  // 1. Sorting: VIP > EMERGENCY > OVERDUE > DAILY > FIFO (Create Date)
  const sortedOrders = [...orders].sort((a, b) => {
    const aVip = a.remark?.includes('VIP') ? 1 : 0;
    const bVip = b.remark?.includes('VIP') ? 1 : 0;
    if (aVip !== bVip) return bVip - aVip; // กฎของธุรกิจ (VIP ก่อน)

    const typePriority = { 'EMERGENCY': 1, 'OVERDUE': 2, 'DAILY': 3 };
    if (typePriority[a.type] !== typePriority[b.type]) {
      return typePriority[a.type] - typePriority[b.type]; // เรียงตาม Type
    }
    return new Date(a.createDate).getTime() - new Date(b.createDate).getTime(); // เรียงตามความเก่า (FIFO)
  });

  // 2. Allocation Logic
  for (const order of sortedOrders) {
    const currentOrder = { ...order, allocatedQty: 0, status: 'PENDING' as Order['status'] };
    const customerCredit = credits.find(c => c.customerId === order.customerId);
    
    if (!customerCredit) {
      currentOrder.status = 'CREDIT_LIMIT';
      allocatedOrders.push(currentOrder);
      continue;
    }

    // 2.1 หา Source สต็อกที่ตรงเงื่อนไข
    let validStocks = stocks.filter(s => s.itemId === order.itemId && s.remainingQty > 0);
    if (order.warehouseId !== 'WH-000') validStocks = validStocks.filter(s => s.warehouseId === order.warehouseId);
    if (order.supplierId !== 'SP-000') validStocks = validStocks.filter(s => s.supplierId === order.supplierId);

    // 2.2 กฎ WH-000/SP-000: ดึงจากที่ที่สต็อกเยอะสุดก่อน
    validStocks.sort((a, b) => b.remainingQty - a.remainingQty);

    let qtyNeeded = order.request;
    let qtyAllocated = 0;

    for (const stock of validStocks) {
      if (qtyNeeded <= 0) break;

      // 2.3 คำนวณราคาตาม Supplier ของสต็อกนั้นๆ + ตัวคูณตาม Type
      const priceInfo = prices.find(p => p.itemId === stock.itemId && p.supplierId === stock.supplierId);
      const basePrice = priceInfo ? priceInfo.basePrice : 100;
      const multiplier = order.type === 'EMERGENCY' ? 1.25 : order.type === 'OVERDUE' ? 1.00 : 0.90;
      const unitPrice = bankersRounding(basePrice * multiplier);

      // 2.4 เช็คเครดิตและตัดสต็อก
      const availableCredit = bankersRounding(customerCredit.maxCredit - customerCredit.usedCredit);
      const maxAffordableQty = Math.floor(availableCredit / unitPrice);
      
      const qtyToTake = Math.min(qtyNeeded, stock.remainingQty, maxAffordableQty);

      if (qtyToTake > 0) {
        qtyAllocated += qtyToTake;
        stock.remainingQty -= qtyToTake;
        customerCredit.usedCredit = bankersRounding(customerCredit.usedCredit + (qtyToTake * unitPrice));
        qtyNeeded -= qtyToTake;
      }

      // ถ้าเงินหมดกลางทาง ให้หยุดหาโกดังอื่นต่อ
      if (customerCredit.usedCredit >= customerCredit.maxCredit) break;
    }

    currentOrder.allocatedQty = qtyAllocated;

    // 2.5 สรุป Status
    const isCreditEmpty = bankersRounding(customerCredit.maxCredit - customerCredit.usedCredit) <= 0;
    if (qtyAllocated === 0) {
      currentOrder.status = isCreditEmpty ? 'CREDIT_LIMIT' : 'OUT_OF_STOCK';
    } else if (qtyAllocated < order.request) {
      currentOrder.status = 'PARTIAL';
    } else {
      currentOrder.status = 'ALLOCATED';
    }

    allocatedOrders.push(currentOrder);
  }

  return { updatedOrders: allocatedOrders, updatedStocks: stocks, updatedCredits: credits };
};