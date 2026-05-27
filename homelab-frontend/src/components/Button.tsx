import React from 'react';

interface ButtonProps {
  label: string;
  icon?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

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
      className="button"
    >
      {icon && <span className="icon">{icon}</span>}
      {label}
    </button>
  );
};
