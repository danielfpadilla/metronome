import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuthContext } from './components/Auth/AuthProvider';
import { AppShell } from './components/Layout/AppShell';
import { Metronome } from './components/Metronome/Metronome';
import { Library } from './components/Library/Library';
import { Playlists } from './components/Playlists/Playlists';
import { AuthModal } from './components/Auth/AuthModal';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) return <div className="flex items-center justify-center h-full text-[#888]">Loading...</div>;
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <p className="text-[#888] text-center">Sign in to access your library and playlists.</p>
        <button
          onClick={() => setShowAuth(true)}
          className="px-6 py-3 bg-[#00e0c6] text-[#0f0f14] font-semibold rounded-lg hover:shadow-[0_0_12px_rgba(0,224,198,0.3)] transition-shadow"
        >
          Sign in
        </button>
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Metronome />} />
            <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
            <Route path="/playlists" element={<ProtectedRoute><Playlists /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </AuthProvider>
    </BrowserRouter>
  );
}
