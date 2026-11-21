import { useState } from 'react';
import { isValidYouTubeUrl } from '@/utils/youtube';
import { useAuthContext } from '@/components/Auth/AuthProvider';
import { AuthModal } from '@/components/Auth/AuthModal';

interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddYouTube: (url: string, title: string) => Promise<any>;
  onAddManual: (title: string, bpm: number) => Promise<any>;
}

export function AddTrackModal({ isOpen, onClose, onAddYouTube, onAddManual }: AddTrackModalProps) {
  const { user } = useAuthContext();
  const [mode, setMode] = useState<'youtube' | 'manual'>('youtube');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [bpm, setBpm] = useState(120);
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleYouTube = async () => {
    if (!user) { setShowAuth(true); return; }
    if (!isValidYouTubeUrl(url)) { setError('Invalid YouTube URL'); return; }
    setLoading(true);
    setError(null);
    try {
      await onAddYouTube(url, title || 'Untitled Track');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add track';
      // Provide more helpful error messages
      if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
        setError('Permission denied. Make sure Firestore security rules are deployed and you are signed in.');
      } else if (msg.includes('not-authenticated') || msg.includes('Not authenticated')) {
        setError('Please sign in first to add tracks.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManual = async () => {
    if (!user) { setShowAuth(true); return; }
    setLoading(true);
    setError(null);
    try {
      await onAddManual(title || 'Untitled Track', bpm);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add track';
      // Provide more helpful error messages
      if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
        setError('Permission denied. Make sure Firestore security rules are deployed and you are signed in.');
      } else if (msg.includes('not-authenticated') || msg.includes('Not authenticated')) {
        setError('Please sign in first to add tracks.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1a24] rounded-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#00e0c6]">Add Track</h2>
            <button onClick={onClose} className="text-[#888] hover:text-white">✕</button>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('youtube')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'youtube' ? 'bg-[#00e0c6] text-[#0f0f14]' : 'bg-[#0f0f14] text-[#888] border border-[#333]'
              }`}
            >
              YouTube
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'manual' ? 'bg-[#00e0c6] text-[#0f0f14]' : 'bg-[#0f0f14] text-[#888] border border-[#333]'
              }`}
            >
              Manual
            </button>
          </div>

          {mode === 'youtube' ? (
            <div className="space-y-3">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="YouTube URL"
                className="w-full px-3 py-2.5 bg-[#0f0f14] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#00e0c6]"
              />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Track title (optional)"
                className="w-full px-3 py-2.5 bg-[#0f0f14] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#00e0c6]"
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                onClick={handleYouTube}
                disabled={loading || !url}
                className="w-full py-2.5 bg-[#00e0c6] text-[#0f0f14] font-semibold rounded-lg hover:shadow-[0_0_12px_rgba(0,224,198,0.3)] transition-shadow disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Track'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Track title"
                className="w-full px-3 py-2.5 bg-[#0f0f14] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#00e0c6]"
              />
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#888]">BPM:</span>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  min={40}
                  max={240}
                  className="flex-1 px-3 py-2.5 bg-[#0f0f14] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#00e0c6]"
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                onClick={handleManual}
                disabled={loading}
                className="w-full py-2.5 bg-[#00e0c6] text-[#0f0f14] font-semibold rounded-lg hover:shadow-[0_0_12px_rgba(0,224,198,0.3)] transition-shadow disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Track'}
              </button>
            </div>
          )}
        </div>
      </div>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
