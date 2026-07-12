import { Save, MessageSquareText } from 'lucide-react';

const LOGIN_DESCRIPTION_MAX_LENGTH = 500;

interface Props {
  description: string;
  savedDescription: string;
  saving: boolean;
  savedOk: boolean;
  onChange: (description: string) => void;
  onSave: () => void;
}

export default function LoginDescriptionCard({ description, savedDescription, saving, savedOk, onChange, onSave }: Props) {
  return (
    <div className="card bg-base-300">
      <div className="card-body gap-4">
        <h2 className="card-title text-base flex items-center gap-2">
          <MessageSquareText size={16} className="opacity-60" /> Description de la page de connexion
        </h2>
        <p className="text-xs text-base-content/50 -mt-2">
          Le message affiché sur la card de connexion, visible par tous (comme la description
          d'un serveur Minecraft).
        </p>

        <textarea
          className="textarea textarea-bordered w-full text-sm"
          rows={3}
          maxLength={LOGIN_DESCRIPTION_MAX_LENGTH}
          value={description}
          onChange={e => onChange(e.target.value)}
          placeholder="Votre espace personnel, hébergé chez vous."
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-base-content/40">
            {description.length} / {LOGIN_DESCRIPTION_MAX_LENGTH}
          </span>
          <button
            className={`btn btn-sm gap-2 min-w-28 ${savedOk ? 'btn-success' : 'btn-primary'}`}
            onClick={onSave}
            disabled={saving || description === savedDescription}
          >
            {saving
              ? <span className="loading loading-spinner loading-xs" />
              : <Save size={14} />}
            {savedOk ? 'Sauvegardé !' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
