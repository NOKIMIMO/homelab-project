import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type {
  BindingRequest,
  BindingSource,
  RendererContext,
  RendererResource,
  RendererResourceMap,
} from './types';

interface ModuleRendererContextValue {
  baseContext: RendererContext;
  resources: RendererResourceMap;
  runBinding: (request: BindingRequest) => Promise<unknown>;
  preloadSource: (source: BindingSource) => Promise<unknown>;
  setStateValue: (key: string, value: unknown) => void;
}

interface ModuleRendererProviderProps {
  initialState: RendererContext;
  bindings?: Record<string, string>;
  onBindingCall?: (request: BindingRequest) => Promise<unknown>;
  children: React.ReactNode;
}

const ModuleRendererContext = createContext<ModuleRendererContextValue | null>(null);

export function ModuleRendererProvider({
  initialState,
  bindings,
  onBindingCall,
  children,
}: ModuleRendererProviderProps) {
  const [state, setState] = useState<RendererContext>(initialState);
  const [resources, setResources] = useState<RendererResourceMap>({});
  const [pendingRequests, setPendingRequests] = useState(0);

  const setStateValue = useCallback((key: string, value: unknown) => {
    setState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const runBinding = useCallback(
    async (request: BindingRequest) => {
      const bindingName = bindings?.[request.binding] || request.binding;
      const resolvedRequest: BindingRequest = {
        ...request,
        binding: bindingName,
      };

      setResources((prev) => {
        const nextResource: RendererResource = {
          status: 'loading',
          data: prev[request.binding]?.data,
          request: resolvedRequest,
          updatedAt: Date.now(),
        };

        return {
          ...prev,
          [request.binding]: nextResource,
        };
      });
      setPendingRequests((prev) => prev + 1);

      try {
        const result = await onBindingCall?.(resolvedRequest);

        setResources((prev) => ({
          ...prev,
          [request.binding]: {
            status: 'ready',
            data: result,
            request: resolvedRequest,
            updatedAt: Date.now(),
          },
        }));

        return result;
      } catch (error) {
        setResources((prev) => ({
          ...prev,
          [request.binding]: {
            status: 'error',
            error,
            request: resolvedRequest,
            updatedAt: Date.now(),
          },
        }));
        throw error;
      } finally {
        setPendingRequests((prev) => Math.max(0, prev - 1));
      }
    },
    [bindings, onBindingCall]
  );

  const preloadSource = useCallback(
    async (source: BindingSource) => {
      const resource = resources[source.binding];
      if (resource && resource.status !== 'idle') {
        return resource.data;
      }

      return runBinding({
        binding: source.binding,
        method: source.method,
        params: source.params,
      });
    },
    [resources, runBinding]
  );

  const resourceValues = useMemo(
    () =>
      Object.entries(resources).reduce<RendererContext>((acc, [key, resource]) => {
        if (resource?.status === 'ready') {
          acc[key] = resource.data;
        }

        return acc;
      }, {}),
    [resources]
  );

  const baseContext = useMemo(
    () => ({
      ...state,
      ...resourceValues,
      loading: pendingRequests > 0,
    }),
    [pendingRequests, resourceValues, state]
  );

  const value = useMemo<ModuleRendererContextValue>(
    () => ({
      baseContext,
      resources,
      runBinding,
      preloadSource,
      setStateValue,
    }),
    [baseContext, preloadSource, resources, runBinding, setStateValue]
  );

  return <ModuleRendererContext.Provider value={value}>{children}</ModuleRendererContext.Provider>;
}

export function useModuleRendererContext() {
  const context = useContext(ModuleRendererContext);
  if (!context) {
    throw new Error('useModuleRendererContext must be used within ModuleRendererProvider');
  }

  return context;
}