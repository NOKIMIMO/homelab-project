import React from 'react';
import { Search } from 'lucide-react';

interface TextInputProps {
  placeholder?: string;
  label?: string;
  stateKey?: string;
  buttonLabel?: string;
  value?: string;
  onChange?: (val: string) => void;
  onSubmit?: () => void;
}

export const TextInput: React.FC<TextInputProps> = ({
  placeholder = '',
  label,
  buttonLabel = 'Search',
  value = '',
  onChange,
  onSubmit,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSubmit?.();
  };

  return (
    <div className="flex flex-col gap-1 flex-1 min-w-48">
      {label && <label className="text-sm font-semibold">{label}</label>}
      <div className="join w-full">
        <input
          type="text"
          className="input input-bordered join-item flex-1"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {onSubmit && (
          <button
            type="button"
            className="btn btn-primary join-item gap-2"
            onClick={onSubmit}
          >
            <Search size={16} />
            {buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
};
