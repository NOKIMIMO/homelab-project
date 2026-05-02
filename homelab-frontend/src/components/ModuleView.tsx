import { getApiUrl } from '../api';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { Module } from '../App';

export default function ModuleView({ module }: { module?: Module }) {
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
    <div className="w-full h-full bg-base-100 flex flex-col">
      <iframe
        src={getApiUrl(`/api/proxy/${module.id}/?token=${localStorage.getItem('homelab_token')}`)}
        title={`Module ${module.name}`}
        className="flex-1 w-full border-none shadow-inner"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  );
}
