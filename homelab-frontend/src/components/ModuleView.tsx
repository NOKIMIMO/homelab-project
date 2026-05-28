import { getApiUrl } from '../api';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { Module } from '../App';
import { useAuth } from '../auth/AuthContext';
import { useEffect } from 'react';

export default function ModuleView({ module }: { module?: Module }) {
  const { token } = useAuth();
  if (!module) return <div className="p-10">Application non trouvée</div>;

  useEffect(() => {
    if (module.status === 'ACTIVE') {
      const url = getApiUrl(`/api/modules/${module.id}/UI`);
      const routerUrl = getApiUrl(`/api/modules/${module.id}/UI/router`);
      const IconUrl = getApiUrl(`/api/modules/${module.id}/UI/icon`);
      // call api
      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => {
          if (res.ok) {
            // console.log('Module UI response:', res);
            // res.body is a ReadableStream, we need to read it to get the actual content
            res.body?.getReader().read().then(({ value, done }) => {
              if (!done && value) {
                const uiConfig = JSON.parse(new TextDecoder().decode(value));
                // {"router":"photos_router.xml","pages":["photos_ui.json"]} 
                // console.log('Module UI config:', uiConfig);
                // call first page to get the UI
                fetch(url + '/' + uiConfig.pages[0], {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }).then((res) => {
                  if (res.ok) {
                    res.body?.getReader().read().then(({ value, done }) => {
                      if (!done && value) {
                        const pageConfig = JSON.parse(new TextDecoder().decode(value));
                        // console.log('Module UI page config:', pageConfig);
                      }
                    });
                  } else {
                    console.error('Error fetching module UI page:', res.statusText);
                  }
                });
              }
            });
          }        
        })        
      .catch((err) => {
          console.error('Error fetching module UI:', err);
      });

    }
  }, [module]);

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
    <div className="w-full h-full bg-base-100 flex flex-col">
      
    </div>
  );
}
