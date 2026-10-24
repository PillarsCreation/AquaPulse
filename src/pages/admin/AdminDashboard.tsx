/**
 * 指挥调度大屏 - 四区布局：左侧实时监控 + 中部GIS地图(含顶部预警横幅) + 右侧智能分析
 */
import { useEffect, useState } from 'react';
import {
  Users, ShieldCheck, Clock, HeartPulse, Activity, CheckCircle2,
  Package, AlertTriangle, MapPin, RefreshCw, CloudRain, Waves,
  Brain, GitBranch, Check, Radio, Wifi, WifiOff, Eye, FileText,
  TrendingUp, Zap, BarChart3,
} from 'lucide-react';
import GisMap from '@/components/GisMap';
import { StatCard, Loading, EmptyState, WarningBadge } from '@/components/ui';
import { dashboardApi, geoApi, warningApi, personnelApi } from '@/lib/api';
import type {
  DashboardStats, Village, Warning, Personnel, WarningLevel,
} from '@/types';
import { timeAgo } from '@/lib/utils';

// 通讯状态数据
interface CommStatus {
  village: string;
  signal: 'strong' | 'medium' | 'weak' | 'none';
  lastContact: string;
}

const COMM_DATA: CommStatus[] = [
  { village: '云岭村1组', signal: 'strong', lastContact: '2分钟前' },
  { village: '云岭村2组', signal: 'strong', lastContact: '3分钟前' },
  { village: '云岭村3组', signal: 'medium', lastContact: '8分钟前' },
  { village: '云岭村5组', signal: 'none', lastContact: '47分钟前' },
  { village: '桂花村1组', signal: 'strong', lastContact: '1分钟前' },
  { village: '桂花村3组', signal: 'weak', lastContact: '25分钟前' },
];

const SIGNAL_STRENGTH: Record<string, { label: string; color: string; bars: number }> = {
  strong: { label: '信号强', color: '#27AE60', bars: 4 },
  medium: { label: '信号中', color: '#FBC000', bars: 2 },
  weak: { label: '信号弱', color: '#F57C00', bars: 1 },
  none: { label: '无信号', color: '#E62020', bars: 0 },
};

// 积水点数据
interface WaterLog {
  id: string;
  name: string;
  location: string;
  depth: number;
  area: number;
  riskLevel: 'high' | 'medium' | 'low';
  status: 'accumulating' | 'stable' | 'receding';
  trend: string;
  lastUpdate: string;
}

const WATERLOG_DATA: WaterLog[] = [
  { id: '1', name: '云岭村3组桥下涵洞', location: '云岭村3组 K1+200处', depth: 65, area: 320, riskLevel: 'high', status: 'accumulating', trend: '持续上涨 +5cm/h', lastUpdate: '2分钟前' },
  { id: '2', name: '桂花村主干道交叉口', location: '桂花村3组 十字路口', depth: 45, area: 180, riskLevel: 'high', status: 'accumulating', trend: '持续上涨 +3cm/h', lastUpdate: '5分钟前' },
  { id: '3', name: '石桥沟村河漫滩段', location: '石桥沟村落 河道拐弯处', depth: 38, area: 450, riskLevel: 'medium', status: 'stable', trend: '趋于稳定 持平', lastUpdate: '8分钟前' },
  { id: '4', name: '青龙山乡政府门口', location: '青龙山村落 乡政府前', depth: 22, area: 120, riskLevel: 'medium', status: 'receding', trend: '正在消退 -2cm/h', lastUpdate: '12分钟前' },
  { id: '5', name: '溪源村溪河漫水桥', location: '溪源村落 漫水桥段', depth: 18, area: 90, riskLevel: 'low', status: 'receding', trend: '正在消退 -4cm/h', lastUpdate: '15分钟前' },
  { id: '6', name: '观音岩村山脚洼地', location: '观音岩村落 村口', depth: 52, area: 260, riskLevel: 'high', status: 'stable', trend: '趋于稳定 微涨', lastUpdate: '3分钟前' },
];

// 决策建议数据
const DECISION_SUGGESTIONS = [
  { id: '1', text: '立即启动云岭村3组群众转移预案，优先转移河道下游200m范围内居民', priority: 'high' },
  { id: '2', text: '调派第二救援梯队前往桂花村3组，该村通讯中断需核实灾情', priority: 'high' },
  { id: '3', text: '在云岭村主干道K1+200处设置警戒线，安排专人值守防止车辆进入', priority: 'medium' },
  { id: '4', text: '向云岭镇中心小学安置点增派医疗物资和饮用水', priority: 'medium' },
  { id: '5', text: '通知桂花村1组村干部启动备用通讯设备（卫星电话）', priority: 'low' },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [villages, setVillages] = useState<Village[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [adoptedSuggestions, setAdoptedSuggestions] = useState<Set<string>>(new Set());

  // 当前最高预警等级
  const topWarning = warnings.length > 0
    ? warnings.reduce((a, b) => {
        const order: Record<WarningLevel, number> = { red: 0, orange: 1, yellow: 2, blue: 3 };
        return (order[a.level as WarningLevel] ?? 3) < (order[b.level as WarningLevel] ?? 3) ? a : b;
      })
    : null;

  async function loadAll(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const [s, v, w, p] = await Promise.all([
        dashboardApi.stats(),
        geoApi.villages(),
        warningApi.list({ status: 'active' }).catch(() => [] as Warning[]),
        personnelApi.list().catch(() => [] as Personnel[]),
      ]);
      setStats(s);
      setVillages(v);
      setWarnings(w);
      setPersonnel(p);
    } catch (err: any) {
      setError(err?.message || '数据加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAll();
    // 每 30s 自动刷新一次
    const timer = setInterval(() => loadAll(true), 30000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <div className="h-full"><Loading text="正在加载大屏数据..." /></div>;
  }

  // 物资需求 Top 列表
  const materialEntries = stats
    ? Object.entries(stats.materialNeeds).sort((a, b) => b[1] - a[1]).slice(0, 5)
    : [];
  const maxMaterial = materialEntries.length ? materialEntries[0][1] : 1;

  const adoptSuggestion = (id: string) => {
    setAdoptedSuggestions(prev => new Set(prev).add(id));
  };

  return (
    <div className="h-full flex flex-col">
      {/* 顶部预警横幅区域 */}
      <WarningBanner warning={topWarning} stats={stats} />

      {/* 主体区域: 左 + 中 + 右 */}
      <div className="flex-1 flex min-h-0">
        {/* 左侧实时监控栏 */}
        <aside className="w-[260px] shrink-0 border-r border-border bg-bg overflow-y-auto p-3 space-y-3">
          {/* 雨情监控 */}
          <div className="card p-3">
            <div className="text-xs font-bold text-ink-sub mb-2 flex items-center gap-1.5">
              <CloudRain size={14} className="text-[#1976D2]" /> 雨情监控
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-sub">小时雨强</span>
                <span className="text-sm font-bold" style={{ color: '#1976D2' }}>35 mm/h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-sub">累计雨量</span>
                <span className="text-sm font-bold" style={{ color: '#1976D2' }}>128 mm</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-sub">24h预报</span>
                <span className="text-sm font-bold" style={{ color: '#F57C00' }}>80 mm</span>
              </div>
              <div className="mt-1 p-2 rounded-btn bg-[#1976D2]/5 text-xs text-ink-sub leading-relaxed">
                <TrendingUp size={12} className="inline mr-1 text-[#1976D2]" />
                雨强趋势：近1小时雨强由25mm/h上升至35mm/h，预计未来2小时维持强降雨
              </div>
            </div>
          </div>

          {/* 水情监控 */}
          <div className="card p-3">
            <div className="text-xs font-bold text-ink-sub mb-2 flex items-center gap-1.5">
              <Waves size={14} className="text-accent" /> 水情监控
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-sub">关键河道水位</span>
                <span className="text-sm font-bold text-accent">4.8 m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-sub">警戒水位</span>
                <span className="text-sm font-bold text-warn-orange">5.0 m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-sub">当前状态</span>
                <span className="tag bg-warn-orange/10 text-warn-orange text-[10px] font-bold">接近警戒</span>
              </div>
              <div className="mt-1">
                <div className="flex items-center gap-1 text-xs text-ink-sub mb-1">
                  <span>水位距警戒线</span>
                  <span className="font-medium text-warn-orange">0.2m</span>
                </div>
                <div className="h-2 rounded-full bg-bg overflow-hidden relative">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: '96%' }}
                  />
                  <div
                    className="absolute top-0 h-full w-0.5 bg-warn-red"
                    style={{ left: '100%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 通讯状态 */}
          <div className="card p-3">
            <div className="text-xs font-bold text-ink-sub mb-2 flex items-center gap-1.5">
              <Radio size={14} className="text-primary" /> 通讯状态
            </div>
            <div className="space-y-2">
              {COMM_DATA.map(comm => {
                const sig = SIGNAL_STRENGTH[comm.signal];
                const isOffline = comm.signal === 'none';
                return (
                  <div
                    key={comm.village}
                    className={`flex items-center gap-2 p-2 rounded-btn text-xs ${
                      isOffline ? 'bg-warn-red/5 border border-warn-red/20' : 'bg-bg'
                    }`}
                  >
                    {isOffline ? (
                      <WifiOff size={14} className="text-warn-red shrink-0" />
                    ) : (
                      <Wifi size={14} className="shrink-0" style={{ color: sig.color }} />
                    )}
                    <span className={`flex-1 truncate ${isOffline ? 'text-warn-red font-medium' : 'text-ink'}`}>
                      {comm.village}
                    </span>
                    <span className={`shrink-0 ${isOffline ? 'text-warn-red' : 'text-ink-sub'}`}>
                      {comm.lastContact}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 高频积水点汇总 */}
          <div className="card p-3">
            <div className="text-xs font-bold text-ink-sub mb-2 flex items-center gap-1.5">
              <Waves size={14} className="text-warn-orange" /> 高频积水点 ({WATERLOG_DATA.length})
            </div>
            <div className="space-y-1.5">
              {WATERLOG_DATA.map(log => {
                const riskConfig = {
                  high: { label: '高风险', color: '#E62020', bg: 'bg-warn-red/10' },
                  medium: { label: '中风险', color: '#F57C00', bg: 'bg-warn-orange/10' },
                  low: { label: '低风险', color: '#1976D2', bg: 'bg-warn-blue/10' },
                };
                const statusConfig = {
                  accumulating: { label: '积水中', color: '#E62020', icon: '↑' },
                  stable: { label: '稳定', color: '#FBC000', icon: '→' },
                  receding: { label: '消退中', color: '#27AE60', icon: '↓' },
                };
                const risk = riskConfig[log.riskLevel];
                const status = statusConfig[log.status];
                const depthColor = log.depth > 40 ? '#E62020' : log.depth >= 20 ? '#F57C00' : '#1976D2';

                return (
                  <div key={log.id} className="border border-border rounded-btn p-2 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-ink truncate flex-1">{log.name}</span>
                      <span className={`tag ${risk.bg} font-bold`} style={{ color: risk.color, fontSize: '9px' }}>
                        {risk.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-ink-sub text-[11px]">
                      <span className="flex items-center gap-0.5">
                        <Waves size={10} /> <span style={{ color: depthColor, fontWeight: 700 }}>{log.depth}cm</span>
                      </span>
                      <span>·</span>
                      <span>{log.area}m²</span>
                      <span>·</span>
                      <span style={{ color: status.color }}>{status.icon} {status.label}</span>
                    </div>
                    <div className="text-[10px] text-ink-sub mt-1 opacity-70">{log.trend} · {log.lastUpdate}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* 中部 GIS 地图 */}
        <div className="flex-1 min-w-0 relative">
          <GisMap
            villages={villages}
            warnings={warnings}
            personnel={personnel}
            shelters={stats?.shelters || []}
            showFitBounds
            className="h-full w-full"
          />
          {/* 地图左上角标题 */}
          <div className="absolute top-3 left-3 card px-3 py-2 z-[1000] shadow-card">
            <div className="flex items-center gap-2 text-sm font-bold text-ink">
              <MapPin size={16} className="text-primary" />
              指挥调度 GIS 大屏
            </div>
            <div className="text-[11px] text-ink-sub mt-0.5">
              村组 {villages.length} · 预警 {warnings.length} · 人员 {personnel.length}
            </div>
          </div>
          {/* 右上角刷新 */}
          <button
            onClick={() => loadAll(true)}
            className="absolute top-3 right-3 card px-3 py-2 z-[1000] shadow-card text-sm text-ink-sub hover:text-primary flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            刷新
          </button>
          {error && (
            <div className="absolute bottom-3 left-3 z-[1000] bg-warn-red text-white text-xs px-3 py-2 rounded-btn shadow-card">
              {error}
            </div>
          )}
        </div>

        {/* 右侧智能分析栏 */}
        <aside className="w-[320px] shrink-0 border-l border-border bg-bg overflow-y-auto p-3 space-y-3">
          {/* 人员统计 */}
          <div>
            <div className="text-xs font-bold text-ink-sub mb-2 flex items-center gap-1.5">
              <Users size={14} /> 人员统计
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatCard title="总人数" value={stats?.personnel.total ?? 0} color="#005288" icon={<Users size={22} />} />
              <StatCard title="已安全" value={stats?.personnel.safe ?? 0} color="#27AE60" icon={<ShieldCheck size={22} />} />
              <StatCard title="待避险" value={stats?.personnel.pending ?? 0} color="#E62020" icon={<Clock size={22} />} />
              <StatCard title="受伤人数" value={(stats?.personnel.severe_injury ?? 0) + (stats?.personnel.minor_injury ?? 0)} color="#F57C00" icon={<HeartPulse size={22} />} />
            </div>
          </div>

          {/* 救援任务统计 */}
          <div>
            <div className="text-xs font-bold text-ink-sub mb-2 flex items-center gap-1.5">
              <Activity size={14} /> 救援任务统计
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatCard title="进行中" value={stats?.rescue.in_progress ?? 0} color="#F57C00" icon={<Activity size={22} />} />
              <StatCard title="已完成" value={stats?.rescue.completed ?? 0} color="#27AE60" icon={<CheckCircle2 size={22} />} />
            </div>
          </div>

          {/* 情报融合报告 */}
          <div className="rounded-card p-3 text-xs text-white leading-relaxed" style={{
            background: 'linear-gradient(135deg, #005288, #1976D2)',
          }}>
            <div className="flex items-center gap-1.5 font-bold text-sm mb-2">
              <Brain size={14} /> 情报融合报告
            </div>
            <p className="opacity-90">
              综合气象、水文、地质多源数据分析，当前云岭镇区域暴雨强度已达红色预警标准。云岭村3组河道水位距警戒线仅0.2m，预计30分钟内可能超警。桂花村3组通讯已中断47分钟，无法确认当地灾情，建议立即派人核实。上游雨势持续增强，径流汇流时间约1.5小时，需警惕山洪暴发风险。
            </p>
          </div>

          {/* 风险评估结果 */}
          <div className="card p-3">
            <div className="text-xs font-bold text-ink-sub mb-2 flex items-center gap-1.5">
              <BarChart3 size={14} /> 风险评估结果
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-sub">综合风险等级</span>
                <span className="tag bg-warn-red text-white font-bold">高风险</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-sub">受威胁人口</span>
                <span className="font-bold text-warn-red">约 1,280 人</span>
              </div>
              <div className="text-xs text-ink-sub leading-relaxed">
                <Zap size={11} className="inline mr-1 text-warn-red" />
                <span className="font-medium text-ink">重点区域：</span>
                云岭村3组(河道下游)、桂花村3组(通讯中断)、云岭村5组(地质灾害点)
              </div>
            </div>
          </div>

          {/* 决策建议 */}
          <div className="card p-3">
            <div className="text-xs font-bold text-ink-sub mb-2 flex items-center gap-1.5">
              <GitBranch size={14} /> 决策建议
            </div>
            <div className="space-y-2">
              {DECISION_SUGGESTIONS.map(s => {
                const adopted = adoptedSuggestions.has(s.id);
                const priorityColor = s.priority === 'high' ? '#E62020' : s.priority === 'medium' ? '#F57C00' : '#1976D2';
                return (
                  <div
                    key={s.id}
                    className={`p-2 rounded-btn border text-xs leading-relaxed transition-colors ${
                      adopted
                        ? 'border-safe/30 bg-safe/5'
                        : 'border-border bg-bg'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: priorityColor }} />
                      <span className={`flex-1 ${adopted ? 'text-ink-sub line-through' : 'text-ink'}`}>
                        {s.text}
                      </span>
                    </div>
                    {!adopted && (
                      <button
                        onClick={() => adoptSuggestion(s.id)}
                        className="mt-1.5 ml-3.5 h-6 px-2 rounded-btn bg-primary/10 text-primary text-[10px] font-medium flex items-center gap-1 hover:bg-primary/20 active:scale-[0.98] transition-transform"
                      >
                        <Check size={10} /> 采纳
                      </button>
                    )}
                    {adopted && (
                      <span className="mt-1.5 ml-3.5 text-[10px] text-safe font-medium flex items-center gap-1">
                        <CheckCircle2 size={10} /> 已采纳
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 物资需求 */}
          <div className="card p-3">
            <div className="text-xs font-bold text-ink-sub mb-2 flex items-center gap-1.5">
              <Package size={14} /> 物资需求 TOP
            </div>
            {materialEntries.length === 0 ? (
              <EmptyState text="暂无物资需求" />
            ) : (
              <div className="space-y-2">
                {materialEntries.map(([name, count]) => (
                  <div key={name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-ink">{name}</span>
                      <span className="text-ink-sub font-medium">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(count / maxMaterial) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 活跃预警列表 */}
          <div className="card p-3">
            <div className="text-xs font-bold text-ink-sub mb-2 flex items-center gap-1.5">
              <AlertTriangle size={14} /> 活跃预警 ({warnings.length})
            </div>
            {warnings.length === 0 ? (
              <EmptyState text="当前无活跃预警" icon={<AlertTriangle size={28} />} />
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto">
                {warnings.map(w => (
                  <div key={w.id} className="border border-border rounded-btn p-2 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <WarningBadge level={w.level as WarningLevel} size="sm" />
                      <span className="text-ink-sub text-[10px]">
                        {w.village_name || '-'} · {timeAgo(w.publish_time)}
                      </span>
                    </div>
                    <div className="font-medium text-ink truncate">{w.title}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * 顶部预警横幅组件
 * 全宽横幅，背景色随预警等级变化，红色预警时闪烁
 */
function WarningBanner({
  warning,
  stats,
}: {
  warning: Warning | null;
  stats: DashboardStats | null;
}) {
  const level = warning?.level as WarningLevel | undefined;
  const levelConfig: Record<string, { bg: string; label: string; textColor: string }> = {
    red: { bg: 'bg-warn-red', label: '红色预警', textColor: 'text-white' },
    orange: { bg: 'bg-warn-orange', label: '橙色预警', textColor: 'text-white' },
    yellow: { bg: 'bg-warn-yellow', label: '黄色预警', textColor: 'text-[#1D2129]' },
    blue: { bg: 'bg-warn-blue', label: '蓝色预警', textColor: 'text-white' },
  };

  if (!level || !warning) {
    // 无预警时的默认横幅
    return (
      <div className="bg-primary text-white px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Eye size={16} />
          <span className="text-sm font-bold">AquaPulse 指挥调度大屏</span>
        </div>
        <div className="flex items-center gap-4 text-xs opacity-90">
          <span>当前无活跃预警</span>
          <span className="flex items-center gap-1">
            <FileText size={12} /> 实时监测中
          </span>
        </div>
      </div>
    );
  }

  const cfg = levelConfig[level] || levelConfig.blue;
  const isRed = level === 'red';

  return (
    <div
      className={`${cfg.bg} ${cfg.textColor} px-6 py-3 flex items-center justify-between shrink-0 ${
        isRed ? 'animate-warn-flash' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        {/* 预警等级标签 */}
        <span className={`px-2 py-0.5 rounded-btn text-xs font-bold ${
          isRed ? 'bg-white/20' : 'bg-black/10'
        }`}>
          {cfg.label}
        </span>

        {/* 预警区域 */}
        <span className="text-sm font-medium">
          {warning.village_name || '全域'}区域暴雨洪涝预警
        </span>

        {/* 分隔 */}
        <span className="w-px h-4 bg-current opacity-30" />

        {/* 雨情概要 */}
        <div className="flex items-center gap-3 text-xs opacity-90">
          <span className="flex items-center gap-1">
            <CloudRain size={12} /> 雨强 35mm/h
          </span>
          <span className="flex items-center gap-1">
            <Waves size={12} /> 累计 128mm
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp size={12} /> 预报 80mm
          </span>
        </div>
      </div>

      {/* 右侧信息 */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <Users size={12} /> 受影响人口{' '}
          <span className="font-bold">{stats?.personnel.pending ?? '-'}</span>
        </span>
        <span className={`px-2 py-0.5 rounded-btn font-medium ${
          isRed ? 'bg-white/20' : 'bg-black/10'
        }`}>
          {isRed ? '紧急响应中' : '监测中'}
        </span>
      </div>
    </div>
  );
}
