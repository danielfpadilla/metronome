import { useState } from 'react';
import { isValidYouTubeUrl } from '@/utils/youtube';
import { useAuthContext } from '@/components/Auth/AuthProvider';
import { AuthModal } from '@/components/Auth/AuthModal';

interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddYouTube: (url: string, title: string) => Promise<unknown>;
  onAddManual: (title: string, bpm: number) => Promise<unknown>;
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
      setError(err instanceof Error ? err.message : 'Failed to add track');
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
      setError(err instanceof Error ? err.message : 'Failed to add track');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1a24] rounded-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-bold text-white mb-4">Add Track</h2>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('youtube')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'youtube' ? 'bg-[#00e0c6] text-[#0f0f14]' : 'bg-[#0f0f14] text-[#888] hover:text-white'
              }`}
            >
              YouTube
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'manual' ? 'bg-[#00e0c6] text-[#0f0f14]' : 'bg-[#0f0f14] text-[#888] hover:text-white'
              }`}
            >
              Manual BPM
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Track title"
              className="w-full px-3 py-2.5 bg-[#0f0f14] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#00e0c6]"
            />
            {mode === 'youtube' ? (
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2.5 bg-[#0f0f14] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#00e0c6]"
              />
            ) : (
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                min={40}
                max={240}
                className="w-full px-3 py-2.5 bg-[#0f0f14] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#00e0c6]"
              />
            )}
          </div>

          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

          <div className="flex gap-2 mt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-[#0f0f14] border border-[#333] text-[#888] rounded-lg hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={mode === 'youtube' ? handleYouTube : handleManual}
              disabled={loading}
              className="flex-1 py-2.5 bg-[#00e0c6] text-[#0f0f14] font-semibold rounded-lg hover:shadow-[0_0_12px_rgba(0,224,198,0.3)] transition-shadow disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Track'}
            </button>
          </div>
        </div>
      </div>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}