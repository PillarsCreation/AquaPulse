/**
 * 村民端 - 避险知识页
 * 山洪避险口诀 + 5个避险要点 + 视频教程
 */
import { useState } from 'react';
import {
  BookOpen, ChevronRight, AlertTriangle, Waves, Mountain,
  LifeBuoy, Flashlight, ShieldAlert, PlayCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TipDetail {
  title: string;
  desc: string;
  detail: string;
}

const TIPS: { icon: React.ReactNode; bg: string; label: string; tip: TipDetail }[] = [
  {
    icon: <AlertTriangle className="w-4 h-4 text-warn-red" />,
    bg: 'bg-warn-red/10',
    label: '1',
    tip: {
      title: '收到预警立即转移',
      desc: '不要犹豫，时间就是生命',
      detail: '收到预警后，应立即停止户外活动，不要在河道、沟谷、低洼地带停留，迅速向高处转移。',
    },
  },
  {
    icon: <Waves className="w-4 h-4 text-warn-orange" />,
    bg: 'bg-warn-orange/10',
    label: '2',
    tip: {
      title: '向两侧高处转移',
      desc: '切勿顺河道方向跑',
      detail: '转移时应向两侧高处跑，不要顺着河道方向跑，因为山洪会顺着河道快速下泄。',
    },
  },
  {
    icon: <LifeBuoy className="w-4 h-4 text-accent" />,
    bg: 'bg-accent/10',
    label: '3',
    tip: {
      title: '被困时利用漂浮物',
      desc: '爬上高处等待救援',
      detail: '被洪水包围时，要迅速利用门板、桌椅、大块泡沫等漂浮物自救，并尽快爬上屋顶、大树等高处等待救援。',
    },
  },
  {
    icon: <Flashlight className="w-4 h-4 text-safe" />,
    bg: 'bg-safe/10',
    label: '4',
    tip: {
      title: '发出求救信号',
      desc: 'SOS：三短三长三短',
      detail: '被困时，白天可挥动鲜艳衣物，夜间可用手电筒、手机闪光灯发出求救信号，SOS信号为三短三长三短。',
    },
  },
  {
    icon: <ShieldAlert className="w-4 h-4 text-warn-red" />,
    bg: 'bg-warn-red/10',
    label: '5',
    tip: {
      title: '切勿盲目涉水',
      desc: '30cm水流即可冲倒成人',
      detail: '不要涉水过河！水深仅30cm就能冲倒成人，60cm就能冲走汽车。如必须涉水，用棍子探路，结伴同行。',
    },
  },
];

const VIDEOS = [
  {
    title: '山洪灾害避险指南',
    desc: '5分钟 · 应急管理部制作',
    bg: 'bg-accent/10',
    iconColor: 'text-accent',
  },
  {
    title: '自救互救基本技能',
    desc: '8分钟 · 红十字会制作',
    bg: 'bg-safe/10',
    iconColor: 'text-safe',
  },
];

export default function VillagerKnowledge() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="text-base font-bold text-ink px-1 flex items-center gap-1">
        <BookOpen className="w-4 h-4 text-primary" /> 山洪避险知识
      </div>

      {/* 山洪避险口诀 - 蓝色渐变卡片 */}
      <div
        className="rounded-card p-4 text-white"
        style={{ background: 'linear-gradient(135deg, #1565C0, #0D47A1)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4" />
          <span className="font-bold text-sm">山洪避险口诀</span>
        </div>
        <div className="text-sm leading-loose opacity-95">
          山洪来、快转移；沿两侧、向高处；
          <br />
          莫贪财、保性命；听指挥、不乱跑；
          <br />
          被困时、上高处；发信号、等救援。
        </div>
      </div>

      {/* 避险要点 */}
      <div className="text-sm font-bold text-ink px-1">避险要点</div>
      <div className="card overflow-hidden">
        {TIPS.map((item, idx) => {
          const isExpanded = expandedIdx === idx;
          return (
            <button
              key={idx}
              onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              className={cn(
                'w-full flex items-center gap-3 p-3 text-left active:bg-bg transition-colors',
                idx < TIPS.length - 1 && 'border-b border-border'
              )}
            >
              <div className={cn('w-9 h-9 rounded-btn flex items-center justify-center flex-shrink-0', item.bg)}>
                <span className="text-sm font-bold text-ink">{item.label}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-ink">{item.tip.title}</div>
                <div className="text-xs text-ink-sub">{item.tip.desc}</div>
                {isExpanded && (
                  <div className="text-xs text-ink-sub mt-2 leading-relaxed bg-bg rounded-btn p-2.5 animate-fade-in">
                    {item.tip.detail}
                  </div>
                )}
              </div>
              <ChevronRight
                className={cn(
                  'w-4 h-4 text-ink-sub flex-shrink-0 transition-transform',
                  isExpanded && 'rotate-90'
                )}
              />
            </button>
          );
        })}
      </div>

      {/* 视频教程 */}
      <div className="text-sm font-bold text-ink px-1">视频教程</div>
      <div className="card overflow-hidden">
        {VIDEOS.map((video, idx) => (
          <button
            key={idx}
            className={cn(
              'w-full flex items-center gap-3 p-3 text-left active:bg-bg transition-colors',
              idx < VIDEOS.length - 1 && 'border-b border-border'
            )}
          >
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', video.bg)}>
              <PlayCircle className={cn('w-5 h-5', video.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-ink">{video.title}</div>
              <div className="text-xs text-ink-sub">{video.desc}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-sub flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
