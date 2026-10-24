/**
 * 村民端 - 预警详情页
 * 展示完整预警信息、避险指引、最近安置点、转移路线
 */
import { useEffect, useState } from 'react';
import {
  AlertTriangle, MapPin, Clock, Waves, Mountain, Building2, Navigation, CloudRain, ChevronRight, Users, Snowflake,
} from 'lucide-react';
import { warningApi, geoApi } from '@/lib/api';
import { WARNING_CONFIG } from '@/types';
import type { Warning, WarningLevel, Shelter } from '@/types';
import { useAuthStore } from '@/store/auth';
import { Loading, EmptyState, WarningBadge } from '@/components/ui';
import { timeAgo } from '@/lib/utils';

const LEVEL_ORDER: Record<WarningLevel, number> = { red: 4, orange: 3, yellow: 2, blue: 1 };

export default function VillagerWarning() {
  const { user } = useAuthStore();
  const villageId = user?.villageId;
  const villageName = user?.village?.name;
  const [warning, setWarning] = useState<Warning | null>(null);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!villageId) {
      setLoading(false);
      return;
    }
    Promise.all([
      warningApi.list({ villageId, status: 'active' }),
      geoApi.shelters(villageId),
    ])
      .then(([list, sList]) => {
        if (cancelled) return;
        if (list && list.length) {
          const sorted = [...list].sort((a, b) => LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level]);
          setWarning(sorted[0]);
        }
        setShelters(sList || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [villageId]);

  if (loading) return <Loading text="加载预警信息..." />;

  if (!warning) {
    return (
      <EmptyState
        icon={<AlertTriangle className="w-10 h-10" />}
        text="当前无活跃预警，请保持关注"
      />
    );
  }

  const cfg = WARNING_CONFIG[warning.level];
  const nearest = shelters[0];
  const transferTask = warning.derivation?.transferTask;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* 预警头部 */}
      <div className="card overflow-hidden">
        <div
          className="p-3"
          style={{ backgroundColor: cfg.color, color: warning.level === 'yellow' ? '#1D2129' : '#fff' }}
        >
          <div className="flex items-center justify-between">
            <WarningBadge level={warning.level} />
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-xs opacity-90 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {timeAgo(warning.publish_time)}
              </span>
              <span className="text-[10px] opacity-75">
                {new Date(warning.publish_time).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
          <div className="text-lg font-bold mt-2 leading-snug">{warning.title}</div>
          <div className="text-xs opacity-90 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {warning.village_name || villageName}
            {warning.township ? ` · ${warning.township}` : ''}
          </div>
          {/* 灾情指标：凌汛显示冰情，山洪显示降雨 */}
          {warning.derivation?.iceModel && warning.derivation.ice ? (
            <div className="mt-2 flex items-center gap-3 bg-white/20 rounded-btn px-3 py-1.5 text-xs">
              <Waves className="w-3.5 h-3.5" />
              <span>流凌密度 {warning.derivation.ice.flowDensity}%</span>
              <span>冰厚 {warning.derivation.ice.iceThickness}m</span>
              <span>水位超警 {warning.derivation.ice.waterRise}m</span>
            </div>
          ) : warning.derivation?.rainfall && !warning.derivation.iceModel ? (
            <div className="mt-2 flex items-center gap-3 bg-white/20 rounded-btn px-3 py-1.5 text-xs">
              <CloudRain className="w-3.5 h-3.5" />
              <span>雨强 {warning.derivation.rainfall.intensity}mm/h</span>
              <span>累计 {warning.derivation.rainfall.cumulative}mm</span>
              <span>预报 {warning.derivation.rainfall.forecast}mm</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* 预警内容（村民版） */}
      <div className="card p-3">
        <div className="text-sm font-bold text-ink mb-2 flex items-center gap-1">
          <AlertTriangle className="w-4 h-4 text-warn-red" /> 预警内容
        </div>
        <div className="text-sm text-ink-sub leading-relaxed bg-bg rounded-btn p-3">
          {warning.public_text}
        </div>
      </div>

      {/* 避险指引 */}
      <div className="card p-3 space-y-3">
        <div className="text-sm font-bold text-ink">避险指引</div>
        <div className="flex gap-2">
          <Waves className="w-4 h-4 text-warn-blue flex-shrink-0 mt-0.5" />
          <div className="text-xs text-ink-sub leading-relaxed">
            <div className="font-bold text-ink mb-1">山洪避险</div>
            向沟道两侧高地撤离，严禁顺着河道方向奔跑。若被洪水围困，可利用门板、泡沫、床板等漂浮物资自救，并及时对外求救。
          </div>
        </div>
        <div className="flex gap-2">
          <Mountain className="w-4 h-4 text-warn-orange flex-shrink-0 mt-0.5" />
          <div className="text-xs text-ink-sub leading-relaxed">
            <div className="font-bold text-ink mb-1">山体滑坡</div>
            向滑坡滑移方向的左右两侧高地撤离，绝对禁止顺着滑坡方向逃跑。无法撤离时抱紧固定大树、躲避在坚固障碍物后方。
          </div>
        </div>
        {warning.derivation?.iceModel && (
          <div className="flex gap-2">
            <Snowflake className="w-4 h-4 text-warn-blue flex-shrink-0 mt-0.5" />
            <div className="text-xs text-ink-sub leading-relaxed">
              <div className="font-bold text-ink mb-1">凌汛避险</div>
              听到开江广播立即撤离至堤防高程以上安置点，严禁在冰面上行走、玩耍或围观，远离弯道卡塞段与历史决口段。
            </div>
          </div>
        )}
      </div>

      {/* 最近安置点 */}
      {nearest && (
        <div className="card p-3">
          <div className="text-sm font-bold text-ink mb-2 flex items-center gap-1">
            <Building2 className="w-4 h-4 text-safe" /> 最近安置点
          </div>
          <div className="text-sm text-ink font-medium">{nearest.name}</div>
          <div className="text-xs text-ink-sub mt-1">
            容量：{nearest.capacity} | 已安置：{nearest.current_count || 0}
          </div>
          <div className="text-xs text-ink-sub mt-1">
            坐标：{nearest.lng.toFixed(4)}, {nearest.lat.toFixed(4)}
          </div>
        </div>
      )}

      {/* 附近安置点 */}
      <div>
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Building2 className="w-4 h-4 text-safe" />
          <span className="text-sm font-bold text-ink">附近安置点</span>
          <span className="ml-auto text-xs text-ink-sub">共3个</span>
        </div>
        <div className="space-y-2">
          {/* 安置点1 - 推荐 */}
          <div className="card p-3 flex items-center gap-3 active:bg-bg transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-safe/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-safe" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-ink truncate">云岭镇中心小学</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-safe/10 text-safe font-bold shrink-0">推荐</span>
              </div>
              <div className="text-xs text-ink-sub mt-0.5">距您2.1km · 步行约25分钟</div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-ink-sub">
                <span className="flex items-center gap-0.5"><Users size={10} /> 容量300人</span>
                <span>已安置248人</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-ink-sub shrink-0" />
          </div>
          {/* 安置点2 */}
          <div className="card p-3 flex items-center gap-3 active:bg-bg transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-ink truncate">云岭镇体育馆</div>
              <div className="text-xs text-ink-sub mt-0.5">距您3.8km</div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-ink-sub">
                <span className="flex items-center gap-0.5"><Users size={10} /> 容量500人</span>
                <span>已安置312人</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-ink-sub shrink-0" />
          </div>
          {/* 安置点3 */}
          <div className="card p-3 flex items-center gap-3 active:bg-bg transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-warn-orange/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-warn-orange" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-ink truncate">云岭镇政府礼堂</div>
              <div className="text-xs text-ink-sub mt-0.5">距您4.5km</div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-ink-sub">
                <span className="flex items-center gap-0.5"><Users size={10} /> 容量150人</span>
                <span>已安置98人</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-ink-sub shrink-0" />
          </div>
        </div>
      </div>

      {/* 转移路线 */}
      {transferTask && (
        <div className="card p-3">
          <div className="text-sm font-bold text-ink mb-2 flex items-center gap-1">
            <Navigation className="w-4 h-4 text-accent" /> 转移路线
          </div>
          <div className="text-xs text-ink-sub leading-relaxed space-y-1.5">
            <div>安置点：<span className="text-ink font-medium">{transferTask.shelterName}</span></div>
            {transferTask.responsible && (
              <div>负责人员：<span className="text-ink">{transferTask.responsible}</span></div>
            )}
            {transferTask.routes?.length > 0 && (
              <div className="space-y-1 mt-1">
                {transferTask.routes.map((r, i) => (
                  <div key={i} className="flex gap-1.5">
                    <span className="text-accent font-bold flex-shrink-0">{i + 1}.</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
