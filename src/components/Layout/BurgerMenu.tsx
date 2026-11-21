import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Metronome', icon: '♪' },
  { path: '/library', label: 'Library', icon: '☰' },
  { path: '/playlists', label: 'Playlists', icon: '♫' },
];

export function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Hamburger button - fixed top-left on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:text-[var(--accent)] transition-colors"
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        <span className="text-lg leading-none">☰</span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out menu */}
      <nav
        className={`fixed top-0 left-0 h-full w-64 bg-[var(--surface)] border-r border-[var(--line)] z-50 transform transition-transform duration-200 ease-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--line)]">
          <span className="text-xl font-bold text-[var(--accent)]">Metronome</span>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <div className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
