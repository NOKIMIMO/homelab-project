import React from 'react';
import { useModuleRendererContext } from './f_useModuleRendererContext';
import {
  Header,
  ActionBar,
  Button,
  IconButton,
  FileUploadZone,
  List,
  ElementList,
  ListItem,
  Modal,
  ImageViewer,
} from './index';
import type {
  ActionConfig,
  BindingAction,
  BindingRequest,
  BindingRequestPayload,
  ComponentAction,
  RendererComponent,
  RendererComponentType,
  RendererContext,
  SetStateAction,
  BindingSource,
} from './types';
import { getBindingKey } from './types';

interface ComponentRendererProps {
  config: RendererComponent
  context?: RendererContext
  onAction?: (action: BindingRequest) => void | Promise<unknown>
  onStateChange?: (key: string, value: unknown) => void
}

const componentMap = {
  Header,
  ActionBar,
  Button,
  IconButton,
  FileUploadZone,
  List,
  ElementList,
  ListItem,
  Modal,
  ImageViewer,
} satisfies Record<RendererComponentType, React.ElementType>;
//TODO: BIG REFONTE, TROP GROS DE LOIN
// j'ai trop entassé, mybad
const isRendererRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isSetStateAction = (action: ComponentAction): action is SetStateAction =>
  typeof action === 'object' && action !== null && 'type' in action && action.type === 'setState';

const isBindingAction = (action: ComponentAction): action is BindingAction =>
  typeof action === 'object' && action !== null && 'action' in action;

const hasSource = (config: RendererComponent): config is Extract<RendererComponent, { source: BindingSource }> =>
  'source' in config && typeof config.source === 'object' && config.source !== null;

const hasComponents = (config: RendererComponent): config is Extract<RendererComponent, { components: RendererComponent[] }> =>
  'components' in config;

const hasActions = (config: RendererComponent): config is Extract<RendererComponent, { actions?: RendererComponent[] }> =>
  'actions' in config;

const hasContent = (config: RendererComponent): config is Extract<RendererComponent, { content?: RendererComponent }> =>
  'content' in config;

const hasAction = (config: RendererComponent): config is Extract<RendererComponent, { action?: ActionConfig }> =>
  'action' in config;

const hasDefaultClick = (config: RendererComponent): config is Extract<RendererComponent, { defaultClick?: ActionConfig }> =>
  'defaultClick' in config;

const resolveModalStateKey = (visible: unknown): string | null => {
  if (typeof visible !== 'string') {
    return null;
  }

  const exactStateMatch = visible.match(/^\s*\{\{\s*([a-zA-Z_$][\w$]*)\s*\}\}\s*$/);
  if (exactStateMatch && exactStateMatch[1]) {
    return exactStateMatch[1];
  }

  const notNullMatch = visible.match(/^\s*\{\{\s*([a-zA-Z_$][\w$]*)\s*(?:!==?|==?)\s*null\s*\}\}\s*$/);
  if (notNullMatch && notNullMatch[1]) {
    return notNullMatch[1];
  }

  return null;
};

const extractBindingPayload = (value: unknown): unknown => {
  if (!isRendererRecord(value)) {
    return value;
  }

  const result = value.result;
  if (!isRendererRecord(result) || !('data' in result)) {
    return value;
  }

  return result.data;
};

const extractListItems = (value: unknown): unknown[] => {
  const payload = extractBindingPayload(value);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (isRendererRecord(payload) && Array.isArray(payload.LIST)) {
    return payload.LIST;
  }

  return [];
};

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  config,
  context = {},
  onAction,
  onStateChange,
}) => {
  const { baseContext, moduleId, resources, runBinding, setStateValue } = useModuleRendererContext();

  const { type } = config;
  const renderContext = React.useMemo<RendererContext>(() => ({
    ...baseContext,
    ...context,
  }), [baseContext, context]);
  const actionRunner = onAction || runBinding;
  const stateWriter = onStateChange || setStateValue;

  const resolveExpression = React.useCallback((expression: string, scope: RendererContext): unknown => {
    const identifierMatch = expression.match(/^[a-zA-Z_$][\w$]*$/);
    if (identifierMatch) {
      return scope[expression];
    }

    const nullCheckMatch = expression.match(/^([a-zA-Z_$][\w$]*)\s*([!=]==?)\s*null$/);
    if (nullCheckMatch) {
      const [, key, operator] = nullCheckMatch;
      const value = scope[key];
      return operator.startsWith('!') ? value != null : value == null;
    }

    return undefined;
  }, []);

  const resolveValue = React.useCallback((value: unknown, scope: RendererContext = renderContext): unknown => {
    if (typeof value === 'string' && value.includes('{{')) {
      const exactMatch = value.match(/^\{\{([^}]+)\}\}$/);
      if (exactMatch && exactMatch[1]) {
        const resolved = resolveExpression(exactMatch[1].trim(), scope);
        return resolved !== undefined ? resolved : value;
      }

      return value.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const resolved = resolveExpression(key.trim(), scope);
        return resolved !== undefined ? String(resolved) : match;
      });
    }
    return value;
  }, [renderContext, resolveExpression]);

  const resolveRecord = React.useCallback((value: Record<string, unknown>) =>
    Object.entries(value).reduce<Record<string, unknown>>((acc, [key, entry]) => ({
      ...acc,
      [key]: resolveValue(entry),
    }), {}), [resolveValue]);

  const resolvedProps = 'props' in config && config.props ? resolveRecord(config.props) : {};

  const resolvedRest = Object.entries(config).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (
      key === 'type' ||
      key === 'props' ||
      key === 'components' ||
      key === 'actions' ||
      key === 'content' ||
      key === 'item' ||
      key === 'action' ||
      key === 'defaultClick' ||
      key === 'onClick' ||
      key === 'source' ||
      key === 'preview' ||
      key === 'params'
    ) {
      return acc;
    }

    acc[key] = resolveValue(value);
    return acc;
  }, {});

  const executeAction = async (action: ComponentAction, params?: BindingRequestPayload) => {
    if (isSetStateAction(action)) {
      stateWriter(action.target, resolveValue(action.value));
      return;
    }

    if (isBindingAction(action)) {
      const resolvedActionParams = action.params ? resolveRecord(action.params) : params;
      const result = await actionRunner({
        binding: action.action,
        method: action.method,
        params: resolvedActionParams,
      });

      if (action.then?.setState) {
        const nextScope: RendererContext = {
          ...renderContext,
          result,
        };

        Object.entries(action.then.setState).forEach(([target, value]) => {
          stateWriter(target, resolveValue(value, nextScope));
        });
      }
    }
  };

  const handleAction = async (actionConfig: ActionConfig, params?: BindingRequestPayload) => {
    const actions = Array.isArray(actionConfig) ? actionConfig : [actionConfig];

    for (const [index, action] of actions.entries()) {
      const runtimeParams = index === 0 ? params : undefined;
      await executeAction(action, runtimeParams);
    }
  };

  const sourceRequest = React.useMemo(
    () => (hasSource(config)
      ? {
          binding: config.source.binding,
          method: config.source.method,
          params:
            'params' in config &&
            config.params &&
            typeof config.params === 'object' &&
            !Array.isArray(config.params)
              ? resolveRecord(config.params as Record<string, unknown>)
              : config.source.params
                ? resolveRecord(config.source.params)
                : undefined,
        }
      : null),
    [config, resolveRecord]
  );
  const sourceKey = sourceRequest ? getBindingKey(sourceRequest, moduleId) : null;
  const sourceResource = sourceKey ? resources[sourceKey] : undefined;
  const sourceData = sourceKey
    ? extractBindingPayload(sourceResource?.data ?? renderContext[sourceKey])
    : undefined;

  React.useEffect(() => {
    if (!sourceRequest?.params || !sourceKey || sourceResource) {
      return;
    }

    void runBinding({
      binding: sourceRequest.binding,
      method: sourceRequest.method,
      params: sourceRequest.params,
    }).catch(() => undefined);
  }, [runBinding, sourceKey, sourceRequest, sourceResource]);

  const Component = componentMap[type];

  if ((type === 'List' || type === 'ElementList') && config.source && config.item) {
    const listData = sourceData;
    const listItems = extractListItems(listData);

    if (type === 'ElementList') {
      return (
        <ElementList
          {...resolvedProps}
          items={listItems}
          keyExtractor={(item, idx) =>
            isRendererRecord(item) && typeof item.id === 'string' ? item.id : String(idx)
          }
          renderItem={(item) => {
            const itemContext: RendererContext = isRendererRecord(item)
              ? { ...renderContext, ...item }
              : { ...renderContext, item };

            return (
              <>
                {config.preview && (
                  <div className="mb-3 rounded-xl border border-base-content/10 bg-base-100 p-2">
                    <ComponentRenderer
                      config={config.preview}
                      context={itemContext}
                      onAction={actionRunner}
                      onStateChange={stateWriter}
                    />
                  </div>
                )}
                <ul className="menu p-0 m-0 bg-transparent">
                  <ComponentRenderer
                    config={config.item}
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
        keyExtractor={(item, idx) =>
          isRendererRecord(item) && typeof item.id === 'string' ? item.id : String(idx)
        }
        renderItem={(item) => {
          const itemContext: RendererContext = isRendererRecord(item)
            ? { ...renderContext, ...item }
            : { ...renderContext, item };

          return (
            <ComponentRenderer
              config={config.item}
              context={itemContext}
              onAction={actionRunner}
              onStateChange={stateWriter}
            />
          );
        }}
      />
    );
  }

  if (!Component) {
    console.warn(`Component type "${type}" not found`);
    return null;
  }

  const childrenToRender =
    (hasComponents(config)
      ? config.components.map((component, idx: number) => (
          <ComponentRenderer
            key={idx}
            config={component}
            context={renderContext}
            onAction={actionRunner}
            onStateChange={stateWriter}
          />
      ))
      : undefined);

  const actionsToRender =
    hasActions(config) && config.actions
      ? config.actions.map((component, idx: number) => (
          <ComponentRenderer
            key={idx}
            config={component}
            context={renderContext}
            onAction={actionRunner}
            onStateChange={stateWriter}
          />
        ))
      : undefined;

  const contentToRender =
    hasContent(config) && config.content
      ? (
          <ComponentRenderer
            config={config.content}
            context={renderContext}
            onAction={actionRunner}
            onStateChange={stateWriter}
          />
        )
      : undefined;

  const componentEvents: Record<string, unknown> = {};
  if (type === 'ListItem') {
    const defaultClickAction = hasDefaultClick(config) ? config.defaultClick : undefined;

    if (defaultClickAction) {
      componentEvents.onClick = () => {
        void handleAction(defaultClickAction);
      };
    }
  } else if (hasAction(config) && config.action) {
    const actionConfig = config.action;

    if (type === 'FileUploadZone') {
      componentEvents.onFilesSelected = (formData: FormData) => {
        // console.log('[ComponentRenderer] forwarding upload payload', { count: files.length });
        void handleAction(actionConfig, formData);
      };
    } else {
      componentEvents.onClick = () => {
        void handleAction(actionConfig);
      };
    }
  }

  const modalStateKey = type === 'Modal' ? resolveModalStateKey((config as { visible?: unknown }).visible) : null;

  return React.createElement(Component as React.ComponentType<Record<string, unknown>>, {
    ...resolvedProps,
    ...resolvedRest,
    ...(type === 'ListItem' ? { clickable: hasDefaultClick(config) && Boolean(config.defaultClick) } : {}),
    ...(type === 'Modal' && modalStateKey
      ? {
          onClose: () => {
            stateWriter(modalStateKey, null);
          },
        }
      : {}),
    ...componentEvents,
    ...(sourceKey ? { sourceData } : {}),
    ...(sourceResource?.status === 'loading' ? { loading: true } : {}),
    ...(sourceResource?.status === 'error'
      ? { error: sourceResource.error instanceof Error ? sourceResource.error.message : String(sourceResource.error) }
      : {}),
    ...(childrenToRender && { children: childrenToRender }),
    ...(actionsToRender && { actions: actionsToRender }),
    ...(contentToRender && { content: contentToRender }),
  });
};

