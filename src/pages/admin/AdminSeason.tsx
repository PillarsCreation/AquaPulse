/**
 * 四季灾害日历 - 12个月 × 8灾种覆盖矩阵 + 当月防御重点
 * 数据与 api 灾种分支同源（src/data/disasterCalendar.ts）
 */
import { CalendarClock } from 'lucide-react';
import { SEASON_CALENDAR, DTYPE, seasonLabel } from '@/data/disasterCalendar';
import type { DisasterType } from '@/types';

export default function AdminSeason() {
  const month = new Date().getMonth() + 1;
  const cur = SEASON_CALENDAR.find(s => s.m === month) || SEASON_CALENDAR[0];

  return (
    <div className="p-5 space-y-5">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <CalendarClock size={20} className="text-primary" />
            全年水灾害日历
          </h2>
          <span className="tag bg-primary/10 text-primary">当前：{month}月 · {seasonLabel(month)}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {SEASON_CALENDAR.map(s => {
            const isCur = s.m === month;
            return (
              <div
                key={s.m}
                className={`border rounded-btn p-3 ${isCur ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${isCur ? 'text-primary' : 'text-ink'}`}>{s.d}</span>
                  {isCur && <span className="tag bg-primary text-white">当前</span>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {s.active.map(k => (
                    <span
                      key={k}
                      className="tag"
                      style={{ backgroundColor: DTYPE[k as DisasterType].color + '1A', color: DTYPE[k as DisasterType].color }}
                    >
                      {DTYPE[k as DisasterType].label}
                    </span>
                  ))}
                </div>
                <div className="text-[0.64rem] text-ink-sub mt-1.5 leading-snug">{s.note}</div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-border">
          <span className="text-xs text-ink-sub mr-1">图例</span>
          {Object.entries(DTYPE).map(([k, dt]) => (
            <span key={k} className="tag" style={{ backgroundColor: dt.color + '1A', color: dt.color }}>
              {dt.label}
            </span>
          ))}
        </div>
      </div>

      <div className="card p-4 flex items-center gap-2.5">
        <CalendarClock size={18} className="text-warn-orange shrink-0" />
        <div className="text-sm">
          <b className="text-ink">{month}月防御重点：</b>
          <span className="text-ink-sub">{cur.note}</span>
        </div>
      </div>
    </div>
  );
}
