import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Metronome', icon: '♪' },
  { path: '/library', label: 'Library', icon: '☰' },
  { path: '/playlists', label: 'Playlists', icon: '♫' },
];

export function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isSettingsActive = location.pathname === '/' && new URLSearchParams(location.search).get('settings') === '1';

  const go = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const speedDialAction = (item: { path: string; label: string; icon: string }) => (
    <button
      onClick={() => go(item.path)}
      className={`w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:text-[var(--accent)] transition-colors flex items-center justify-center shadow-lg ${
        location.pathname === item.path ? 'bg-[var(--accent-dim)] text-[var(--accent)]' : ''
      }`}
      aria-label={item.label}
      aria-current={location.pathname === item.path ? 'page' : undefined}
    >
      <span className="text-lg">{item.icon}</span>
    </button>
  );

  return (
    <>
      {/* Speed dial FAB */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 md:hidden w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:text-[var(--accent)] transition-colors flex items-center justify-center shadow-lg"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        <span className="text-xl leading-none">{isOpen ? '✕' : '☰'}</span>
      </button>

      {/* Speed dial actions */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 md:hidden flex flex-col items-end gap-3">
          {NAV_ITEMS.map((item) => speedDialAction(item))}
          <button
            onClick={() => go('/?settings=1')}
            className={`w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:text-[var(--accent)] transition-colors flex items-center justify-center shadow-lg ${
              isSettingsActive ? 'bg-[var(--accent-dim)] text-[var(--accent)]' : ''
            }`}
            aria-label="Settings"
          >
            <span className="text-lg">⚙</span>
          </button>
        </div>
      )}
    </>
  );
}
