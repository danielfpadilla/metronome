import { BottomNav } from './BottomNav';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
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
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}