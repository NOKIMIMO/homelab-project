import { useState } from 'react';
import { Check, Copy, ShieldAlert } from 'lucide-react';

interface RecoveryCodeRevealProps {
  code: string;
  onClose: () => void;
}

export default function RecoveryCodeReveal({ code, onClose }: RecoveryCodeRevealProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-300 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="badge badge-warning gap-2">
          <ShieldAlert size={14} /> Code de récupération
        </div>
        <p className="text-sm text-base-content/70">
          Conservez ce code en lieu sûr (gestionnaire de mots de passe, papier hors-ligne). Il ne sera plus jamais affiché.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-base-200 rounded-lg px-3 py-2 font-mono text-sm break-all">{code}</code>
          <button className="btn btn-sm btn-outline gap-1" onClick={() => void copyCode()}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <div className="flex justify-end pt-2">
          <button className="btn btn-sm btn-primary" onClick={onClose}>
            J'ai sauvegardé ce code
          </button>
        </div>
      </div>
    </div>
  );
}
