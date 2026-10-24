/**
 * 救援队消息中心 - 仅显示指挥部下达消息
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';

interface Message {
  id: string;
  type: 'task' | 'alert' | 'notice' | 'system';
  title: string;
  content: string;
  time: string;
  read: boolean;
}

const MESSAGES: Message[] = [
  {
    id: '1',
    type: 'task',
    title: '新任务下达',
    content:
      '指挥中心已下达新任务 YJ-0312：云岭村3组·王建国求助（中伤·需担架），请立即前往。',
    time: '09:15',
    read: false,
  },
  {
    id: '2',
    type: 'task',
    title: '新任务下达',
    content:
      '指挥中心已下达新任务 YJ-0313：云岭村5组·张桂花物资转运，请尽快处理。',
    time: '09:20',
    read: false,
  },
  {
    id: '3',
    type: 'notice',
    title: '路线更新通知',
    content:
      '云岭村3组→老林沟路段因积水1.2m已封路，推荐路线已更新为：村主干道→云岭大道→镇中心小学。',
    time: '09:25',
    read: true,
  },
  {
    id: '4',
    type: 'alert',
    title: '安全提醒',
    content:
      '指挥中心提醒：当前降雨强度35mm/h，能见度低，请注意行车安全。山区信号不稳定，建议携带对讲机。',
    time: '09:30',
    read: true,
  },
  {
    id: '5',
    type: 'notice',
    title: '增援通知',
    content:
      '第二救援梯队已从云岭镇政府出发，预计20分钟后到达桂花村3组协助灾情核实。',
    time: '09:45',
    read: true,
  },
  {
    id: '6',
    type: 'task',
    title: '任务状态更新',
    content:
      '任务 YJ-0311（刘德福转移）已到达求助人位置，正在进行人员转移，预计10:00完成。',
    time: '09:50',
    read: true,
  },
];

const TYPE_CONFIG: Record<
  Message['type'],
  {
    icon: React.ReactNode;
    color: string;
    bg: string;
    label: string;
  }
> = {
  task: {
    icon: <ClipboardList size={16} />,
    color: '#F57C00',
    bg: 'bg-warn-orange/10',
    label: '任务',
  },
  alert: {
    icon: <AlertTriangle size={16} />,
    color: '#E62020',
    bg: 'bg-warn-red/10',
    label: '预警',
  },
  notice: {
    icon: <Bell size={16} />,
    color: '#1976D2',
    bg: 'bg-warn-blue/10',
    label: '通知',
  },
  system: {
    icon: <ShieldCheck size={16} />,
    color: '#27AE60',
    bg: 'bg-safe/10',
    label: '系统',
  },
};

export default function RescueMessages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(MESSAGES);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);

  const unreadCount = messages.filter((m) => !m.read).length;

  const handleMarkAllRead = () => {
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
  };

  const handleMessageClick = (msg: Message) => {
    setSelectedMsg(msg);
    // 标记为已读
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m))
    );
  };

  return (
    <div className="animate-fade-in">
      {/* 顶部返回栏 */}
      <header className="sticky top-0 z-30 bg-warn-orange text-white flex items-center justify-between px-4 h-12 shadow-card">
        <button
          onClick={() => navigate('/rescue')}
          className="flex items-center gap-1 text-sm active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} />
          <span className="font-bold text-base">消息中心</span>
        </button>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs bg-white/20 px-3 py-1 rounded-btn active:scale-95 transition-transform flex items-center gap-1"
          >
            <CheckCircle2 size={14} />
            全部已读
          </button>
        )}
      </header>

      {/* 未读统计 */}
      <div className="px-4 py-2 flex items-center gap-2 text-xs text-ink-sub bg-card border-b border-border">
        <Bell size={14} className="text-warn-orange" />
        <span>
          {unreadCount > 0
            ? `${unreadCount} 条未读消息`
            : '所有消息已读'}
        </span>
        <span className="ml-auto">共 {messages.length} 条</span>
      </div>

      {/* 消息列表 */}
      <div className="divide-y divide-border">
        {messages.map((msg) => {
          const cfg = TYPE_CONFIG[msg.type];
          return (
            <button
              key={msg.id}
              onClick={() => handleMessageClick(msg)}
              className={`w-full flex items-start gap-3 px-4 py-3 bg-card text-left active:bg-bg transition-colors ${
                msg.read ? 'opacity-70' : ''
              }`}
            >
              {/* 左侧图标 */}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}
                style={{ color: cfg.color }}
              >
                {cfg.icon}
              </div>

              {/* 中间内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink truncate">
                    {msg.title}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      color: cfg.color,
                      backgroundColor: cfg.bg,
                    }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <div className="text-xs text-ink-sub mt-0.5 line-clamp-2 leading-relaxed">
                  {msg.content}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-ink-sub">
                  <Clock size={10} />
                  <span>今天 {msg.time}</span>
                  <span className="ml-auto">来自：指挥部</span>
                </div>
              </div>

              {/* 右侧未读红点 / 箭头 */}
              <div className="flex flex-col items-center justify-center gap-1 shrink-0 pt-1">
                {!msg.read && (
                  <span className="w-2 h-2 rounded-full bg-warn-red" />
                )}
                <ChevronRight size={16} className="text-ink-sub" />
              </div>
            </button>
          );
        })}
      </div>

      {/* 消息详情底部弹窗 */}
      {selectedMsg && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setSelectedMsg(null)}
        >
          <div className="absolute inset-0 bg-black/40 animate-fade-in" />
          <div
            className="relative w-full max-w-[480px] bg-white rounded-t-card animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-4 h-12 border-b border-border">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    TYPE_CONFIG[selectedMsg.type].bg
                  }`}
                  style={{ color: TYPE_CONFIG[selectedMsg.type].color }}
                >
                  {TYPE_CONFIG[selectedMsg.type].icon}
                </div>
                <span className="text-sm font-bold text-ink">
                  {selectedMsg.title}
                </span>
              </div>
              <button
                onClick={() => setSelectedMsg(null)}
                className="text-xs bg-bg px-3 py-1 rounded-btn text-ink-sub active:scale-95 transition-transform"
              >
                关闭
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs text-ink-sub mb-3">
                <Clock size={12} />
                <span>今天 {selectedMsg.time}</span>
                <span className="ml-auto">来自：指挥部</span>
              </div>
              <div className="bg-bg rounded-btn p-3 text-sm text-ink leading-relaxed">
                {selectedMsg.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
