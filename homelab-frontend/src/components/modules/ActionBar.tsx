import React from 'react';

interface ActionBarProps {
  children: React.ReactNode;
}

export const ActionBar: React.FC<ActionBarProps> = ({ children }) => {
  return (
    <div className="flex flex-wrap gap-3 mb-6 bg-base-200 p-4 rounded-xl border border-base-content/10">
      {children}
    </div>
  );
};
