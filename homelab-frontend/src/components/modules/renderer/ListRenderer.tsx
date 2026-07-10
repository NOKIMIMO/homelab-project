import React from 'react';
import { List, ElementList } from './../index';
import { isRendererRecord } from './componentRendererGuards';
import { extractListItems } from './componentRendererData';
import type {
  BindingRequest,
  RendererComponent,
  RendererContext,
} from './../types';
import { ComponentRenderer } from './ComponentRenderer';

// Lazy import to avoid a circular dependency with the barrel --- the parent
// passes ComponentRenderer in as a prop instead.
interface ListRendererProps {
  config: Extract<RendererComponent, { source: unknown; item: RendererComponent }>;
  type: 'List' | 'ElementList';
  sourceData: unknown;
  resolvedProps: Record<string, unknown>;
  renderContext: RendererContext;
  actionRunner: (action: BindingRequest) => void | Promise<unknown>;
  stateWriter: (key: string, value: unknown) => void;
}

export const ListRenderer: React.FC<ListRendererProps> = ({
  config,
  type,
  sourceData,
  resolvedProps,
  renderContext,
  actionRunner,
  stateWriter,
}) => {
  const listItems = extractListItems(sourceData);

  const buildItemContext = (item: unknown): RendererContext =>
    isRendererRecord(item)
      ? { ...renderContext, ...item }
      : { ...renderContext, item };

  const keyExtractor = (item: unknown, idx: number) =>
    isRendererRecord(item) && typeof item.id === 'string' ? item.id : String(idx);

  if (type === 'ElementList') {
    // cast config to ElementListComponent to access the preview property
    const elementListConfig = config as Extract<
      RendererComponent,
      { type: 'ElementList' }
    >;

    return (
      <ElementList
        {...resolvedProps}
        items={listItems}
        keyExtractor={keyExtractor}
        renderItem={(item) => {
          const itemContext = buildItemContext(item);
          return (
            <>
              {elementListConfig.preview && (
                <div className="mb-3 rounded-xl border border-base-content/10 bg-base-100 p-2">
                  <ComponentRenderer
                    config={elementListConfig.preview}
                    context={itemContext}
                    onAction={actionRunner}
                    onStateChange={stateWriter}
                  />
                </div>
              )}
              <ul className="menu p-0 m-0 bg-transparent">
                <ComponentRenderer
                  config={elementListConfig.item}
                  context={itemContext}
                  onAction={actionRunner}
                  onStateChange={stateWriter}
                />
              </ul>
            </>
          );
        }}
      />
    );
  }

  return (
    <List
      {...resolvedProps}
      items={listItems}
      keyExtractor={keyExtractor}
      renderItem={(item) => (
        <ComponentRenderer
          config={config.item}
          context={buildItemContext(item)}
          onAction={actionRunner}
          onStateChange={stateWriter}
        />
      )}
    />
  );
};
