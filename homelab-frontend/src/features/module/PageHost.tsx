import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import type { Module } from '@app/types';
import { getApiUrl } from '@lib/api';
import { PageRenderer } from '@renderer/PageRenderer';
import { extractModulePageConfig, type ModulePageConfig, type BindingRequest } from '@renderer/types';
import { createBindingHandler } from './Binding';

export default function PageHost({ module, token }: { module: Module; token?: string }) {
  const [pageConfig, setPageConfig] = useState<ModulePageConfig | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const handlerRef = useRef<((req: BindingRequest) => Promise<unknown>) | null>(null);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrlsRef.current = [];
      handlerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!module || module.status !== 'ACTIVE') {
      handlerRef.current = null;
      return;
    }

    const pageUrl = getApiUrl(`/api/modules/${module.id}/UI/page`);

    const fetchModuleUi = async () => {
      try {
        const res = await fetch(pageUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        if (!res.ok) return;

        const data: unknown = await res.json();
        setPageConfig(extractModulePageConfig(data));
      } catch (err) {
        console.error('Error fetching module UI:', err);
      }
    };

    fetchModuleUi();

    handlerRef.current = createBindingHandler(module, token, (url) => {
      objectUrlsRef.current.push(url);
    });

    return () => {
      handlerRef.current = null;
    };
  }, [module, token]);

  const callBinding = useCallback((request: BindingRequest) => {
    if (!handlerRef.current) return Promise.reject(new Error('Binding handler not available'));
    return handlerRef.current(request);
  }, []);

  if (!pageConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 size={48} className="text-primary animate-spin mb-4" />
        <p>Initialisation de l'interface du module...</p>
      </div>
    );
  }

  return <PageRenderer moduleId={module.id} pageConfig={pageConfig} onBindingCall={callBinding} />;
}