interface AutoAllocateButtonProps {
  onClick: () => void;
}

export default function AutoAllocateButton({ onClick }: AutoAllocateButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm font-semibold text-sm transition-all active:scale-95 w-full md:w-auto"
    >
      Run Auto Allocation
    </button>
  );
}