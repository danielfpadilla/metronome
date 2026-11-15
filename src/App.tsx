import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/Auth/AuthProvider';
import { AppShell } from './components/Layout/AppShell';
import { Metronome } from './components/Metronome/Metronome';
import { Library } from './components/Library/Library';
import { Playlists } from './components/Playlists/Playlists';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Metronome />} />
            <Route path="/library" element={<Library />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </AuthProvider>
    </BrowserRouter>
  );
}