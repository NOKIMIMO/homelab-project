import { ShieldCheck } from 'lucide-react';
import type { ModuleSettings } from '../services/moduleSettingsService';

interface Props {
  moduleSettings: Record<string, ModuleSettings>;
  savingModuleId: string | null;
  onToggle: (moduleId: string, key: keyof ModuleSettings) => void;
}

export default function ModulesAccessTable({ moduleSettings, savingModuleId, onToggle }: Props) {
  return (
    <section>
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <ShieldCheck size={18} className="opacity-70" />
        Modules
      </h2>
      <p className="text-xs opacity-60 mb-3">
        Par défaut, tout utilisateur authentifié peut créer/modifier et supprimer via un module.
        Activez un réglage ci-dessous pour réserver cette action aux administrateurs.
      </p>
      <div className="overflow-x-auto rounded-xl border border-base-content/10">
        <table className="table table-sm w-full">
          <thead>
            <tr className="bg-base-300 text-xs uppercase tracking-wide">
              <th>Module</th>
              <th>Création / Modification : admin uniquement</th>
              <th>Suppression : admin uniquement</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(moduleSettings).length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-base-content/40 italic py-8">
                  Aucun module
                </td>
              </tr>
            ) : (
              Object.entries(moduleSettings).map(([moduleId, settings]) => (
                <tr key={moduleId} className="hover">
                  <td className="font-mono text-xs">{moduleId}</td>
                  <td>
                    <input
                      type="checkbox"
                      className={`toggle toggle-sm toggle-warning ${savingModuleId === moduleId ? "opacity-50" : ""}`}
                      checked={settings.writeAdminOnly}
                      disabled={savingModuleId === moduleId}
                      onChange={() => onToggle(moduleId, 'writeAdminOnly')}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      className={`toggle toggle-sm toggle-warning ${savingModuleId === moduleId ? "opacity-50" : ""}`}
                      checked={settings.deleteAdminOnly}
                      disabled={savingModuleId === moduleId}
                      onChange={() => onToggle(moduleId, 'deleteAdminOnly')}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
