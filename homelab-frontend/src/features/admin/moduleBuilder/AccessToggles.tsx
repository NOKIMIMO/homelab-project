interface Props {
  writeAdminOnly: boolean;
  deleteAdminOnly: boolean;
  onChangeWriteAdminOnly: (value: boolean) => void;
  onChangeDeleteAdminOnly: (value: boolean) => void;
}

export default function AccessToggles({ writeAdminOnly, deleteAdminOnly, onChangeWriteAdminOnly, onChangeDeleteAdminOnly }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold opacity-60">Accès</p>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          className="checkbox checkbox-xs"
          checked={writeAdminOnly}
          onChange={e => onChangeWriteAdminOnly(e.target.checked)}
        />
        Création/Modification réservée aux administrateurs
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          className="checkbox checkbox-xs"
          checked={deleteAdminOnly}
          onChange={e => onChangeDeleteAdminOnly(e.target.checked)}
        />
        Suppression réservée aux administrateurs
      </label>
    </div>
  );
}
