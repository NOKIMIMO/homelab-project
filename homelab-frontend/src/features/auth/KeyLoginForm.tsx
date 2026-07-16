import { useState } from 'react';
import { Key, KeyRound, Loader2, AlertCircle, Upload } from 'lucide-react';
import { authenticateWithPrivateKey } from './authHooks';

interface KeyLoginFormProps {
  onLoginSuccess: (token: string, keyName: string) => void;
}

export default function KeyLoginForm({ onLoginSuccess }: KeyLoginFormProps) {
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) setPrivateKey(content.trim());
    };
    reader.readAsText(file);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (privateKey.startsWith('ssh-rsa') || privateKey.includes('---- BEGIN SSH2 PUBLIC KEY ----')) {
        setError("Warning: You are trying to use a PUBLIC KEY to sign in. Signing in requires your PRIVATE KEY (the one starting with '-----BEGIN PRIVATE KEY-----').");
        setLoading(false);
        return;
      }

      if (privateKey.includes('PuTTY-User-Key-File')) {
        setError("Detected .ppk (PuTTY) format. This format is not directly supported by the browser. Please export your key as 'OpenSSH Key' and then convert it to PKCS#8.");
        setLoading(false);
        return;
      }

      const result = await authenticateWithPrivateKey(privateKey);
      if (result.success && result.token) {
        onLoginSuccess(result.token, result.keyName || '');
      } else {
        setError(result.message || "Authentication failed");
      }
    } catch (err: unknown) {
      console.error(err);
      setError("Technical error: check that your key is in PKCS#8 RSA PEM format. (OpenSSH keys must be converted to PKCS#8)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {error && (
        <div className="alert alert-error mb-2 shadow-sm">
          <AlertCircle size={18} />
          <span className="text-xs font-bold">{error}</span>
        </div>
      )}

      <div className="form-control">
        <label className="label">
          <span className="label-text font-bold flex items-center gap-2"><Key size={14} /> Private Key (PKCS#8 PEM)</span>
        </label>
        <div
          className={`relative border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer mb-4 ${isDragging ? 'border-primary bg-primary/5' : 'border-base-content/10 bg-base-200 hover:border-primary/30'}`}
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
          <p className="text-xs font-medium opacity-70">Drag your private key file here or click to browse</p>
        </div>
        <textarea
          className="textarea textarea-bordered h-32 font-mono text-[10px] focus:textarea-primary transition-all bg-base-200"
          placeholder="Or paste the content here: -----BEGIN PRIVATE KEY-----..."
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          required
        ></textarea>
        <label className="label">
          <span className="label-text-alt opacity-50 italic">Your key never leaves your browser.</span>
          <span className="label-text-alt opacity-50 italic">It is used only to sign the nonce.</span>
        </label>
      </div>

      <button className="btn btn-primary w-full gap-2 shadow-lg shadow-primary/20 h-14 rounded-2xl" disabled={loading}>
        {loading ? <Loader2 size={20} className="animate-spin" /> : <KeyRound size={20} />}
        Sign In to Homelab
      </button>
    </form>
  );
}
