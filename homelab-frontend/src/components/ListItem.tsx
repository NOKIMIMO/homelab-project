import React from 'react';

interface ListItemProps {
  title: string;
  subtitle?: string;
  clickable?: boolean;
  onClick?: () => void;
  actions?: React.ReactNode;
}

export const ListItem: React.FC<ListItemProps> = ({ 
  title, 
  subtitle, 
  clickable = false,
  onClick,
  actions 
}) => {
  return (
    <li className={`list-item ${clickable ? 'clickable' : ''}`}>
      <div className="list-item-content" onClick={onClick}>
        <div className="list-item-text">
          <div className="title">{title}</div>
          {subtitle && <div className="subtitle">{subtitle}</div>}
        </div>
      </div>
      {actions && (
        <div className="list-item-actions">
          {actions}
        </div>
      )}
    </li>
  );
};
