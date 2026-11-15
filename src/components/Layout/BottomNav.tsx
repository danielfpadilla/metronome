import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Metronome', icon: '♪' },
  { path: '/library', label: 'Library', icon: '☰' },
  { path: '/playlists', label: 'Playlists', icon: '♫' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a24] border-t border-[#333] flex md:hidden z-40">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
              isActive ? 'text-[#00e0c6]' : 'text-[#888] hover:text-white'
            }`
          }
        >
          <span className="text-lg">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}