import React, { useEffect, useMemo } from 'react';
import { ComponentRenderer } from './renderer/ComponentRenderer';
import { ModuleRendererProvider } from './ModuleRendererProvider';
import { useModuleRendererContext } from './useModuleRendererContext';
import type {
  BindingSource,
  BindingRequest,
  ModulePageConfig,
  RendererComponent,
} from './types';
import { getBindingKey } from './types';

interface PageRendererProps {
  moduleId?: string;
  pageConfig: ModulePageConfig;
  onBindingCall?: (request: BindingRequest) => Promise<unknown>;
}

interface PageRendererContentProps {
  pageConfig: ModulePageConfig;
  sources: BindingSource[];
}

const collectSources = (config: RendererComponent | RendererComponent[] | undefined, sources: Map<string, BindingSource>) => {
  if (!config) {
    return;
  }

  if (Array.isArray(config)) {
    config.forEach((component) => collectSources(component, sources));
    return;
  }

  if ('source' in config && typeof config.source === 'object' && config.source !== null) {
    sources.set(getBindingKey(config.source), config.source);
  }

  if ('item' in config) {
    collectSources(config.item, sources);
  }

  if ('actions' in config) {
    collectSources(config.actions, sources);
  }

  if ('components' in config) {
    collectSources(config.components, sources);
  }

  if ('content' in config) {
    collectSources(config.content, sources);
  }

  if ('preview' in config) {
    collectSources(config.preview, sources);
  }
};

const PageRendererContent: React.FC<PageRendererContentProps> = ({
  pageConfig,
  sources,
}) => {
  const { baseContext, preloadSource, runBinding, setStateValue } = useModuleRendererContext();

  useEffect(() => {
    sources.forEach((source) => {
      if (!source.params) {
        void preloadSource(source).catch(() => undefined);
      }
    });
  }, [preloadSource, sources]);

  return (
    <div className={`relative w-full max-w-12xl mx-auto space-y-6 page-${pageConfig.id}`}>
      {pageConfig.components.map((component, index) => (
        <ComponentRenderer
          key={`${component.type}-${index}`}
          config={component}
          context={baseContext}
          onAction={runBinding}
          onStateChange={setStateValue}
        />
      ))}
    </div>
  );
};

export const PageRenderer: React.FC<PageRendererProps> = ({
  moduleId,
  pageConfig,
  onBindingCall,
}) => {
  const sources = useMemo(() => {
    const sourceMap = new Map<string, BindingSource>();
    collectSources(pageConfig.components, sourceMap);
    return Array.from(sourceMap.values());
  }, [pageConfig.components]);

  return (
    <ModuleRendererProvider
      key={pageConfig.id}
      initialState={pageConfig.state || {}}
      moduleId={moduleId}
      bindings={pageConfig.bindings}
      onBindingCall={onBindingCall}
    >
      <PageRendererContent pageConfig={pageConfig} sources={sources} />
    </ModuleRendererProvider>
  );
};
