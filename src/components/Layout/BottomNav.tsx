import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Metronome', icon: '♪' },
  { path: '/library', label: 'Library', icon: '☰' },
  { path: '/playlists', label: 'Playlists', icon: '♫' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--line)] flex md:hidden z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] text-xs transition-colors ${
              isActive ? 'text-[var(--accent)]' : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
            }`
          }
        >
          <span className="text-xl leading-none">{item.icon}</span>
          <span className="mt-0.5">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
