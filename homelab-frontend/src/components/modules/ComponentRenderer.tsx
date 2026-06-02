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
  onAction?: (action: any, params?: any) => void | Promise<void>;
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
      // If it's a strict match like "{{id}}", we can return the exact context value (which could be an object)
      const exactMatch = value.match(/^\{\{([^}]+)\}\}$/);
      if (exactMatch && exactMatch[1]) {
        const key = exactMatch[1].trim();
        return context[key] !== undefined ? context[key] : value;
      }
      
      // If it's string interpolation like "ID: {{id}}", replace all occurrences safely
      return value.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        return context[trimmedKey] !== undefined ? context[trimmedKey] : match;
      });
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

  const handleAction = async (action: any, params?: any) => {
    if (typeof action === 'string') {
      onAction?.(action, params);
    } else if (action.type === 'setState') {
      onStateChange?.(action.target, resolveValue(action.value));
    } else if (action.action) {
      // Handles complex action objects: { action: "name", params: {}, then: {} }
      const resolvedActionParams = action.params
        ? Object.entries(action.params).reduce(
            (acc, [k, v]) => ({ ...acc, [k]: resolveValue(v) }),
            {}
          )
        : params;
        
      if (onAction) {
        // Since PageRenderer onAction is async, we could await it, but ComponentRenderer onAction is synchronous in type
        // However, PageRenderer handleAction returns a Promise
        const result = (onAction as any)(action.action, resolvedActionParams);
        if (result instanceof Promise) {
          await result;
        }
      }
      
      if (action.then) {
        if (action.then.setState) {
          Object.entries(action.then.setState).forEach(([target, val]) => {
            onStateChange?.(target, resolveValue(val));
          });
        }
      }
    } else {
      onAction?.(action, params);
    }
  };

  // Special handling for List component
  if (type === 'List' && config.source && config.item) {
    const listData = context[config.source] || [];
    
    // Resolve context using the data item
    return (
      <Component {...resolvedProps}>
        {Array.isArray(listData) && listData.map((item: any, idx: number) => {
          const itemContext = { ...context, ...item };
          return (
            <ComponentRenderer
              key={item.id || idx}
              config={config.item}
              context={itemContext}
              onAction={onAction}
              onStateChange={onStateChange}
            />
          );
        })}
      </Component>
    );
  }

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

  const actionsToRender = config.actions?.map((comp: any, idx: number) => (
    <ComponentRenderer
      key={idx}
      config={comp}
      context={context}
      onAction={handleAction}
      onStateChange={onStateChange}
    />
  ));

  const contentToRender = config.content ? (
    <ComponentRenderer
      config={config.content}
      context={context}
      onAction={handleAction}
      onStateChange={onStateChange}
    />
  ) : undefined;
  
  // Inject source data if component needs it directly
  const sourceData = config.source ? context[config.source] : undefined;

  // Map custom configuration root action handlers automatically to React synthetic events
  const componentEvents: Record<string, any> = {};
  if (config.action) {
    if (type === 'FileUploadZone') {
      // For file uploads, we need to pass the files down to the action payload
      componentEvents.onFilesSelected = (files: File[]) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        handleAction(config.action, formData);
      };
    } else {
      componentEvents.onClick = () => handleAction(config.action);
    }
  } else if (config.onClick) {
    componentEvents.onClick = () => handleAction(config.onClick);
  }

  return React.createElement(Component, {
    ...resolvedProps,
    ...rest,
    ...componentEvents,
    ...(config.source && { sourceData }),
    ...(childrenToRender && { children: childrenToRender }),
    ...(actionsToRender && { actions: actionsToRender }),
    ...(contentToRender && { content: contentToRender }),
  });
};
