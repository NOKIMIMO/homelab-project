import React from 'react';

interface ListItemProps {
  title: string;
  subtitle?: string;
  clickable?: boolean;
  onClick?: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const ListItem: React.FC<ListItemProps> = ({ 
  title, 
  subtitle, 
  clickable = false,
  onClick,
  actions,
  children
}) => {
  return (
    <li>
      <div 
        className={`flex justify-between items-center w-full p-4 hover:bg-base-300 transition-colors ${clickable ? 'cursor-pointer active:scale-[0.98]' : ''}`}
        onClick={clickable ? onClick : undefined}
      >
        <div className="flex flex-col gap-1">
          <div className="font-bold text-base">{title}</div>
          {subtitle && <div className="text-sm opacity-60">{subtitle}</div>}
        </div>
        {actions && (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
        {children && (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        )}
      </div>
    </li>
  );
};
