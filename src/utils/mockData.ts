import type { Order, WarehouseStock, CustomerCredit, PriceTier } from '../types';

// 1. ข้อมูลราคาตามรูป (ตั้ง Base Price ไว้ที่ 100% คือ 99.75)
export const mockPrices: PriceTier[] = [
  { itemId: 'Item-1', supplierId: 'SP-001', basePrice: 99.75 },
  { itemId: 'Item-2', supplierId: 'SP-002', basePrice: 150.00 },
  { itemId: 'Item-1', supplierId: 'SP-002', basePrice: 105.00 }, // สมมติราคา Supplier อื่น
];

// 2. ข้อมูลสต็อก (สมมติขึ้นเพื่อให้ระบบมีของตัด)
export const mockStocks: WarehouseStock[] = [
  { warehouseId: 'WH-001', supplierId: 'SP-001', itemId: 'Item-1', remainingQty: 5000 },
  { warehouseId: 'WH-002', supplierId: 'SP-001', itemId: 'Item-1', remainingQty: 2000 },
  { warehouseId: 'WH-001', supplierId: 'SP-002', itemId: 'Item-1', remainingQty: 8000 },
  { warehouseId: 'WH-002', supplierId: 'SP-002', itemId: 'Item-2', remainingQty: 10000 },
];

// 3. ข้อมูลเครดิตลูกค้า
export const mockCredits: CustomerCredit[] = [
  { customerId: 'CT-0001', maxCredit: 500000, usedCredit: 0 },
  { customerId: 'CT-0002', maxCredit: 10000, usedCredit: 0 }, // CT-0002 วงเงินน้อย เพื่อทดสอบ Credit Limit
];

// 4. สร้างออเดอร์ 5,000 รายการ โดยมี 4 รายการแรกตรงกับภาพเป๊ะๆ
export const generateMockOrders = (): Order[] => {
  const baseOrders: Order[] = [
    { orderId: 'ORDER-0001', subOrderId: 'ORDER-0001-001', itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', request: 11, type: 'DAILY', createDate: '2025-01-01', customerId: 'CT-0001' },
    { orderId: 'ORDER-0001', subOrderId: 'ORDER-0001-002', itemId: 'Item-2', warehouseId: 'WH-002', supplierId: 'SP-000', request: 20, type: 'DAILY', createDate: '2025-01-01', customerId: 'CT-0001' },
    { orderId: 'ORDER-0002', subOrderId: 'ORDER-0002-001', itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-002', request: 300, type: 'EMERGENCY', createDate: '2025-03-01', customerId: 'CT-0002', remark: 'Special for VIP' },
    { orderId: 'ORDER-0002', subOrderId: 'ORDER-0002-002', itemId: 'Item-2', warehouseId: 'WH-000', supplierId: 'SP-000', request: 100, type: 'EMERGENCY', createDate: '2025-03-01', customerId: 'CT-0002', remark: 'Special for VIP' },
  ];

  // สุ่มเพิ่มอีก 4996 รายการ
  const types: Order['type'][] = ['EMERGENCY', 'OVERDUE', 'DAILY'];
  for (let i = 3; i <= 5000; i++) {
    baseOrders.push({
      orderId: `ORDER-${String(i).padStart(4, '0')}`,
      subOrderId: `ORDER-${String(i).padStart(4, '0')}-001`,
      itemId: 'Item-1',
      warehouseId: 'WH-000',
      supplierId: 'SP-000',
      request: Math.floor(Math.random() * 50) + 1,
      type: types[Math.floor(Math.random() * types.length)],
      createDate: '2025-04-01',
      customerId: 'CT-0001',
    });
  }
  return baseOrders;
};