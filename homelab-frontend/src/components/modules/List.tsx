import React from 'react';

interface ListProps {
  items?: any[];
  renderItem?: (item: any, index: number) => React.ReactNode;
  keyExtractor?: (item: any, index: number) => string;
  children?: React.ReactNode;
}

export const List: React.FC<ListProps> = ({ 
  items, 
  renderItem,
  keyExtractor,
  children
}) => {
  return (
    <ul className="menu bg-base-200 w-full rounded-box gap-2 p-4 shadow-sm border border-base-content/10">
      {items && renderItem ? items.map((item, index) => (
        <React.Fragment key={keyExtractor?.(item, index) || index}>
          {renderItem(item, index)}
        </React.Fragment>
      )) : children}
    </ul>
  );
};
