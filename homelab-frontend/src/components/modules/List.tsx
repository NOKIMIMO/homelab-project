import React from 'react';

interface ListProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  keyExtractor?: (item: any, index: number) => string;
}

export const List: React.FC<ListProps> = ({ 
  items, 
  renderItem,
  keyExtractor 
}) => {
  return (
    <ul className="list">
      {items.map((item, index) => (
        <React.Fragment key={keyExtractor?.(item, index) || index}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
    </ul>
  );
};
