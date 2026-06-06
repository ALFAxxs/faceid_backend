import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/events', label: 'Kirish/Chiqish Loglari', icon: '📋' },
  { to: '/employees', label: 'Xodimlar', icon: '👥' },
  { to: '/devices', label: 'Qurilmalar', icon: '🖥️' },
  { to: '/reports', label: 'Hisobotlar', icon: '📊' },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { username, logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-gray-200 bg-white transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-5">
          <span className="text-2xl">🛡️</span>
          <span className="text-lg font-bold text-gray-900">FaceID</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-accent text-white' : 'text-gray-700 hover:bg-gray-100'
                )
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 font-semibold text-accent">
              {username?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{username ?? 'Foydalanuvchi'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-denied hover:bg-red-50"
          >
            <span className="text-lg">🚪</span>
            Chiqish
          </button>
        </div>
      </aside>
    </>
  );
}
