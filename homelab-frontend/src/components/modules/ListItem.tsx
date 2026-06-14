import React from 'react';

interface ListItemProps {
  title: string;
  subtitle?: string;
  clickable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}
  
export const ListItem: React.FC<ListItemProps> = ({ 
  title, 
  subtitle, 
  clickable = false,
  selected = false,
  onClick,
  actions,
  children
}) => {
  const stopEvent = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <li>
      <div 
        className={`flex justify-between items-center w-full p-4 transition-colors ${clickable ? 'cursor-pointer hover:bg-base-300' : ''} ${selected ? 'ring-2 ring-primary' : ''}`}
        onClick={clickable ? onClick : undefined}
      >
        <div className="flex flex-col gap-1">
          <div className="font-bold text-base">{title}</div>
          {subtitle && <div className="text-sm opacity-60">{subtitle}</div>}
        </div>
        {actions && (
          <div className="flex gap-2" onMouseDown={stopEvent} onPointerDown={stopEvent} onClick={stopEvent}>
            {actions}
          </div>
        )}
        {children && (
          <div className="flex gap-2" onMouseDown={stopEvent} onPointerDown={stopEvent} onClick={stopEvent}>
            {children}
          </div>
        )}
      </div>
    </li>
  );
};
