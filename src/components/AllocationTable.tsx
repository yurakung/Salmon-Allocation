import { useRef, memo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Order } from '../types';

interface AllocationTableProps {
  filteredOrders: Order[];
  onEditClick: (order: Order) => void;
}

function AllocationTable({ filteredOrders, onEditClick }: AllocationTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // --- States สำหรับ Pagination ---
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // รีเซ็ตหน้าเมื่อข้อมูลเปลี่ยน
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredOrders.length]);

  // คำนวณข้อมูลที่จะแสดงในหน้านั้นๆ
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredOrders.length);
  const displayedOrders = filteredOrders.slice(startIndex, endIndex);

  // Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: displayedOrders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  // เลื่อนตารางขึ้นบนสุดเวลาเปลี่ยนหน้า
  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [currentPage, pageSize]);

  //  สร้างฟังก์ชันสำหรับ Render แถบ Pagination
  const renderPagination = (isTop: boolean) => (
    <div className={`flex flex-col md:flex-row justify-between items-center gap-3 p-3 md:p-4 ${isTop ? 'border-b' : 'border-t'} border-gray-200 bg-gray-50 text-xs md:text-sm text-gray-600 shrink-0`}>
      {/* เลือกจำนวนที่แสดง */}
      <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3">
        <span>Rows per page:</span>
        <select 
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="border border-gray-300 rounded p-1.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
        >
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
        </select>
      </div>

      {/* บอกสถานะการแสดงผล */}
      <div>
        Showing <span className="font-semibold text-gray-900">{filteredOrders.length === 0 ? 0 : startIndex + 1}</span> - <span className="font-semibold text-gray-900">{endIndex}</span> of <span className="font-semibold text-gray-900">{filteredOrders.length}</span>
      </div>

      {/* ปุ่มเปลี่ยนหน้า */}
      <div className="flex gap-2 items-center">
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 border border-gray-300 rounded hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors font-medium cursor-pointer disabled:cursor-not-allowed"
        >
          Prev
        </button>
        <span className="px-3 py-1.5">
          Page {currentPage} of {totalPages}
        </span>
        <button 
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 border border-gray-300 rounded hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors font-medium cursor-pointer disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white h-full border rounded-xl shadow-sm flex flex-col overflow-hidden">
      
      {/* ส่วนหัว Pagination */}
      {renderPagination(true)}

      {/* ส่วนตารางที่สามารถ Scroll แนวนอนได้บนมือถือ */}
      <div className="flex-1 flex flex-col overflow-x-auto bg-white">
        <div className="min-w-[1000px] flex flex-col h-full">
          
          {/* Header ตาราง */}
          <div className="flex bg-gray-100 border-b border-gray-200 font-bold text-[11px] uppercase tracking-wider p-3 text-gray-700 shrink-0">
            <div className="w-[8%]">Order</div>
            <div className="w-[12%]">Sub Order</div>
            <div className="w-[6%]">Item ID</div>
            <div className="w-[6%]">WH ID</div>
            <div className="w-[6%]">SP ID</div>
            <div className="w-[6%] text-center">Req.</div>
            <div className="w-[8%]">Type</div>
            <div className="w-[8%]">Create Date</div>
            <div className="w-[8%]">Customer</div>
            <div className="w-[10%]">Remark</div>
            <div className="w-[10%] text-center text-blue-600">Allocated</div>
            <div className="w-[12%] text-right pr-4">Status</div>
          </div>

          {/* Body ตาราง */}
          <div ref={parentRef} className="flex-1 overflow-y-auto bg-white">
            {displayedOrders.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                ไม่พบข้อมูลออเดอร์
              </div>
            ) : (
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const order = displayedOrders[virtualRow.index];
                  return (
                    <div 
                      key={virtualRow.key}
                      className="absolute top-0 left-0 w-full flex items-center p-3 border-b border-gray-100 text-xs hover:bg-gray-50 transition-colors"
                      style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <div className="w-[8%] font-semibold text-gray-900">{order.orderId}</div>
                      <div className="w-[12%] text-gray-500">{order.subOrderId}</div>
                      <div className="w-[6%]">{order.itemId}</div>
                      <div className="w-[6%]">{order.warehouseId}</div>
                      <div className="w-[6%]">{order.supplierId}</div>
                      <div className="w-[6%] text-center font-bold text-gray-800">{order.request}</div>
                      <div className="w-[8%]">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          order.type === 'EMERGENCY' ? 'bg-red-100 text-red-700' : 
                          order.type === 'OVERDUE' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {order.type}
                        </span>
                      </div>
                      <div className="w-[8%] text-gray-600">{order.createDate}</div>
                      <div className="w-[8%]">{order.customerId}</div>
                      <div className="w-[10%] text-gray-500 italic truncate pr-2">{order.remark || '-'}</div>
                      
                      <div className="w-[10%] flex justify-center items-center gap-2 group">
                        <span className="font-semibold text-gray-900">{order.allocatedQty ?? '-'}</span>
                        <button 
                          onClick={() => onEditClick(order)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Edit Allocation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                        </button>
                      </div>

                      <div className="w-[12%] text-right font-medium pr-4 text-[11px]">
                        {order.status === 'ALLOCATED' && <span className="text-green-600">FULL</span>}
                        {order.status === 'PARTIAL' && <span className="text-orange-600">PARTIALLY</span>}
                        {order.status === 'OUT_OF_STOCK' && <span className="text-red-600">OUT OF STOCK</span>}
                        {order.status === 'CREDIT_LIMIT' && <span className="text-purple-600">CREDIT LIMIT</span>}
                        {(!order.status || order.status === 'PENDING') && <span className="text-gray-400">PENDING</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ส่วนท้าย Pagination */}
      {renderPagination(false)}

    </div>
  );
}

export default memo(AllocationTable);