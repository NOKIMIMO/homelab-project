import { useState, useEffect } from 'react';
import { Key as KeyIcon, Plus, Trash2, ShieldCheck, User, Calendar, Loader2, Upload } from 'lucide-react';
import { getApiUrl } from '../api';
import { useAuth } from '../auth/AuthContext';

export default function KeyManager() {
  const { token } = useAuth();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newPubKey, setNewPubKey] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const pemMatch = content.match(/-----BEGIN[^-]*-----([\s\S]*)-----END[^-]*-----/);
        setNewPubKey(pemMatch ? pemMatch[0].trim() : content.trim());

        if (!newName) setNewName(file.name.replace(/\.[^/.]+$/, ""));
      }
    };
    reader.readAsText(file);
  };

  const fetchKeys = async () => {
    try {
      const res = await fetch(getApiUrl('/api/auth/keys'), {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      });
      setKeys(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(getApiUrl('/api/auth/keys'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newName, publicKey: newPubKey })
      });
      if (res.ok) {
        setNewName('');
        setNewPubKey('');
        fetchKeys();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette clé ?')) return;
    try {
      await fetch(getApiUrl(`/api/auth/keys/${id}`), {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      });
      fetchKeys();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <ShieldCheck size={36} className="text-primary" />
            Clés Autorisées
          </h1>
          <p className="opacity-60 font-medium mt-1">Gérez les accès sécurisés à votre instance</p>
        </div>
        {keys.length === 0 && !loading && (
          <div className="badge badge-warning badge-lg gap-2 animate-pulse">
            <span className="font-bold">Mode Bootstrap Actif</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Register New Key */}
        <div className="card bg-base-300 border border-base-content/5 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-sm uppercase tracking-widest font-black opacity-50 mb-4 flex items-center gap-2">
              <Plus size={16} /> Ajouter une nouvelle clé
            </h2>
            <form onSubmit={handleAddKey} className="space-y-4">
              <div className="form-control">
                <input
                  type="text"
                  placeholder="Nom de la clé (ex: Laptop MacBook Pro)"
                  className="input input-bordered focus:input-primary bg-base-200"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div className="form-control">
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${isDragging ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-base-content/20 bg-base-200 hover:border-primary/50'
                    }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleFile(file);
                  }}
                  onClick={() => document.getElementById('pubkey-file')?.click()}
                >
                  <input
                    type="file"
                    id="pubkey-file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                  <div className="p-3 bg-base-100 rounded-xl shadow-sm text-primary">
                    <Upload size={24} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">Glissez votre fichier de clé publique ici</p>
                    <p className="text-xs opacity-50 mt-1">Ou cliquez pour parcourir vos fichiers (.pub, .pem, .txt)</p>
                  </div>
                </div>
              </div>
              <div className="form-control">
                <textarea
                  placeholder="Ou collez la Clé Publique (X.509 PEM) ici..."
                  className="textarea textarea-bordered h-24 font-mono text-xs bg-base-200 focus:textarea-primary"
                  value={newPubKey}
                  onChange={(e) => setNewPubKey(e.target.value)}
                  required
                />
              </div>
              <button className="btn btn-primary w-full" disabled={isAdding}>
                {isAdding ? <Loader2 className="animate-spin" /> : <KeyIcon size={18} />}
                Enregistrer la clé
              </button>
            </form>
          </div>
        </div>

        {/* Existing Keys List */}
        <div className="space-y-4">
          <h2 className="text-sm uppercase tracking-widest font-black opacity-50 mb-2">Clés Actuelles ({keys.length})</h2>
          {loading ? (
            <div className="flex justify-center py-10"><span className="loading loading-dots loading-lg"></span></div>
          ) : (
            keys.map(k => (
              <div key={k.id} className="group bg-base-100 p-5 rounded-3xl border border-base-content/5 shadow-sm hover:shadow-md transition-all flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <div className="p-3 bg-base-200 rounded-2xl text-primary">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">{k.name}</h3>
                    <div className="flex items-center gap-4 text-xs opacity-50 font-medium mt-1">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(k.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 font-mono">Fingerprint: {k.publicKey.substring(30, 45)}...</span>
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-circle text-error opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteKey(k.id)}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          )}
          {keys.length === 0 && !loading && (
            <div className="text-center py-10 bg-base-100/50 rounded-3xl border-2 border-dashed border-base-content/10">
              <p className="text-base-content/40 italic font-medium">Aucune clé enregistrée. Le système est en libre accès pour la première clé.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
