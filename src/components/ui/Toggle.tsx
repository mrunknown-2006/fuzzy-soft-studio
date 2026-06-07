import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export default function Toggle({ checked, onChange, disabled = false, label }: ToggleProps) {
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div 
      className={`flex items-center gap-3 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} 
      onClick={handleToggle}
    >
      <button
        type="button"
        disabled={disabled}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-[#22c55e]' : 'bg-[#d1d5db]'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-heading">
          {label}
        </span>
      )}
    </div>
  );
}
