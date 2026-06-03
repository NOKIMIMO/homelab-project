import React from 'react';
import { Maximize2, Trash2, Edit, Expand } from 'lucide-react';

interface IconButtonProps {
  icon: string;
  tooltip?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const getIcon = (iconName: string) => {
  switch (iconName.toLowerCase()) {
    case 'maximize':
    case 'expand': return <Maximize2 size={18} />;
    case 'fullscreen': return <Maximize2 size={18} />;
    case 'trash':
    case 'delete': return <Trash2 size={18} />;
    case 'edit': return <Edit size={18} />;
    default: return <Expand size={18} />; // Fallback
  }
};

export const IconButton: React.FC<IconButtonProps> = ({ 
  icon, 
  tooltip, 
  onClick,
  disabled = false 
}) => {
  const stopEvent = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <div className={tooltip ? "tooltip tooltip-left" : ""} data-tip={tooltip}>
      <button 
        type="button"
        className="btn btn-circle btn-ghost btn-sm"
        onMouseDown={stopEvent}
        onPointerDown={stopEvent}
        onClick={(event) => {
          stopEvent(event);
          onClick?.();
        }}
        disabled={disabled}
        aria-label={tooltip}
      >
        {getIcon(icon)}
      </button>
    </div>
  );
};
