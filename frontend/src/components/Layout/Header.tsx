import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/events': 'Kirish/Chiqish Loglari',
  '/employees': 'Xodimlar',
  '/devices': 'Qurilmalar',
  '/reports': 'Hisobotlar',
};

function pageTitle(path: string): string {
  if (path.startsWith('/employees/')) return 'Xodim ma\'lumotlari';
  return titles[path] ?? 'FaceID';
}

export function Header({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="text-2xl text-gray-600 lg:hidden">
          ☰
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{pageTitle(pathname)}</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden font-mono text-sm text-gray-600 sm:block">
          {format(now, 'dd.MM.yyyy HH:mm:ss')}
        </span>
        <button className="relative text-xl text-gray-500 hover:text-gray-700" title="Bildirishnomalar">
          🔔
        </button>
        <button
          onClick={logout}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-denied hover:bg-red-50"
        >
          Chiqish
        </button>
      </div>
    </header>
  );
}
