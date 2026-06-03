import React, { useCallback, useMemo, useState } from 'react';
import type {
  BindingRequest,
  BindingSource,
  RendererContext,
  RendererResource,
  RendererResourceMap,
} from './types';
import { getBindingKey } from './types';
import {
  ModuleRendererContext,
  type ModuleRendererContextValue,
} from './ModuleRendererContext.ts';

interface ModuleRendererProviderProps {
  initialState: RendererContext;
  moduleId?: string;
  bindings?: Record<string, string>;
  onBindingCall?: (request: BindingRequest) => Promise<unknown>;
  children: React.ReactNode;
}

export function ModuleRendererProvider({
  initialState,
  moduleId,
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
      const resourceKey = getBindingKey(request, moduleId);
      const bindingName = bindings?.[request.binding] || request.binding;
      const resolvedRequest: BindingRequest = {
        ...request,
        binding: bindingName,
      };

      setResources((prev) => {
        const nextResource: RendererResource = {
          status: 'loading',
          data: prev[resourceKey]?.data,
          request: resolvedRequest,
          updatedAt: Date.now(),
        };

        return {
          ...prev,
          [resourceKey]: nextResource,
        };
      });
      setPendingRequests((prev) => prev + 1);

      try {
        const result = await onBindingCall?.(resolvedRequest);

        setResources((prev) => ({
          ...prev,
          [resourceKey]: {
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
          [resourceKey]: {
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
    [bindings, moduleId, onBindingCall]
  );

  const preloadSource = useCallback(
    async (source: BindingSource) => {
      const resourceKey = getBindingKey(source, moduleId);
      const resource = resources[resourceKey];
      if (resource && resource.status !== 'idle') {
        return resource.data;
      }

      return runBinding({
        binding: source.binding,
        method: source.method,
        params: source.params,
      });
    },
    [moduleId, resources, runBinding]
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
      moduleId,
      resources,
      runBinding,
      preloadSource,
      setStateValue,
    }),
    [baseContext, moduleId, preloadSource, resources, runBinding, setStateValue]
  );

  return <ModuleRendererContext.Provider value={value}>{children}</ModuleRendererContext.Provider>;
}