import React, { useState, useCallback, useEffect } from 'react';
import { ComponentRenderer } from './ComponentRenderer';

interface PageRendererProps {
  pageConfig: any;
  onBindingCall?: (binding: string, params?: any) => Promise<any>;
}

export const PageRenderer: React.FC<PageRendererProps> = ({
  pageConfig,
  onBindingCall,
}) => {
  const [state, setState] = useState(pageConfig.state || {});
  const [bindings, setBindings] = useState<Record<string, any>>(
    pageConfig.bindings || {}
  );
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const handleAction = useCallback(
    async (action: string, params?: any) => {
      try {
        setLoading(true);
        // resolve binding name if it's mapped in the 'bindings' block
        const bindingName = bindings[action] || action;
        const result = await onBindingCall?.(bindingName, params);
        
        if (result !== undefined) {
          setData((prev) => ({
            ...prev,
            [bindingName]: result,
          }));
        }
      } catch (error) {
        console.error(`Error calling binding "${action}":`, error);
      } finally {
        setLoading(false);
      }
    },
    [bindings, onBindingCall]
  );

  const handleStateChange = useCallback((key: string, value: any) => {
    setState((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Pre-load components that define a "source" without parameters (e.g. lists)
  useEffect(() => {
    const autoFetchSources = new Set<string>();
    
    const scanForSources = (config: any) => {
      if (!config) return;
      if (Array.isArray(config)) {
        config.forEach(scanForSources);
        return;
      }
      // If it has a source and no mandatory params, we can try to autoload it
      if (config.source && !config.params) {
        autoFetchSources.add(config.source);
      }
      if (config.components) scanForSources(config.components);
      if (config.content) scanForSources(config.content);
    };

    scanForSources(pageConfig.components);

    autoFetchSources.forEach((sourceAction) => {
      handleAction(sourceAction);
    });
  }, [pageConfig, handleAction]);

  const context = {
    ...state,
    ...data,
    loading,
  };

  return (
    <div className={`w-full max-w-7xl mx-auto page page-${pageConfig.id}`}>
      <ComponentRenderer
        config={{
          type: 'div',
          components: pageConfig.components,
        }}
        context={context}
        onAction={handleAction}
        onStateChange={handleStateChange}
      />
    </div>
  );
};
