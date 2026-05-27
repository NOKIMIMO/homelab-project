import React from 'react';
import {
  Header,
  ActionBar,
  Button,
  IconButton,
  FileUploadZone,
  List,
  ListItem,
  Modal,
  ImageViewer,
} from './index';

interface ComponentRendererProps {
  config: any;
  context?: any;
  onAction?: (action: any, params?: any) => void;
  onStateChange?: (key: string, value: any) => void;
}

const componentMap: Record<string, React.ComponentType<any>> = {
  Header,
  ActionBar,
  Button,
  IconButton,
  FileUploadZone,
  List,
  ListItem,
  Modal,
  ImageViewer,
};

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  config,
  context = {},
  onAction,
  onStateChange,
}) => {
  if (!config) return null;

  const { type, props = {}, components, children, ...rest } = config;

  const Component = componentMap[type];

  if (!Component) {
    console.warn(`Component type "${type}" not found`);
    return null;
  }

  const resolveValue = (value: any): any => {
    if (typeof value === 'string' && value.includes('{{')) {
      const key = value.replace(/\{\{|\}\}/g, '');
      return context[key] ?? value;
    }
    return value;
  };

  const resolvedProps = Object.entries(props).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: resolveValue(value),
    }),
    {}
  );

  const handleAction = (action: any, params?: any) => {
    if (typeof action === 'string') {
      onAction?.(action, params);
    } else if (action.type === 'setState') {
      onStateChange?.(action.target, resolveValue(action.value));
    } else {
      onAction?.(action, params);
    }
  };

  const childrenToRender =
    components?.map((comp: any, idx: number) => (
      <ComponentRenderer
        key={idx}
        config={comp}
        context={context}
        onAction={handleAction}
        onStateChange={onStateChange}
      />
    )) || children;

  return React.createElement(Component, {
    ...resolvedProps,
    ...rest,
    ...(childrenToRender && { children: childrenToRender }),
  });
};
