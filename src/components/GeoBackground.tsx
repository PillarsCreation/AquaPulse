/**
 * 地理背景装饰
 * 在管理员端背景渲染山川河流平原的 SVG 图案
 */

export default function GeoBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04]"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1200 800"
      >
        {/* 山脉群（左侧高山区） */}
        <g fill="#005288">
          <path d="M0,500 L80,300 L160,420 L240,220 L320,380 L400,260 L480,400 L480,800 L0,800 Z" />
          <path d="M480,400 L560,280 L640,360 L640,800 L480,800 Z" opacity="0.6" />
        </g>
        {/* 山脉群（右侧） */}
        <g fill="#005288" opacity="0.5">
          <path d="M900,450 L960,320 L1020,400 L1080,280 L1140,380 L1200,300 L1200,800 L900,800 Z" />
        </g>
        {/* 河流（蜿蜒青龙溪） */}
        <g fill="none" stroke="#1976D2" strokeWidth="3" opacity="0.8">
          <path d="M120,200 Q250,300 200,400 T350,550 Q450,650 380,750" />
          <path d="M350,550 Q500,600 600,550 T800,650 Q900,700 850,780" />
        </g>
        {/* 河流支流 */}
        <g fill="none" stroke="#1976D2" strokeWidth="1.5" opacity="0.5">
          <path d="M200,400 Q280,450 350,420" />
          <path d="M600,550 Q680,500 750,520" />
        </g>
        {/* 平原等高线 */}
        <g fill="none" stroke="#005288" strokeWidth="1" opacity="0.3">
          <path d="M700,600 Q800,580 900,600 Q1000,620 1100,600" />
          <path d="M700,650 Q800,630 900,650 Q1000,670 1100,650" />
          <path d="M700,700 Q800,680 900,700 Q1000,720 1100,700" />
        </g>
        {/* 村落标记点 */}
        <g fill="#F57C00" opacity="0.6">
          <circle cx="240" cy="350" r="4" />
          <circle cx="500" cy="450" r="4" />
          <circle cx="800" cy="550" r="4" />
          <circle cx="350" cy="600" r="3" />
          <circle cx="650" cy="400" r="3" />
        </g>
      </svg>
    </div>
  );
}
