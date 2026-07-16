import { AlertTriangle } from 'lucide-react';

interface HardResetInfoProps {
  onBack: () => void;
}

export default function HardResetInfo({ onBack }: HardResetInfoProps) {
  return (
    <div className="space-y-6">
      <div className="badge badge-error gap-2">
        <AlertTriangle size={14} /> Full Reset
      </div>

      <p className="text-sm text-base-content/70">
        If the recovery code is also lost, the application can no longer safely reset itself.
        The only option is to delete the Docker volumes persisting the database, from the
        machine hosting the Homelab.
      </p>

      <div className="bg-base-200 rounded-xl p-4 space-y-3 text-xs font-mono">
        <div>
          <p className="opacity-50 mb-1"># Stop the stack and remove its volumes (includes the database)</p>
          <p>docker compose down -v</p>
        </div>
        <div>
          <p className="opacity-50 mb-1"># Start fresh from a blank database</p>
          <p>docker compose up</p>
        </div>
      </div>

      <p className="text-xs text-base-content/60">
        Once the blank database is recreated, the very first sign-up automatically becomes
        administrator again, just like during initial installation.
      </p>

      <p className="text-xs text-warning">
        Check the volume name with <code className="font-mono">docker volume ls</code> before
        deleting it manually — this action is irreversible and deletes all data for the
        instance (modules, files, accounts).
      </p>

      <button type="button" className="btn btn-ghost btn-sm w-full" onClick={onBack}>
        Back to sign in
      </button>
    </div>
  );
}
