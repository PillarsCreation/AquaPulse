/**
 * 智能情报中心（政府/研究院风格）
 * 多源数据融合 + 智能研判 + 边缘部署
 */
import { useEffect, useState, useCallback } from 'react';
import {
  Radar, CloudRain, Newspaper, MapPin, Radio, MessageSquare,
  ShieldCheck, AlertCircle, Zap, Server, Smartphone,
  Loader2, CheckCircle2, ArrowUpCircle, Activity, RefreshCw, Package,
  Building2, Gauge, TrendingUp,
} from 'lucide-react';
import {
  intelligenceApi,
  type SentimentOverview,
  type EdgeNode,
  type DeployTask,
} from '@/lib/api';
import { Loading } from '@/components/ui';
import { cn, timeAgo } from '@/lib/utils';

const URGENCY_STYLE = {
  high: { border: 'border-l-warn-red', bg: 'bg-warn-red/5', text: 'text-warn-red', label: '紧急', num: 'Ⅰ' },
  medium: { border: 'border-l-warn-orange', bg: 'bg-warn-orange/5', text: 'text-warn-orange', label: '关注', num: 'Ⅱ' },
  low: { border: 'border-l-safe', bg: 'bg-safe/5', text: 'text-safe', label: '常规', num: 'Ⅲ' },
} as const;

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  weather: <CloudRain size={16} />,
  authoritative: <Newspaper size={16} />,
  geo: <MapPin size={16} />,
  iot: <Radio size={16} />,
  social: <MessageSquare size={16} />,
};

const NODE_TYPE_ICONS: Record<string, React.ReactNode> = {
  rescue_device: <Smartphone size={16} />,
  edge_server: <Server size={16} />,
  village_kiosk: <MapPin size={16} />,
};

const NODE_STATUS_STYLE = {
  online: { dot: 'bg-safe', text: 'text-safe', label: '在线' },
  offline: { dot: 'bg-warn-red', text: 'text-warn-red', label: '离线' },
  syncing: { dot: 'bg-warn-yellow animate-pulse', text: 'text-warn-yellow', label: '同步中' },
} as const;

export default function AdminIntelligence() {
  const [sentiment, setSentiment] = useState<SentimentOverview | null>(null);
  const [nodes, setNodes] = useState<EdgeNode[]>([]);
  const [deploys, setDeploys] = useState<DeployTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'sentiment' | 'edge'>('sentiment');
  const [deploying, setDeploying] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [s, n, d] = await Promise.all([
        intelligenceApi.sentiment('青龙山村').catch(() => null),
        intelligenceApi.edgeNodes().catch(() => []),
        intelligenceApi.deployHistory().catch(() => []),
      ]);
      setSentiment(s);
      setNodes(n);
      setDeploys(d);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      await intelligenceApi.deploy('预警参数更新', { note: '八步水文模型v2.3' });
      await loadData();
    } finally {
      setDeploying(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-full">
      {/* 顶部标题栏（政府公文风格） */}
      <div className="bg-gradient-to-r from-primary-dark via-primary to-primary-light text-white">
        <div className="px-8 py-5 relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 size={22} />
                <h1 className="text-xl font-bold tracking-wide">智能情报研判中心</h1>
              </div>
              <p className="text-sm text-white/70">
                多源异构数据融合 · 智能决策 · 边缘协同部署
              </p>
            </div>
            <div className="text-right text-xs text-white/60 space-y-0.5">
              <div>数据引擎：多源融合 · 推理模型：水文模型</div>
              <div>部署引擎：边缘协同 · 边缘节点：{nodes.length}</div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="absolute top-5 right-8 h-8 px-3 rounded bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 transition-colors"
          >
            {refreshing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            刷新数据
          </button>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Tab 切换（研究院风格） */}
        <div className="flex gap-1 mb-5 border-b border-border">
          <TabButton active={tab === 'sentiment'} onClick={() => setTab('sentiment')} icon={<Radar size={16} />}>
            多源数据研判报告
          </TabButton>
          <TabButton active={tab === 'edge'} onClick={() => setTab('edge')} icon={<Server size={16} />}>
            边缘部署与协同
          </TabButton>
        </div>

        {/* ===== Tab: 多源舆情研判 ===== */}
        {tab === 'sentiment' && sentiment && (
          <div className="space-y-5">
            {/* 核心指标面板（政务统计风格） */}
            <div className="grid grid-cols-4 gap-3">
              <GovStatCard icon={<MessageSquare size={20} />} value={sentiment.totalMentions} label="全网信息采集量" sub="条" color="#005288" />
              <GovStatCard icon={<AlertCircle size={20} />} value={sentiment.rescueRequests} label="求救信号识别" sub="条" color="#E62020" />
              <GovStatCard icon={<ShieldCheck size={20} />} value={sentiment.officialNotices} label="权威通报收录" sub="份" color="#27AE60" />
              <GovStatCard icon={<AlertCircle size={20} />} value={sentiment.rumorAlerts} label="谣言预警标记" sub="条" color="#F57C00" />
            </div>

            {/* Monid 数据源接入矩阵（研究院技术展示风格） */}
            <div className="bg-white rounded-card border border-border overflow-hidden">
              <div className="px-4 py-2.5 bg-bg border-b border-border flex items-center gap-2">
                <Activity size={16} className="text-primary" />
                <span className="text-sm font-bold text-ink">多源异构数据接入矩阵</span>
                <span className="ml-auto text-xs text-ink-sub">五维感知体系</span>
              </div>
              <div className="grid grid-cols-5 divide-x divide-border">
                {[
                  { icon: 'weather', label: '气象水文', src: '气象局·水利部', desc: '雷达回波·水位遥测', color: 'text-primary' },
                  { icon: 'authoritative', label: '权威政务', src: '应急管理局', desc: '通报·泄洪通知', color: 'text-safe' },
                  { icon: 'geo', label: '地理交通', src: 'OSM·高德', desc: 'DEM高程·路况', color: 'text-warn-orange' },
                  { icon: 'iot', label: '物联网感知', src: '传感器网络', desc: '水位计·雨量筒', color: 'text-warn-yellow' },
                  { icon: 'social', label: '社交舆情', src: '微博·小红书', desc: '求救·舆情趋势', color: 'text-warn-red' },
                ].map((s) => (
                  <div key={s.icon} className="p-3 text-center">
                    <div className={cn('flex justify-center mb-1.5', s.color)}>{SOURCE_ICONS[s.icon]}</div>
                    <div className="text-sm font-bold text-ink">{s.label}</div>
                    <div className="text-[11px] text-ink-sub mt-0.5">{s.src}</div>
                    <div className="text-[10px] text-ink-sub/70 mt-0.5">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* GLM-5.1 研判报告 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={18} className="text-warn-yellow" />
                <span className="text-base font-bold text-ink">GLM-5.1 智能研判报告</span>
                <span className="text-xs text-ink-sub">
                  大模型交叉验证 · 更新于 {sentiment.lastUpdate ? timeAgo(sentiment.lastUpdate) : '—'}
                </span>
              </div>
              <div className="space-y-2">
                {sentiment.briefings.map((b) => {
                  const style = URGENCY_STYLE[b.urgency as keyof typeof URGENCY_STYLE] || URGENCY_STYLE.low;
                  return (
                    <div key={b.id} className={cn('bg-white rounded-card border-l-4 border border-border overflow-hidden', style.border, style.bg)}>
                      <div className="p-3.5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn('w-6 h-6 rounded flex items-center justify-center text-xs font-bold', style.bg, style.text)}>
                              {style.num}
                            </span>
                            <span className="text-primary">{SOURCE_ICONS[b.category]}</span>
                            <span className="text-sm font-bold text-ink">{b.categoryLabel}</span>
                            <span className={cn('tag', style.bg, style.text)}>{style.label}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {b.crossVerified ? (
                              <span className="flex items-center gap-0.5 text-safe font-bold">
                                <ShieldCheck size={13} /> 多源交叉验证
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 text-warn-orange">
                                <AlertCircle size={13} /> 待核实
                              </span>
                            )}
                            <span className="text-ink-sub">|</span>
                            <span className="flex items-center gap-0.5 text-ink-sub">
                              <Gauge size={13} /> 置信度 {b.confidence}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-ink leading-relaxed pl-8">{b.summary}</p>
                        <div className="mt-2 pl-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-sub">
                          <span className="flex items-center gap-0.5"><MapPin size={12} /> {b.location}</span>
                          {b.suppliesNeeded && b.suppliesNeeded.length > 0 && (
                            <span className="flex items-center gap-0.5 text-warn-red font-bold">
                              <Package size={12} /> 物资需求：{b.suppliesNeeded.join('、')}
                            </span>
                          )}
                          <span>来源：{b.sources.join('、')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 关键词热度（研究院数据可视化风格） */}
            {sentiment.topKeywords.length > 0 && (
              <div className="bg-white rounded-card border border-border p-4">
                <div className="text-sm font-bold text-ink mb-3 flex items-center gap-1">
                  <TrendingUp size={16} className="text-primary" /> 舆情关键词频次分析
                </div>
                <div className="space-y-2">
                  {sentiment.topKeywords.map((kw, i) => {
                    const maxCount = sentiment.topKeywords[0].count;
                    const pct = Math.round((kw.count / maxCount) * 100);
                    return (
                      <div key={kw.word} className="flex items-center gap-3">
                        <span className="text-xs text-ink-sub w-6 text-right">{i + 1}</span>
                        <span className="text-sm font-bold text-ink w-16">{kw.word}</span>
                        <div className="flex-1 h-5 bg-bg rounded overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded flex items-center justify-end px-1.5',
                              i === 0 ? 'bg-warn-red' : i < 3 ? 'bg-warn-orange' : 'bg-primary'
                            )}
                            style={{ width: `${Math.max(pct, 15)}%` }}
                          >
                            <span className="text-[10px] text-white font-bold">{kw.count}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== Tab: 边缘部署 ===== */}
        {tab === 'edge' && (
          <div className="space-y-5">
            {/* 部署触发 */}
            <div className="bg-white rounded-card border border-border p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-ink flex items-center gap-1.5">
                  <Zap size={16} className="text-warn-yellow" /> 边缘模型分发
                </div>
                <div className="text-xs text-ink-sub mt-1">
                  将八步水文模型打包为边缘 Agent，推送至救援终端，支持断网续传与热更新
                </div>
              </div>
              <button
                onClick={handleDeploy}
                disabled={deploying}
                className="h-10 px-5 rounded-btn bg-primary text-white text-sm font-bold flex items-center gap-1.5 hover:bg-primary-light transition-colors disabled:opacity-60"
              >
                {deploying ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpCircle size={16} />}
                {deploying ? '构建推送中…' : '触发模型部署'}
              </button>
            </div>

            {/* 节点总览（指挥大屏风格） */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '在线节点', value: nodes.filter(n => n.status === 'online').length, total: nodes.length, color: 'text-safe' },
                { label: '同步中', value: nodes.filter(n => n.status === 'syncing').length, total: nodes.length, color: 'text-warn-yellow' },
                { label: '离线/待同步', value: nodes.filter(n => n.status === 'offline').length, total: nodes.length, color: 'text-warn-red' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-card border border-border p-3 text-center">
                  <div className={cn('text-3xl font-bold', s.color)}>
                    {s.value}<span className="text-base text-ink-sub">/{s.total}</span>
                  </div>
                  <div className="text-xs text-ink-sub mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* 边缘节点详情 */}
            <div>
              <div className="text-base font-bold text-ink mb-2 flex items-center gap-1.5">
                <Server size={18} className="text-primary" /> 边缘节点运行状态
              </div>
              <div className="grid grid-cols-2 gap-3">
                {nodes.map((n) => {
                  const style = NODE_STATUS_STYLE[n.status as keyof typeof NODE_STATUS_STYLE] || NODE_STATUS_STYLE.online;
                  return (
                    <div key={n.id} className="bg-white rounded-card border border-border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-primary">{NODE_TYPE_ICONS[n.type]}</span>
                          <span className="text-sm font-bold text-ink">{n.name}</span>
                        </div>
                        <span className="flex items-center gap-1 text-xs">
                          <span className={cn('w-2 h-2 rounded-full', style.dot)} />
                          <span className={style.text}>{style.label}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-sub">
                        <div className="flex items-center gap-1"><MapPin size={11} /> {n.location || '—'}</div>
                        <div className="flex items-center gap-1">
                          <span className="tag bg-bg text-ink-sub">{n.modelVersion}</span>
                        </div>
                        {n.batteryLevel != null && (
                          <div className={cn(
                            'flex items-center gap-1 font-bold',
                            n.batteryLevel > 50 ? 'text-safe' : n.batteryLevel > 20 ? 'text-warn-orange' : 'text-warn-red'
                          )}>
                            电量 {n.batteryLevel}%
                          </div>
                        )}
                        {n.pendingSync > 0 && (
                          <div className="text-warn-red font-bold">待同步 {n.pendingSync} 条</div>
                        )}
                        <div className="flex items-center gap-1 col-span-2">
                          <Activity size={11} /> 心跳 {timeAgo(n.lastHeartbeat)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 部署历史时间线 */}
            {deploys.length > 0 && (
              <div>
                <div className="text-base font-bold text-ink mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={18} className="text-safe" /> 模型部署记录
                </div>
                <div className="bg-white rounded-card border border-border divide-y divide-border">
                  {deploys.map((d) => (
                    <div key={d.id} className="p-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'w-2.5 h-2.5 rounded-full',
                          d.status === 'deployed' ? 'bg-safe' :
                          d.status === 'failed' ? 'bg-warn-red' : 'bg-warn-yellow animate-pulse'
                        )} />
                        <span className="font-bold text-ink">{d.version}</span>
                        <span className="text-xs text-ink-sub">{d.trigger}</span>
                      </div>
                      <div className="text-xs text-ink-sub">
                        {d.targetNodes.length} 节点 · {d.status === 'deployed' ? `已完成 ${d.completedAt ? timeAgo(d.completedAt) : ''}` : d.status === 'building' ? '构建中' : '推送中'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** 政务风格统计卡片 */
function GovStatCard({ icon, value, label, sub, color }: {
  icon: React.ReactNode; value: number; label: string; sub: string; color: string;
}) {
  return (
    <div className="bg-white rounded-card border border-border p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color }} />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-ink leading-none">{value}<span className="text-sm text-ink-sub ml-0.5">{sub}</span></div>
          <div className="text-xs text-ink-sub mt-1">{label}</div>
        </div>
      </div>
    </div>
  );
}

/** 研究院风格 Tab 按钮 */
function TabButton({ active, onClick, icon, children }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-11 px-5 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors -mb-px',
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-ink-sub hover:text-ink'
      )}
    >
      {icon}
      {children}
    </button>
  );
}
