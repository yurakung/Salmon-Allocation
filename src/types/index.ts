export type OrderType = 'EMERGENCY' | 'OVERDUE' | 'DAILY';

export interface Order {
  orderId: string;
  subOrderId: string;
  itemId: string;
  warehouseId: string;
  supplierId: string;
  request: number; 
  type: OrderType;
  createDate: string;
  customerId: string;
  remark?: string;
  
  // สำหรับเก็บผลลัพธ์
  allocatedQty?: number;
  status?: 'PENDING' | 'ALLOCATED' | 'PARTIAL' | 'OUT_OF_STOCK' | 'CREDIT_LIMIT';
}

export interface PriceTier {
  itemId: string;
  supplierId: string;
  basePrice: number; // ราคาตั้งต้น (OVERDUE 100%)
}

export interface WarehouseStock {
  warehouseId: string;
  supplierId: string;
  itemId: string;
  remainingQty: number;
}

export interface CustomerCredit {
  customerId: string;
  maxCredit: number;
  usedCredit: number;
}