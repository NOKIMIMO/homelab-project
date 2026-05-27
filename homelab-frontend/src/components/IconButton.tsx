import React from 'react';

interface IconButtonProps {
  icon: string;
  tooltip?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({ 
  icon, 
  tooltip, 
  onClick,
  disabled = false 
}) => {
  return (
    <button 
      className="icon-button"
      onClick={onClick}
      title={tooltip}
      disabled={disabled}
      aria-label={tooltip}
    >
      <span className="icon">{icon}</span>
    </button>
  );
};
