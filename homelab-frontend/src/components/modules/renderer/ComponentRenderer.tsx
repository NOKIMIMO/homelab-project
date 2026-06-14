import React from 'react';
import { useModuleRendererContext } from './../useModuleRendererContext';
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
  ReaderCarousel,
  ImageViewer,
} from './../index';

import {
  hasAction,
  hasActions,
  hasComponents,
  hasContent,
  hasDefaultClick,
  hasSource,
} from './componentRendererGuards';
import { resolveModalStateKey } from './componentRendererData';
import { useValueResolver } from './useValueResolver';
import { useActionHandler } from './useActionHandler';
import { ListRenderer } from './ListRenderer';

import type {
  BindingRequest,
  RendererComponent,
  RendererComponentType,
  RendererContext,
} from './../types';
import { getBindingKey } from './../types';
import { extractBindingPayload } from './componentRendererData';

// ---------------------------------------------------------------------------
// Component map
// ---------------------------------------------------------------------------

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
  ReaderCarousel,
  ImageViewer,
} satisfies Record<RendererComponentType, React.ElementType>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ComponentRendererProps {
  config: RendererComponent;
  context?: RendererContext;
  onAction?: (action: BindingRequest) => void | Promise<unknown>;
  onStateChange?: (key: string, value: unknown) => void;
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  config,
  context = {},
  onAction,
  onStateChange,
}) => {
  const { baseContext, moduleId, resources, runBinding, setStateValue } =
    useModuleRendererContext();

  const renderContext = React.useMemo<RendererContext>(
    () => ({ ...baseContext, ...context }),
    [baseContext, context],
  );

  const actionRunner = onAction ?? runBinding;
  const stateWriter = onStateChange ?? setStateValue;

  // --- value resolution ----------------------------------------------------
  const { resolveValue, resolveRecord } = useValueResolver(renderContext);

  // --- action handling ------------------------------------------------------
  const handleAction = useActionHandler({
    renderContext,
    actionRunner,
    stateWriter,
    resolveValue,
    resolveRecord,
  });

  // --- source / binding data ------------------------------------------------
  const sourceRequest = React.useMemo(
    () =>
      hasSource(config)
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
        : null,
    // resolveRecord is stable across renders with the same context
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config],
  );

  const sourceKey = sourceRequest ? getBindingKey(sourceRequest, moduleId) : null;
  const sourceResource = sourceKey ? resources[sourceKey] : undefined;
  const sourceData = sourceKey
    ? extractBindingPayload(sourceResource?.data ?? renderContext[sourceKey])
    : undefined;

  React.useEffect(() => {
    if (!sourceRequest?.params || !sourceKey || sourceResource) return;

    void runBinding({
      binding: sourceRequest.binding,
      method: sourceRequest.method,
      params: sourceRequest.params,
    }).catch(() => undefined);
  }, [runBinding, sourceKey, sourceRequest, sourceResource]);

  // --- visibility -----------------------------------------------------------
  const resolvedVisible =
    'visible' in config
      ? resolveValue((config as unknown as Record<string, unknown>).visible)
      : undefined;

  if (resolvedVisible !== undefined && !resolvedVisible) {
    return null;
  }

  // --- resolved props / rest ------------------------------------------------
  const resolvedProps =
    'props' in config && config.props ? resolveRecord(config.props) : {};

    
  const SKIPPED_KEYS = new Set([
    'type', 'props', 'components', 'actions', 'content',
    'item', 'action', 'defaultClick', 'onClick', 'source',
    'preview', 'params',
  ]);

  const resolvedRest = Object.entries(config).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      if (SKIPPED_KEYS.has(key)) return acc;
      acc[key] = resolveValue(value);
      return acc;
    },
    {},
  );

  // --- List / ElementList shortcut ------------------------------------------
  const { type } = config;

  const isImageContent =
    type === 'Modal' && config.content?.type === 'ImageViewer';

  if (
    (type === 'List' || type === 'ElementList') &&
    config.source &&
    'item' in config &&
    config.item
  ) {
    return (
      <ListRenderer
        config={config as Parameters<typeof ListRenderer>[0]['config']}
        type={type}
        sourceData={sourceData}
        resolvedProps={resolvedProps}
        renderContext={renderContext}
        actionRunner={actionRunner}
        stateWriter={stateWriter}
      />
    );
  }

  // --- Generic component rendering ------------------------------------------
  const Component = componentMap[type];
  if (!Component) {
    console.warn(`Component type "${type}" not found`);
    return null;
  }

  // Children / actions / content
  const childrenToRender = hasComponents(config)
    ? config.components.map((component, idx) => (
        <ComponentRenderer
          key={idx}
          config={component}
          context={renderContext}
          onAction={actionRunner}
          onStateChange={stateWriter}
        />
      ))
    : undefined;

  const actionsToRender =
    hasActions(config) && config.actions
      ? config.actions.map((component, idx) => (
          <ComponentRenderer
            key={idx}
            config={component}
            context={renderContext}
            onAction={actionRunner}
            onStateChange={stateWriter}
          />
        ))
      : undefined;

  const contentConfig: RendererComponent | undefined = (() => {
    if (!hasContent(config) || !config.content) return undefined;
    if (isImageContent && config.content.type === 'ImageViewer') {
      return {
        ...config.content,
        props: { ...config.content.props, displayViewerMode: 'full' as const },
      };
    }
    return config.content;
  })();

  const contentToRender = contentConfig ? (
    <ComponentRenderer
      config={contentConfig}
      context={renderContext}
      onAction={actionRunner}
      onStateChange={stateWriter}
    />
  ) : undefined;

  // Event wiring
  const componentEvents: Record<string, unknown> = {};

  if (type === 'ListItem') {
    const defaultClickAction = hasDefaultClick(config) ? config.defaultClick : undefined;
    if (defaultClickAction) {
      componentEvents.onClick = () => void handleAction(defaultClickAction);
    }
  } else if (hasAction(config) && config.action) {
    const actionConfig = config.action;

    if (type === 'FileUploadZone') {
      componentEvents.onFilesSelected = (formData: FormData) => {
        void handleAction(actionConfig, formData);
      };
    } else {
      componentEvents.onClick = () => void handleAction(actionConfig);
    }
  }

  // Modal close handler
  const modalStateKey =
    type === 'Modal'
      ? resolveModalStateKey((config as { visible?: unknown }).visible)
      : null;

  return React.createElement(
    Component as React.ComponentType<Record<string, unknown>>,
    {
      ...resolvedProps,
      ...resolvedRest,
      ...(type === 'ListItem'
        ? { clickable: hasDefaultClick(config) && Boolean(config.defaultClick) }
        : {}),
      ...(type === 'Modal' && modalStateKey
        ? { onClose: () => stateWriter(modalStateKey, null) }
        : {}),
      ...(type === 'Modal' && isImageContent
        ? { isImageContent: true }
        : {}),
      ...componentEvents,
      ...(sourceKey ? { sourceData } : {}),
      ...(sourceResource?.status === 'loading' ? { loading: true } : {}),
      ...(sourceResource?.status === 'error'
        ? {
            error:
              sourceResource.error instanceof Error
                ? sourceResource.error.message
                : String(sourceResource.error),
          }
        : {}),
      ...(childrenToRender && { children: childrenToRender }),
      ...(actionsToRender && { actions: actionsToRender }),
      // content render here
      ...(contentToRender && { content: contentToRender }),
    },
  );
};
