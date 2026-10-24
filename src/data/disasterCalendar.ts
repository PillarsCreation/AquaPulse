/**
 * 全年水灾害共享数据：灾种配置 + 十二月灾害日历
 * 与 api/services/warningModel.ts 的灾种分支保持同步
 */

export type DisasterType =
  | 'flashflood' | 'landslide' | 'urban' | 'typhoon'
  | 'icejam' | 'winterflood' | 'snowmelt' | 'drought';

export interface DisasterTypeConfig {
  label: string;
  season: string;
  color: string;
  desc: string;
}

export const DTYPE: Record<DisasterType, DisasterTypeConfig> = {
  flashflood: { label: '山洪', season: '夏秋季', color: '#E62020', desc: '山区沟谷短时强降水引发的暴涨洪水，来势猛、历时短、破坏力强' },
  landslide: { label: '滑坡', season: '夏秋季', color: '#F57C00', desc: '暴雨渗透诱发山体滑移，常与山洪灾害链伴生' },
  urban: { label: '城市内涝', season: '夏秋季', color: '#7B1FA2', desc: '强降雨超过管网排放能力，低洼街区与下穿隧道积水' },
  typhoon: { label: '台风风暴潮', season: '夏秋季', color: '#1565C0', desc: '台风登陆带来暴雨增水，沿海沿江潮位顶托成灾' },
  icejam: { label: '凌汛', season: '冬春季', color: '#00ACC1', desc: '封冻河流开江时冰凌卡塞形成冰塞/冰坝，壅高水位漫滩成灾——黄河宁蒙段、黑龙江、松花江高发' },
  winterflood: { label: '南方冬汛', season: '冬季', color: '#5E35B1', desc: '冬季持续性强降水引发的江河洪水，湘江、赣江、桂江、贺江等南方河流，强厄尔尼诺年份更明显' },
  snowmelt: { label: '融雪洪水', season: '秋冬春季', color: '#00897B', desc: '气温骤升导致积雪、冰川加速融化汇入河道，新疆、青藏高原等山区河流高发' },
  drought: { label: '冬春干旱', season: '冬春季', color: '#8D6E63', desc: '持续少雨导致农业用水紧张，需提前调度水源' },
};

export interface MonthEntry {
  m: number;
  d: string;
  active: DisasterType[];
  note: string;
}

export const SEASON_CALENDAR: MonthEntry[] = [
  { m: 1,  d: '一月',   active: ['icejam', 'drought', 'winterflood'],  note: '封河期冰塞风险；南方冬汛持续（厄尔尼诺年份）' },
  { m: 2,  d: '二月',   active: ['icejam', 'drought'],                 note: '开江关键期，重点防范弯道冰塞壅水与武开河' },
  { m: 3,  d: '三月',   active: ['icejam', 'drought', 'snowmelt'],     note: '北方河流陆续开江，全年第一个凌汛高发月；高原融雪开始' },
  { m: 4,  d: '四月',   active: ['icejam', 'drought', 'flashflood', 'snowmelt'], note: '华南前汛期开始，桃花汛叠加融雪径流' },
  { m: 5,  d: '五月',   active: ['flashflood', 'landslide', 'urban'],  note: '华南暴雨增多，局地山洪滑坡初发' },
  { m: 6,  d: '六月',   active: ['flashflood', 'landslide', 'urban', 'typhoon'], note: '江淮梅雨，主汛期正式拉开' },
  { m: 7,  d: '七月',   active: ['flashflood', 'landslide', 'urban', 'typhoon'], note: '全国主汛期高峰，山洪滑坡伤亡最集中' },
  { m: 8,  d: '八月',   active: ['flashflood', 'landslide', 'urban', 'typhoon'], note: '台风密集登陆，暴雨洪水叠加风暴潮' },
  { m: 9,  d: '九月',   active: ['flashflood', 'landslide', 'urban', 'typhoon'], note: '秋台风与华西秋汛叠加' },
  { m: 10, d: '十月',   active: ['flashflood', 'drought', 'snowmelt'], note: '华西秋汛尾声，北方江河转入枯水期；秋末融雪初发' },
  { m: 11, d: '十一月', active: ['icejam', 'drought', 'winterflood'],  note: '北方河流流凌封冻，防凌期开始；南方冬汛开启' },
  { m: 12, d: '十二月', active: ['icejam', 'drought', 'winterflood'],  note: '全面封冻期，封冻里程巡查；南方冬汛持续' },
];

/** 当前月份的季节标签 */
export function seasonLabel(month: number): string {
  if (month >= 11 || month <= 3) return '防凌期';
  if (month === 10) return '深秋';
  if (month === 4) return '汛前过渡';
  return '主汛期';
}
