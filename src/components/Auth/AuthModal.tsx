import { useState, useEffect } from 'react';
import { useAuthContext } from './AuthProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { signIn } = useAuthContext();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setSent(false);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email);
      setSent(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a24] rounded-xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold text-[#00e0c6] mb-2">Sign in to save</h2>
        <p className="text-[#888] text-sm mb-4">
          {sent
            ? 'Check your email for a magic link to sign in.'
            : 'Enter your email to create an account or sign in.'}
        </p>
        {!sent && (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3 py-2.5 bg-[#0f0f14] border border-[#333] rounded-lg text-white text-sm mb-3 focus:outline-none focus:border-[#00e0c6]"
              required
            />
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#00e0c6] text-[#0f0f14] font-semibold rounded-lg hover:shadow-[0_0_12px_rgba(0,224,198,0.3)] transition-shadow disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send magic link'}
            </button>
          </form>
        )}
        <button
          onClick={onClose}
          className="w-full mt-3 text-[#888] text-sm hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}