import React from 'react';
import { Upload, RefreshCw, X, Check, Save, Image as ImageIcon } from 'lucide-react';

interface ButtonProps {
  label: string;
  icon?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const getIcon = (iconName?: string) => {
  switch (iconName?.toLowerCase()) {
    case 'upload': return <Upload size={18} />;
    case 'refresh': return <RefreshCw size={18} />;
    case 'close': return <X size={18} />;
    case 'check': return <Check size={18} />;
    case 'save': return <Save size={18} />;
    case 'image': return <ImageIcon size={18} />;
    default: return null;
  }
};

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  icon, 
  onClick, 
  type = 'button',
  disabled = false 
}) => {
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${icon ? 'btn-primary' : 'btn-neutral'}`}
    >
      {icon && getIcon(icon)}
      {label}
    </button>
  );
};
