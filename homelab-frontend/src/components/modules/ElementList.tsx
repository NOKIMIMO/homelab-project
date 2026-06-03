import React from 'react';

interface ElementListProps {
  items?: readonly unknown[];
  renderItem?: (item: unknown, index: number) => React.ReactNode;
  keyExtractor?: (item: unknown, index: number) => string;
  emptyMessage?: string;
  children?: React.ReactNode;
}

export const ElementList: React.FC<ElementListProps> = ({
  items,
  renderItem,
  keyExtractor,
  emptyMessage = 'Aucun element disponible.',
  children,
}) => {
  const hasItems = Array.isArray(items) && items.length > 0;

  if (!hasItems && !children) {
    return (
      <div className="rounded-2xl border border-base-content/10 bg-base-200 px-4 py-8 text-center text-sm opacity-60 shadow-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {hasItems && renderItem
        ? items.map((item, index) => (
            <article
              key={keyExtractor?.(item, index) || index}
              className="rounded-2xl border border-base-content/10 bg-base-200 p-3 shadow-sm"
            >
              {renderItem(item, index)}
            </article>
        ))
        : children}
    </div>
  );
};