import { useState } from 'react';
import { Key, Lock, KeyRound, Loader2, AlertCircle, Upload, Plus } from 'lucide-react';
import { getApiUrl } from '../api';
import { useEffect } from 'react';

interface LoginProps {
  onLoginSuccess: (token: string, keyName: string) => void;
  onShowBootstrap: () => void;
}

export default function Login({ onLoginSuccess, onShowBootstrap }: LoginProps) {
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [noKeys, setNoKeys] = useState(false);

  useEffect(() => {
    fetch(getApiUrl('/api/auth/keys'))
      .then(res => res.json())
      .then(keys => setNoKeys(keys.length === 0))
      .catch(console.error);
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setPrivateKey(content.trim());
      }
    };
    reader.readAsText(file);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (privateKey.startsWith('ssh-rsa') || privateKey.includes('---- BEGIN SSH2 PUBLIC KEY ----')) {
        setError("Attention : Vous essayez d'utiliser une CLÉ PUBLIQUE pour vous connecter. La connexion nécessite votre CLÉ PRIVÉE (celle qui commence par '-----BEGIN PRIVATE KEY-----').");
        setLoading(false);
        return;
      }

      if (privateKey.includes('PuTTY-User-Key-File')) {
        setError("Format .ppk (PuTTY) détecté. Ce format n'est pas supporté directement par le navigateur. Veuillez exporter votre clé en 'OpenSSH Key' puis la convertir en PKCS#8.");
        setLoading(false);
        return;
      }

      const challengeRes = await fetch(getApiUrl('/api/auth/challenge'));
      const { challenge } = await challengeRes.json();

      // console.log("Clé privée brute (longueur):", privateKey.length);
      const pemMatch = privateKey.match(/-----BEGIN[^-]*-----([\s\S]*)-----END[^-]*-----/);
      const base64Content = (pemMatch ? pemMatch[1] : privateKey)
        .replace(/[\n\r\t\s]/g, '')
        .trim();

      // console.log("Contenu Base64 nettoyé (longueur):", base64Content.length);
      // console.log("Aperçu (20 premiers caractères):", base64Content.substring(0, 20));

      // Validation des caractères Base64 avant atob
      const invalidChars = base64Content.match(/[^A-Za-z0-9+/=]/g);
      if (invalidChars) {
        console.error("Caractères invalides trouvés:", Array.from(new Set(invalidChars)));
        setError(`La clé contient des caractères invalides : ${Array.from(new Set(invalidChars)).join(' ')}`);
        setLoading(false);
        return;
      }

      const binaryKey = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));

      const importedKey = await window.crypto.subtle.importKey(
        'pkcs8',
        binaryKey,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature = await window.crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        importedKey,
        new TextEncoder().encode(challenge)
      );

      const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

      const loginRes = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge, signature: signatureBase64 })
      });

      const result = await loginRes.json();
      if (result.success) {
        onLoginSuccess(result.token, result.keyName);
      } else {
        setError(result.message || 'Échec de l\'authentification');
      }
    } catch (err: any) {
      console.error(err);
      setError("Erreur technique : Vérifiez que votre clé est au format PKCS#8 RSA PEM. (Les clés OpenSSH doivent être converties en PKCS#8)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-300 p-4">
      <div className="max-w-md w-full bg-base-100 rounded-3xl shadow-2xl p-8 border border-base-content/5">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-primary/10 rounded-2xl mb-4">
            <KeyRound size={48} className="text-primary" />
          </div>
          <h1 className="text-3xl font-black text-center">Authentification Clé</h1>
          <p className="text-base-content/50 text-sm mt-2">Signez le challenge avec votre clé privée</p>
        </div>

        {error && (
          <div className="alert alert-error mb-6 shadow-sm">
            <AlertCircle size={20} />
            <span className="text-xs font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold flex items-center gap-2"><Lock size={14} /> Clé Privée (PKCS#8 PEM)</span>
            </label>
            <div
              className={`relative border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer mb-4 ${isDragging ? 'border-primary bg-primary/5' : 'border-base-content/10 bg-base-200 hover:border-primary/30'
                }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => document.getElementById('privkey-file')?.click()}
            >
              <input
                type="file"
                id="privkey-file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <Upload size={24} className="text-primary opacity-50" />
              <p className="text-xs font-medium opacity-70">Glissez votre fichier de clé privée ou cliquez ici</p>
            </div>
            <textarea
              className="textarea textarea-bordered h-32 font-mono text-[10px] focus:textarea-primary transition-all bg-base-200"
              placeholder="Ou collez le contenu ici : -----BEGIN PRIVATE KEY-----..."
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              required
            ></textarea>
            <label className="label">
              <span className="label-text-alt opacity-50 italic">La clé ne quitte jamais votre navigateur.</span>
              <span className="label-text-alt opacity-50 italic">Elle est utilisée uniquement pour signer le nonce.</span>
            </label>
          </div>

          <button className="btn btn-primary w-full gap-2 shadow-lg shadow-primary/20 h-14 rounded-2xl" disabled={loading}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Key size={20} />}
            Connexion au Homelab
          </button>
        </form>

        {noKeys && (
          <div className="mt-8 pt-6 border-t border-base-content/10 text-center">
            <div className="badge badge-warning gap-2 mb-3">
              Mode Bootstrap
            </div>
            <p className="text-xs opacity-50 mb-4">
              Aucune clé n'est enregistrée. Ajoutez votre première clé publique pour sécuriser l'accès.
            </p>
            <button className="btn btn-outline btn-sm w-full gap-2" onClick={onShowBootstrap}>
              <Plus size={16} /> Enregistrer la première clé
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
