import React, { useState, useCallback } from 'react';
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
        const bindingName = bindings[action] || action;
        const result = await onBindingCall?.(bindingName, params);
        
        if (result) {
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

  const context = {
    ...state,
    ...data,
    loading,
  };

  return (
    <div className={`page page-${pageConfig.id}`}>
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
