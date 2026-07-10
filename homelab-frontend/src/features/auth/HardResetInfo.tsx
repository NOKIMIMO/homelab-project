import { AlertTriangle } from 'lucide-react';

interface HardResetInfoProps {
  onBack: () => void;
}

export default function HardResetInfo({ onBack }: HardResetInfoProps) {
  return (
    <div className="space-y-6">
      <div className="badge badge-error gap-2">
        <AlertTriangle size={14} /> Réinitialisation complète
      </div>

      <p className="text-sm text-base-content/70">
        Si le code de récupération est lui aussi perdu, l'application ne peut plus se réinitialiser
        elle-même en toute sécurité. La seule option est de supprimer les volumes Docker persistant
        la base de données, depuis la machine qui héberge le Homelab.
      </p>

      <div className="bg-base-200 rounded-xl p-4 space-y-3 text-xs font-mono">
        <div>
          <p className="opacity-50 mb-1"># Arrêter la stack et supprimer ses volumes (inclut la base de données)</p>
          <p>docker compose down -v</p>
        </div>
        <div>
          <p className="opacity-50 mb-1"># Repartir d'une base vierge</p>
          <p>docker compose up</p>
        </div>
      </div>

      <p className="text-xs text-base-content/60">
        Une fois la base de données vierge recréée, la toute première inscription redevient
        automatiquement administrateur, comme lors de l'installation initiale.
      </p>

      <p className="text-xs text-warning">
        Vérifiez le nom du volume avec <code className="font-mono">docker volume ls</code> avant de
        le supprimer manuellement — cette action est irréversible et supprime toutes les données de
        l'instance (modules, fichiers, comptes).
      </p>

      <button type="button" className="btn btn-ghost btn-sm w-full" onClick={onBack}>
        Retour à la connexion
      </button>
    </div>
  );
}
