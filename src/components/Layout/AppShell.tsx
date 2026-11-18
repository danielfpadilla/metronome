import { BottomNav } from './BottomNav';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/Auth/AuthProvider';
import { AuthModal } from '@/components/Auth/AuthModal';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, signOut } = useAuthContext();
  const [showAuth, setShowAuth] = useState(false);

  // Apply saved theme from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('metronome-settings');
      const theme = saved ? JSON.parse(saved).theme : 'dark';
      document.documentElement.classList.toggle('dark', theme === 'dark');
    } catch {
      /* ignore quota errors */
    }
  }, []);

  return (
    <div className="flex h-screen bg-[#0f0f14]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-[#1a1a24] border-r border-[#333] p-4">
        <div className="text-xl font-bold text-[#00e0c6] mb-6">Metronome</div>
        <nav className="space-y-1">
          {[
            { path: '/', label: 'Metronome', icon: '♪' },
            { path: '/library', label: 'Library', icon: '☰' },
            { path: '/playlists', label: 'Playlists', icon: '♫' },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#888] hover:text-white hover:bg-[#0f0f14] transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Auth section */}
        <div className="mt-auto pt-4 border-t border-[#333]">
          {user ? (
            <div className="space-y-2">
              <p className="text-xs text-[#888] truncate">{user.email}</p>
              <button
                onClick={() => signOut()}
                className="w-full px-3 py-2 text-xs text-[#888] hover:text-white border border-[#333] rounded-lg transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="w-full px-3 py-2 bg-[#00e0c6] text-[#0f0f14] font-semibold rounded-lg text-sm hover:shadow-[0_0_12px_rgba(0,224,198,0.3)] transition-shadow"
            >
              Sign in
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>

      <BottomNav />

      {/* Mobile auth button (floating) */}
      {!user && (
        <button
          onClick={() => setShowAuth(true)}
          className="fixed bottom-20 right-4 md:hidden z-50 px-4 py-2 bg-[#00e0c6] text-[#0f0f14] font-semibold rounded-full text-sm shadow-lg hover:shadow-[0_0_12px_rgba(0,224,198,0.3)] transition-shadow"
        >
          Sign in
        </button>
      )}

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
