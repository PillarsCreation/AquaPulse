/**
 * 救援端布局 - 移动端 (375x667)
 * 顶部橙色状态栏 + 任务数量概览
 */
import { useEffect, useState, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Shield, ClipboardList, Map, Users, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { rescueApi } from '@/lib/api';
import type { RescueTask } from '@/types';

export default function RescueLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState<RescueTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(() => {
    if (!user?.teamId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    rescueApi
      .tasks({ teamId: user.teamId })
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [user?.teamId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const dispatched = tasks.filter((t) => t.status === 'dispatched').length;
  const inProgress = tasks.filter((t) => t.status === 'enroute' || t.status === 'arrived').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* 顶部栏 56px 橙色 */}
      <header className="h-14 bg-warn-orange text-white flex items-center justify-between px-4 shadow-card sticky top-0 z-50">
        <div className="flex items-center gap-2 min-w-0">
          <Shield size={22} className="shrink-0" />
          <div className="leading-tight min-w-0">
            <div className="text-sm font-bold truncate">
              {user?.team?.name || '救援队伍'}
            </div>
            <div className="text-[10px] opacity-90">
              {user?.name} · 救援指挥端
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm hover:opacity-80 shrink-0"
        >
          <LogOut size={16} /> 退出
        </button>
      </header>

      {/* 任务数量概览 */}
      <div className="bg-white border-b border-border px-4 py-2 flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1 text-ink-sub shrink-0">
          <ClipboardList size={14} /> 任务概览
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="tag bg-warn-orange/10 text-warn-orange font-bold">
            待出发 {dispatched}
          </span>
          <span className="tag bg-accent/10 text-accent font-bold">
            执行中 {inProgress}
          </span>
          <span className="tag bg-safe/10 text-safe font-bold">
            已完成 {completed}
          </span>
        </div>
      </div>

      {/* 内容区 最大宽度 480px 居中 */}
      <main className="flex-1 w-full max-w-[480px] mx-auto pb-16">
        <Outlet context={{ refreshSummary: fetchTasks, summaryLoading: loading }} />
      </main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[60px] bg-card border-t border-border flex z-50">
        <TabItem
          icon={<ClipboardList size={20} />}
          label="任务"
          active={location.pathname === '/rescue' || location.pathname.startsWith('/rescue/task')}
          badge={dispatched}
          onClick={() => navigate('/rescue')}
        />
        <TabItem
          icon={<Map size={20} />}
          label="地图"
          active={false}
          onClick={() => alert('地图功能：显示所有任务位置点、实时路况、危险区域')}
        />
        <TabItem
          icon={<Users size={20} />}
          label="队伍"
          active={location.pathname === '/rescue/team'}
          onClick={() => navigate('/rescue/team')}
        />
        <TabItem
          icon={<MessageCircle size={20} />}
          label="消息"
          active={location.pathname === '/rescue/messages'}
          badge={4}
          onClick={() => navigate('/rescue/messages')}
        />
      </nav>
    </div>
  );
}

function TabItem({
  icon, label, active, badge, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
        active ? 'text-primary' : 'text-ink-sub'
      }`}
    >
      {icon}
      <span className="text-[10px]">{label}</span>
      {badge != null && badge > 0 && (
        <span className="absolute top-1 right-1/2 translate-x-[14px] min-w-[16px] h-4 rounded-full bg-warn-red text-white text-[9px] flex items-center justify-center px-1">
          {badge}
        </span>
      )}
    </button>
  );
}
