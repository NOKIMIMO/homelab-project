import React from 'react';

interface ListProps {
  items?: readonly unknown[];
  renderItem?: (item: unknown, index: number) => React.ReactNode;
  keyExtractor?: (item: unknown, index: number) => string;
  emptyMessage?: string;
  children?: React.ReactNode;
}

export const List: React.FC<ListProps> = ({ 
  items, 
  renderItem,
  keyExtractor,
  emptyMessage = 'Aucun element disponible.',
  children
}) => {
  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <ul className="menu bg-base-200 w-full rounded-box gap-2 p-4 shadow-sm border border-base-content/10">
      {hasItems && renderItem ? items.map((item, index) => (
        <React.Fragment key={keyExtractor?.(item, index) || index}>
          {renderItem(item, index)}
        </React.Fragment>
      )) : children || (
        <li className="px-4 py-6 text-center text-sm opacity-60">{emptyMessage}</li>
      )}
    </ul>
  );
};
