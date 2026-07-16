import { Plus } from 'lucide-react';

interface BootstrapPanelProps {
  onShowBootstrap: () => void;
}

export default function BootstrapPanel({ onShowBootstrap }: BootstrapPanelProps) {
  return (
    <div className="mt-8 pt-6 border-t border-base-content/10 text-center">
      <div className="badge badge-warning gap-2 mb-3">Bootstrap Mode</div>
      <p className="text-xs opacity-50 mb-4">
        No key is registered yet. Add your first public key to secure access.
      </p>
      <button className="btn btn-outline btn-sm w-full gap-2" onClick={onShowBootstrap}>
        <Plus size={16} /> Register First Key
      </button>
    </div>
  );
}
