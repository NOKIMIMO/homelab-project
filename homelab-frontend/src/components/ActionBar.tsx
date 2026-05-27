import React from 'react';

interface ActionBarProps {
  children: React.ReactNode;
}

export const ActionBar: React.FC<ActionBarProps> = ({ children }) => {
  return (
    <div className="action-bar">
      {children}
    </div>
  );
};
