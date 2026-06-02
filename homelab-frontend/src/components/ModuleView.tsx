import { getApiUrl } from '../api';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { Module } from '../App';
import { useAuth } from '../auth/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { PageRenderer } from './modules/PageRenderer';

export default function ModuleView({ module }: { module?: Module }) {
  const { token } = useAuth();
  const [pageConfig, setPageConfig] = useState<any>(null);

  const handleBindingCall = useCallback(async (binding: string, params?: any) => {
    if (!module) return null;
    
    const url = getApiUrl(`/api/${module.id}/${binding}`);
    const isFormData = params instanceof FormData;
    const fetchOptions: RequestInit = {
      method: params ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    // For standard fetch calls, don't set Content-Type for FormData, the browser will set it with boundaries automatically
    if (params) {
      if (isFormData) {
        fetchOptions.body = params;
      } else {
        (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(params);
      }
    }
    
    try {
      const res = await fetch(url, fetchOptions);
      if (!res.ok) throw new Error(`Binding call failed: ${res.statusText}`);
      // return empty if standard 204 or empty response
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    } catch (err) {
      console.error(`Error executing binding ${binding}:`, err);
      throw err;
    }
  }, [module, token]);

  useEffect(() => {
    if (!module || module.status !== 'ACTIVE') return;

    const pageUrl = getApiUrl(`/api/modules/${module.id}/UI/page`);

    const fetchModuleUi = async () => {
      try {
        const res = await fetch(pageUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('Module UI response:', res);

        if (!res.ok) return;

        const data = await res.json();
        console.log('Module UI page config:', data);
        setPageConfig(data.page || data);
      } catch (err) {
        console.error('Error fetching module UI:', err);
      }
    };

    fetchModuleUi();
  }, [module, token]);

  if (!module) return <div className="p-10">Application non trouvée</div>;

  if (module.status !== 'ACTIVE') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-4 text-center bg-base-200">
        <div className="p-6 bg-base-300 rounded-3xl border border-base-content/10 shadow-xl max-w-md">
          {module.status === 'STARTING' ? (
            <Loader2 size={48} className="text-primary animate-spin mx-auto mb-4" />
          ) : (
            <AlertCircle size={48} className="text-warning mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-black mb-2">{module.name}</h2>
          <div className="badge badge-warning font-bold mb-4">{module.status}</div>
          <p className="text-base-content/70 font-medium">
            {module.status === 'STARTING'
              ? "Le module est en cours de lancement. Veuillez patienter..."
              : "Le module n'est pas encore démarré ou n'est pas accessible."}
          </p>
          <p className="mt-4 text-xs opacity-40 italic">
            Activez le module depuis la "Vue d'ensemble" pour y accéder ici.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-base-100 flex flex-col p-4 overflow-y-auto">
      {pageConfig ? (
           // TODO: BUG d'affichage
        <PageRenderer pageConfig={pageConfig} onBindingCall={handleBindingCall} />
      ) : (
     
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 size={48} className="text-primary animate-spin mb-4" />
          <p>Initialisation de l'interface du module...</p>
        </div>
      )}
    </div>
  );
}
