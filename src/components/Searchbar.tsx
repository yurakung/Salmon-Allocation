import type { Dispatch, SetStateAction } from 'react';

interface SearchbarProps {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  searchField: string;
  setSearchField: Dispatch<SetStateAction<string>>;
}

export default function Searchbar({ searchTerm, setSearchTerm, searchField, setSearchField }: SearchbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md-w-auto">
      {/* Dropdown สำหรับเลือกประเภทการค้นหา */}
      <select 
        value={searchField}
        onChange={(e) => setSearchField(e.target.value)}
        className="w-full sm:w-auto p-2 border border-gray-300 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 cursor-pointer"
      >
        <option value="ALL">All (Order, Customer)</option>
        <option value="subOrderId">Sub Order</option>
        <option value="itemId">Item ID</option>
        <option value="warehouseId">WH ID</option>
        <option value="supplierId">SP ID</option>
        <option value="type">Type</option>
        <option value="customerId">Customer ID</option>
      </select>

      {/* ช่องพิมพ์ค้นหา */}
      <input 
        type="text" 
        placeholder={`Search by ${searchField === 'ALL' ? 'keyword' : searchField}...`} 
        className="w-full sm:w-64 p-2 border border-gray-300 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />  
    </div>
  );
}