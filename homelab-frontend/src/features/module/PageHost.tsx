import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import type { Module } from '@app/types';
import { getApiUrl } from '@lib/api';
import { PageRenderer } from '@renderer/PageRenderer';
import {
  extractModulePageConfig,
  type ModulePageConfig,
  type BindingRequest
} from '@renderer/types';
import { createBindingHandler } from './Binding';
import { useAuth } from '@auth/AuthContext';

type PageState =
  | { type: 'loading' }
  | { type: 'json'; config: ModulePageConfig }
  | { type: 'standalone'; url: string };

export default function PageHost({ module }: { module: Module }) {
  const { token } = useAuth();

  const [state, setState] = useState<PageState>({ type: 'loading' });
  const [devUrl, setDevUrl] = useState<string>('');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const handlerRef = useRef<((req: BindingRequest) => Promise<unknown>) | null>(null);

  const iframeReadyRef = useRef(false);

  useEffect(() => {
    return () => {
      handlerRef.current = null;
      iframeReadyRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!module || module.status !== 'ACTIVE') return;

    setState({ type: 'loading' });

    const pageUrl = getApiUrl(`/api/modules/${module.id}/UI/page`);

    const fetchModuleUi = async () => {
      try {
        const res = await fetch(pageUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        if (!res.ok) return;

        const data = await res.json();

        if (data.type === 'standalone') {
          setState({ type: 'standalone', url: data.content });
        } else {
          const config = extractModulePageConfig(data.content);
          if (!config) return;
          setState({ type: 'json', config });
        }
      } catch {}
    };

    fetchModuleUi();

    handlerRef.current = createBindingHandler(module, token!!, () => {});

    return () => {
      handlerRef.current = null;
    };
  }, [module, token]);

  const callBinding = useCallback((request: BindingRequest) => {
    if (!handlerRef.current) return Promise.reject();
    return handlerRef.current(request);
  }, []);

  const iframeSrc = useMemo(() => {
    return devUrl.trim() || (state.type === 'standalone' ? state.url : '');
  }, [devUrl, state]);

  const sendToken = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return;
    if (!token) return;
    if (!iframeReadyRef.current) return;

    iframeRef.current.contentWindow.postMessage(
      { type: 'AUTH_TOKEN', token },
      '*'
    );
  }, [token]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'IFRAME_READY') {
        iframeReadyRef.current = true;
        sendToken();
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [sendToken]);

  if (state.type === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 size={48} className="text-primary animate-spin mb-4" />
      </div>
    );
  }

  if (state.type === 'standalone') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-2 bg-base-300 border-b border-base-content/10">
          <input
            value={devUrl}
            onChange={(e) => setDevUrl(e.target.value)}
            className="input input-sm input-bordered w-full text-xs"
          />
          {devUrl && (
            <button className="btn btn-xs btn-ghost" onClick={() => setDevUrl('')}>
              Reset
            </button>
          )}
        </div>

        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="w-full h-full border-0"
          onLoad={() => sendToken()}
        />
      </div>
    );
  }

  return (
    <PageRenderer
      moduleId={module.id}
      pageConfig={state.config}
      onBindingCall={callBinding}
    />
  );
}