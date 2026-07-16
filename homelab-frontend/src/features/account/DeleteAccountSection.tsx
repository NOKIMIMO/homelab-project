import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import { authFetch } from '@auth/f_authFetch';

export default function DeleteAccountSection() {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await authFetch('/api/auth/account', { method: 'DELETE' }, () => {
        logout();
        navigate('/login');
      });
      if (!res) return;

      if (!res.ok) {
        let message = 'Failed to delete account.';
        try {
          const data = await res.json() as { message?: string };
          message = data.message || message;
        } catch {
          // non-JSON error body
        }
        setError(message);
        return;
      }

      logout();
      navigate('/login');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-md space-y-4 mt-10 pt-8 border-t border-error/20">
      <h2 className="text-xl font-bold flex items-center gap-2 text-error">
        <AlertTriangle size={20} /> Delete my account
      </h2>

      {isAdmin ? (
        <p className="text-sm opacity-60">
          You are an administrator: transfer your admin role to another account first
          (Administration → Access) before you can delete your account.
        </p>
      ) : (
        <>
          <p className="text-sm opacity-60">
            This action is permanent: your account and access are removed immediately.
          </p>

          {error && (
            <div className="alert alert-error border border-error/20 shadow-sm">
              <span className="text-xs font-bold">{error}</span>
            </div>
          )}

          {!confirming ? (
            <button className="btn btn-error btn-outline gap-2" onClick={() => setConfirming(true)}>
              <Trash2 size={16} /> Delete my account
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                className="btn btn-error gap-2"
                disabled={deleting}
                onClick={() => void handleDelete()}
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Confirm deletion
              </button>
              <button className="btn btn-ghost" disabled={deleting} onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
