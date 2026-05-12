interface HeaderProps {
  totalRemainingStock: number;
}

export default function Header({ totalRemainingStock}: HeaderProps) {
  return (
    <header className="bg-blue-900 border-b p-6 shadow-sm z-10 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-white">Salmon Allocation</h1>
      </div>
      <div className="bg-blue-50 p-3 rounded text-right border border-blue-100">
         <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Total Stock Remaining</p>
         <p className="text-2xl font-bold text-blue-900">{totalRemainingStock.toLocaleString()}</p>
      </div>
    </header>
  );
}