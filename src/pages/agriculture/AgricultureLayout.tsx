/**
 * 农业灾情统计端布局 - 移动端
 * 顶部主色栏 + 底部Tab导航 + 内容区
 */
import type { ReactNode } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Sprout, FileText, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  match: (path: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/agriculture',
    label: '灾情登记',
    icon: <FileText size={20} />,
    match: (p) => p === '/agriculture',
  },
  {
    to: '/agriculture/ledger',
    label: '灾情台账',
    icon: <BookOpen size={20} />,
    match: (p) => p.startsWith('/agriculture/ledger'),
  },
];

export default function AgricultureLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative w-full max-w-[480px] min-h-screen bg-bg flex flex-col mx-auto">
      {/* 顶部栏 */}
      <header className="h-14 bg-primary text-white flex items-center justify-between px-4 shadow-card sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Sprout size={22} />
          <span className="font-bold text-base">农业灾情统计</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-90">{user?.name || '统计员'}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 hover:bg-white/10 px-2 py-1 rounded-btn transition-colors"
          >
            <LogOut size={16} /> 退出
          </button>
        </div>
      </header>

      {/* 内容区 */}
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30 h-14 bg-white border-t border-border flex">
        {NAV_ITEMS.map((item) => {
          const active = item.match(location.pathname);
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors',
                active ? 'text-primary font-bold' : 'text-ink-sub'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
