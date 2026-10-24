/**
 * 村民端 - 首页
 * 预警提醒 + 四个快捷操作 + 防汛避险须知
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Ambulance, LifeBuoy, Phone, AlertTriangle, ChevronRight,
  ShieldAlert, Mountain, Waves, CloudRain, Clock, Navigation,
  BookOpen, Heart, PhoneCall, Bell, X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { warningApi } from '@/lib/api';
import { WARNING_CONFIG } from '@/types';
import type { Warning, WarningLevel } from '@/types';
import { useAuthStore } from '@/store/auth';
import { Loading } from '@/components/ui';
import { timeAgo } from '@/lib/utils';

const LEVEL_ORDER: Record<WarningLevel, number> = { red: 4, orange: 3, yellow: 2, blue: 1 };

export default function VillagerHome() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const villageId = user?.villageId;
  const villageName = user?.village?.name;
  const [warning, setWarning] = useState<Warning | null>(null);
  const [loading, setLoading] = useState(true);
  const spokenRef = useRef<string | null>(null);

  // 最新通知相关
  const [noticeDetail, setNoticeDetail] = useState<{
    title: string;
    detail: string;
  } | null>(null);

  const NOTICES = [
    {
      id: '1',
      icon: <AlertTriangle size={18} />,
      iconBg: 'bg-warn-red/10',
      iconColor: 'text-warn-red',
      title: '紧急转移通知',
      desc: '请于10:30前转移至云岭镇中心小学安置点',
      detail:
        '云岭村3组全体村民请注意，因持续强降雨，请于10:30前携带贵重物品，沿村口主干道向东步行至云岭镇中心小学安置点。',
    },
    {
      id: '2',
      icon: <Ambulance size={18} />,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
      title: '救援队已出发',
      desc: '预计15分钟后到达 · 队长：李志强',
      detail:
        '救援队已出发，预计15分钟到达村口集合点，请保持手机畅通。',
    },
    {
      id: '3',
      icon: <LifeBuoy size={18} />,
      iconBg: 'bg-safe/10',
      iconColor: 'text-safe',
      title: '物资发放通知',
      desc: '安置点已备足饮用水、食品、毛毯',
      detail:
        '物资发放通知：安置点已备足饮用水、方便食品、毛毯、常用药品，到达后凭登记码领取。',
    },
  ];

  useEffect(() => {
    let cancelled = false;
    if (!villageId) {
      setLoading(false);
      return;
    }
    warningApi
      .list({ villageId, status: 'active' })
      .then((list) => {
        if (cancelled) return;
        if (list && list.length) {
          const sorted = [...list].sort((a, b) => LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level]);
          setWarning(sorted[0]);
        } else {
          setWarning(null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [villageId]);

  // 高风险（红/橙）触发语音播报
  useEffect(() => {
    if (!warning) return;
    const highRisk = warning.level === 'red' || warning.level === 'orange';
    if (highRisk && spokenRef.current !== warning.id) {
      spokenRef.current = warning.id;
      try {
        if ('speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(
            `${WARNING_CONFIG[warning.level].label}，${
              warning.village_name || villageName || ''
            }，请立即避险撤离`
          );
          utter.lang = 'zh-CN';
          utter.rate = 1;
          window.speechSynthesis.speak(utter);
        }
      } catch {
        /* 忽略语音播报异常 */
      }
    }
  }, [warning, villageName]);

  if (loading) return <Loading text="加载中..." />;

  const cfg = warning ? WARNING_CONFIG[warning.level] : null;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* 预警提醒卡片 */}
      {warning && cfg ? (
        <div
          className="rounded-card overflow-hidden shadow-card-lg"
          style={{ backgroundColor: cfg.color, color: warning.level === 'yellow' ? '#1D2129' : '#fff' }}
        >
          <div className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 animate-pulse-warn flex-shrink-0" />
              <span className="font-bold text-sm">{cfg.label}</span>
              <span className="ml-auto text-xs opacity-90 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {timeAgo(warning.publish_time)}
              </span>
            </div>
            <div className="text-base font-bold leading-snug">{warning.title}</div>
            <div className="text-xs opacity-90 mt-1">
              {warning.village_name || villageName} ·{' '}
              {new Date(warning.publish_time).toLocaleString('zh-CN')}
            </div>
            {/* 灾情指标：凌汛显示冰情，山洪显示降雨 */}
            {warning.derivation?.iceModel && warning.derivation.ice ? (
              <div className="mt-2 flex items-center gap-3 bg-white/20 rounded-btn px-3 py-1.5 text-xs">
                <span className="flex items-center gap-1">
                  <Waves className="w-3.5 h-3.5" />
                  流凌密度：{warning.derivation.ice.flowDensity}%
                </span>
                <span>冰厚：{warning.derivation.ice.iceThickness}m</span>
                <span>水位超警：{warning.derivation.ice.waterRise}m</span>
              </div>
            ) : warning.derivation?.rainfall && !warning.derivation.iceModel ? (
              <div className="mt-2 flex items-center gap-3 bg-white/20 rounded-btn px-3 py-1.5 text-xs">
                <span className="flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5" />
                  当前雨强：{warning.derivation.rainfall.intensity}mm/h
                </span>
                <span>累计：{warning.derivation.rainfall.cumulative}mm</span>
                <span>预报：{warning.derivation.rainfall.forecast}mm</span>
              </div>
            ) : null}
            <button
              onClick={() => navigate('/villager/warning')}
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold bg-white/25 px-3 py-1 rounded-btn active:scale-95 transition-transform"
            >
              查看详情 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-safe/15 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5 text-safe" />
          </div>
          <div>
            <div className="text-sm font-bold text-ink">当前安全</div>
            <div className="text-xs text-ink-sub">您的村组暂无活跃预警</div>
          </div>
        </div>
      )}

      {/* 最新通知区域 */}
      <div>
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Bell className="w-4 h-4 text-warn-orange" />
          <span className="text-sm font-bold text-ink">最新通知</span>
        </div>
        <div className="card overflow-hidden divide-y divide-border">
          {NOTICES.map((n) => (
            <button
              key={n.id}
              onClick={() => setNoticeDetail({ title: n.title, detail: n.detail })}
              className="w-full flex items-center gap-3 px-3 py-3 text-left active:bg-bg transition-colors"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${n.iconBg} ${n.iconColor}`}>
                {n.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-ink truncate">{n.title}</div>
                <div className="text-xs text-ink-sub mt-0.5 truncate">{n.desc}</div>
              </div>
              <ChevronRight size={16} className="text-ink-sub shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* 四个快捷操作按钮 */}
      <div className="space-y-2">
        <ActionButton
          bg="#27AE60"
          icon={<MapPin className="w-5 h-5" />}
          label="安置点登记"
          onClick={() => navigate('/villager/register')}
        />
        <ActionButton
          bg="#2E7DFF"
          icon={<Ambulance className="w-5 h-5" />}
          label="伤情/物资上报"
          onClick={() => navigate('/villager/report')}
        />
        <ActionButton
          bg="#F57C00"
          icon={<LifeBuoy className="w-5 h-5" />}
          label="救援进度追踪"
          onClick={() => navigate('/villager/rescue')}
        />
        <ActionButton
          bg="#005288"
          icon={<Phone className="w-5 h-5" />}
          label="应急电话"
          onClick={() => navigate('/villager/calls')}
        />
      </div>

      {/* 第二行功能网格（8宫格扩展） */}
      <div className="grid grid-cols-4 gap-2">
        <GridItem
          icon={<Navigation className="w-5 h-5" />}
          label="转移路线"
          color="text-accent"
          bgColor="bg-accent/10"
          onClick={() => navigate('/villager/warning')}
        />
        <GridItem
          icon={<BookOpen className="w-5 h-5" />}
          label="避险知识"
          color="text-primary"
          bgColor="bg-primary/10"
          onClick={() => navigate('/villager/knowledge')}
        />
        <GridItem
          icon={<Heart className="w-5 h-5" />}
          label="家人报平安"
          color="text-safe"
          bgColor="bg-safe/10"
          onClick={() => navigate('/villager/family')}
        />
        <GridItem
          icon={<PhoneCall className="w-5 h-5" />}
          label="一键SOS"
          color="text-warn-red"
          bgColor="bg-warn-red/10"
          onClick={() => navigate('/villager/sos')}
        />
      </div>

      {/* 防汛避险须知 */}
      <div className="card p-3">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-warn-orange" />
          <span className="text-sm font-bold text-ink">防汛避险须知</span>
        </div>
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <Waves className="w-4 h-4 text-warn-blue flex-shrink-0 mt-0.5" />
            <div className="text-xs text-ink-sub leading-relaxed">
              <span className="font-bold text-ink">山洪避险：</span>
              向沟道两侧高地撤离，严禁顺着河道方向奔跑。若被洪水围困，可利用门板、泡沫、床板等漂浮物资自救，并及时对外求救。
            </div>
          </div>
          <div className="flex gap-2">
            <Mountain className="w-4 h-4 text-warn-orange flex-shrink-0 mt-0.5" />
            <div className="text-xs text-ink-sub leading-relaxed">
              <span className="font-bold text-ink">山体滑坡：</span>
              向滑坡滑移方向的左右两侧高地撤离，绝对禁止顺着滑坡方向逃跑。无法撤离时抱紧固定大树、躲避在坚固障碍物后方。
            </div>
          </div>
        </div>
      </div>

      {/* 通知详情弹窗 */}
      {noticeDetail && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setNoticeDetail(null)}
        >
          <div className="absolute inset-0 bg-black/40 animate-fade-in" />
          <div
            className="relative w-full max-w-[480px] bg-white rounded-t-card animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 h-12 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-warn-orange" />
                <span className="text-sm font-bold text-ink">{noticeDetail.title}</span>
              </div>
              <button
                onClick={() => setNoticeDetail(null)}
                className="text-xs bg-bg px-3 py-1 rounded-btn text-ink-sub active:scale-95 transition-transform"
              >
                关闭
              </button>
            </div>
            <div className="p-4">
              <div className="bg-bg rounded-btn p-3 text-sm text-ink leading-relaxed">
                {noticeDetail.detail}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  bg,
  icon,
  label,
  onClick,
}: {
  bg: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full h-14 rounded-btn flex items-center gap-3 px-4 text-white font-bold text-base active:scale-[0.98] transition-transform"
      style={{ backgroundColor: bg }}
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight className="w-4 h-4 opacity-80" />
    </button>
  );
}

function GridItem({
  icon,
  label,
  color,
  bgColor,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  color: string;
  bgColor: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="card p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgColor}`}>
        {icon}
      </div>
      <span className="text-[11px] text-ink leading-tight text-center">{label}</span>
    </button>
  );
}
