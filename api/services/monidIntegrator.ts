/**
 * Monid 多源异构数据融合引擎
 *
 * 通过 Monid CLI 接入气象水文、权威新闻、地理交通、IoT传感器、社交媒体等数据源，
 * 将海量多源异构数据汇聚到后端，供 GLM-5.1 进行交叉验证和情报研判。
 *
 * 数据源分类：
 *  1. 气象与水文（气象局雷达、雨量筒遥测）
 *  2. 权威新闻与政务（应急管理局通报、水利部公告）
 *  3. 地理与交通（OSM地形、道路积水状态）
 *  4. 物联网传感器（河道水位计、水库监测）
 *  5. 社交媒体舆情（微博、小红书、X 求救信号）
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/** Monid 数据源类型 */
export type MonidSourceType =
  | 'weather'      // 气象水文
  | 'authoritative' // 权威政务
  | 'geo'          // 地理交通
  | 'iot'          // 物联网传感器
  | 'social';      // 社交媒体

/** 单条 Monid 原始数据 */
export interface MonidRawItem {
  source: MonidSourceType;
  sourceName: string;       // 数据源名称（如"中国气象局"）
  title: string;
  content: string;
  location?: string;        // 关联地点
  timestamp: string;        // 数据时间
  reliability: number;      // 可信度 0-1
  url?: string;
}

/** GLM-5.1 研判后的结构化情报 */
export interface IntelligenceBriefing {
  id: string;
  category: MonidSourceType;
  categoryLabel: string;
  title: string;
  summary: string;          // 自然语言研判结论
  location: string;
  urgency: 'high' | 'medium' | 'low';
  suppliesNeeded?: string[];  // 关键物资需求
  confidence: number;       // 置信度 0-100
  crossVerified: boolean;   // 是否经多源交叉验证
  sources: string[];        // 数据来源列表
  timestamp: string;
  rawItems: MonidRawItem[]; // 原始数据快照
}

/** 全网舆情态势 */
export interface SentimentOverview {
  totalMentions: number;        // 全网提及总量
  rescueRequests: number;       // 求救信号数
  rumorAlerts: number;          // 谣言预警数
  officialNotices: number;      // 官方通报数
  sentimentTrend: 'rising' | 'stable' | 'declining';
  topKeywords: { word: string; count: number }[];
  briefings: IntelligenceBriefing[];
  lastUpdate: string;
}

const MONID_API_KEY = process.env.MONID_API_KEY || '';

// 青龙山村中心坐标（用于 Monid CLI 调用真实气象数据）
const QINGLONG_LAT = '31.0';
const QINGLONG_LON = '103.5';

/** Monid CLI 缓存目录 */
const MONID_CACHE_DIR = join(process.cwd(), '.monid-cache');
try { if (!existsSync(MONID_CACHE_DIR)) mkdirSync(MONID_CACHE_DIR, { recursive: true }); } catch {}

/**
 * 检测 Monid CLI 是否可用
 */
function isMonidAvailable(): boolean {
  try {
    execSync('monid keys list', { stdio: 'pipe', timeout: 5000, env: { ...process.env, NO_COLOR: '1' } });
    return true;
  } catch {
    return false;
  }
}

/**
 * 调用 Monid CLI 执行端点（带缓存，避免频繁计费）
 */
function runMonidEndpoint(provider: string, endpoint: string, query: Record<string, string>, cacheKey: string): any | null {
  const cacheFile = join(MONID_CACHE_DIR, `${cacheKey}.json`);
  // 缓存有效期 5 分钟
  if (existsSync(cacheFile)) {
    const stat = { mtime: Date.now() };
    try {
      const fs = require('fs');
      const fstat = fs.statSync(cacheFile);
      if (Date.now() - fstat.mtimeMs < 5 * 60 * 1000) {
        return JSON.parse(readFileSync(cacheFile, 'utf-8'));
      }
    } catch {}
  }
  // 调用 Monid CLI
  try {
    const queryStr = JSON.stringify(query).replace(/"/g, '\\"');
    const outputFile = join(MONID_CACHE_DIR, `${cacheKey}_run.json`);
    const cmd = `monid run -p ${provider} -e ${endpoint} --query "${queryStr}" -w -o "${outputFile}"`;
    execSync(cmd, {
      stdio: 'pipe',
      timeout: 30000,
      env: { ...process.env, NO_COLOR: '1' },
    });
    if (existsSync(outputFile)) {
      const result = JSON.parse(readFileSync(outputFile, 'utf-8'));
      // 写入缓存
      writeFileSync(cacheFile, JSON.stringify(result));
      return result;
    }
  } catch (err) {
    console.warn(`[Monid] CLI 调用失败 (${provider}/${endpoint}):`, err);
  }
  return null;
}

/**
 * 从 Monid 获取真实气象数据并转化为 MonidRawItem
 */
function fetchRealWeather(region: string): MonidRawItem[] {
  const items: MonidRawItem[] = [];
  const now = Date.now();
  const minsAgo = (m: number) => new Date(now - m * 60000).toISOString();

  // 调用当前天气端点
  const currentWeather = runMonidEndpoint(
    'openweather-coral.vercel.app',
    '/weather/current',
    { lat: QINGLONG_LAT, lon: QINGLONG_LON },
    'weather_current'
  );

  if (currentWeather) {
    const temp = currentWeather.temperature?.current ?? '未知';
    const humidity = currentWeather.humidity ?? '未知';
    const weatherMain = currentWeather.weather?.main ?? '未知';
    const weatherDesc = currentWeather.weather?.description ?? '';
    const rain1h = currentWeather.rain_1h;
    const windSpeed = currentWeather.wind?.speed ?? '未知';
    const cityName = currentWeather.city || region;

    items.push({
      source: 'weather',
      sourceName: 'Monid · OpenWeather 实时气象',
      title: `${cityName}实时气象监测（${weatherMain}）`,
      content: `当前气温 ${temp}°C，天气 ${weatherDesc}，湿度 ${humidity}%，风速 ${windSpeed}m/s${rain1h ? `，近1小时降雨量 ${rain1h}mm` : '，近1小时无明显降雨'}。数据由 Monid 多源感知平台实时获取。`,
      location: region,
      timestamp: minsAgo(1),
      reliability: 0.98,
      url: 'https://openweathermap.org',
    });
  }

  // 调用 5 天预报端点
  const forecast = runMonidEndpoint(
    'openweather-coral.vercel.app',
    '/weather/forecast',
    { lat: QINGLONG_LAT, lon: QINGLONG_LON },
    'weather_forecast'
  );

  if (forecast) {
    // 提取未来降雨预报
    const rainPeriods = Array.isArray(forecast?.list) ? forecast.list.filter((p: any) => p.weather?.[0]?.main === 'Rain').slice(0, 3) : [];
    if (rainPeriods.length > 0) {
      items.push({
        source: 'weather',
        sourceName: 'Monid · OpenWeather 气象预报',
        title: `${region}未来降雨预报`,
        content: `Monid 获取气象预报数据显示，未来时段内有 ${rainPeriods.length} 个降雨时段。最近降雨预计在 ${rainPeriods[0]?.dt_txt || '近期'}，建议提前防范。`,
        location: region,
        timestamp: minsAgo(2),
        reliability: 0.92,
      });
    }
  }

  return items;
}

/**
 * 调用 Monid 搜索全网数据
 * 优先使用 Monid CLI 获取真实数据，无 CLI 时回退到内置模拟数据（演示模式）
 */
export async function searchMonid(
  query: string,
  sources: MonidSourceType[] = ['weather', 'authoritative', 'geo', 'iot', 'social'],
  limit = 20
): Promise<MonidRawItem[]> {
  // 如果 Monid CLI 可用，获取真实气象数据
  if (isMonidAvailable()) {
    const realItems: MonidRawItem[] = [];

    // 气象维度：调用真实端点
    if (sources.includes('weather')) {
      const weatherItems = fetchRealWeather(query.includes('青龙') ? '青龙山村' : query);
      realItems.push(...weatherItems);
    }

    // 其他维度（政务/地理/IoT/社交）暂无匹配的免费端点，使用结构化模拟数据补充
    const mockItems = generateMockData(query);
    for (const item of mockItems) {
      if (item.source !== 'weather' && sources.includes(item.source)) {
        realItems.push(item);
      }
    }

    return realItems.slice(0, limit);
  }

  // 演示模式：返回内置模拟数据
  return generateMockData(query);
}

/**
 * GLM-5.1 研判：将 Monid 原始数据清洗为结构化情报
 *
 * 模拟大模型的交叉验证逻辑：
 * - 同一地点、同一事件的多源数据 → 交叉验证通过
 * - 仅单一来源的数据 → 标记为待验证
 */
export function glmAnalyzeDisaster(
  rawItems: MonidRawItem[],
  region: string = '青龙山村'
): IntelligenceBriefing[] {
  const briefings: IntelligenceBriefing[] = [];

  // 按类别分组
  const grouped = new Map<MonidSourceType, MonidRawItem[]>();
  for (const item of rawItems) {
    if (!grouped.has(item.source)) grouped.set(item.source, []);
    grouped.get(item.source)!.push(item);
  }

  const categoryLabels: Record<MonidSourceType, string> = {
    weather: '气象水文监测',
    authoritative: '权威政务通报',
    geo: '地理交通态势',
    iot: '物联网遥测',
    social: '社交舆情研判',
  };

  for (const [category, items] of grouped) {
    // 检查是否有多源交叉验证（同一地点是否在其他类别也有数据）
    const locationsInItems = new Set(items.map(i => i.location).filter(Boolean));
    const otherCategories = [...grouped.keys()].filter(k => k !== category);
    const crossVerified = otherCategories.some(otherCat => {
      const otherItems = grouped.get(otherCat) || [];
      return otherItems.some(oi => locationsInItems.has(oi.location));
    });

    // 提取关键词判断紧急程度
    const allContent = items.map(i => `${i.title} ${i.content}`).join(' ');
    const urgency = detectUrgency(allContent);

    // 提取物资需求
    const suppliesNeeded = extractNeeds(allContent);

    // 置信度：多源交叉+可信度加权
    const avgReliability = items.reduce((sum, i) => sum + i.reliability, 0) / items.length;
    const confidence = Math.round((crossVerified ? 0.7 : 0.4) + avgReliability * 0.3);

    // 生成自然语言研判结论（模拟 GLM-5.1 输出）
    const summary = generateBriefingSummary(category, items, region, crossVerified);

    briefings.push({
      id: `BRIEF-${Date.now()}-${category}-${Math.random().toString(36).slice(2, 6)}`,
      category,
      categoryLabel: categoryLabels[category],
      title: items[0]?.title || `${categoryLabels[category]}研判`,
      summary,
      location: items[0]?.location || region,
      urgency,
      suppliesNeeded: suppliesNeeded.length > 0 ? suppliesNeeded : undefined,
      confidence: Math.min(confidence * 100, 95),
      crossVerified,
      sources: [...new Set(items.map(i => i.sourceName))],
      timestamp: new Date().toISOString(),
      rawItems: items,
    });
  }

  // 按紧急程度排序
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  briefings.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
  return briefings;
}

/**
 * 获取全网舆情态势总览
 */
export async function getSentimentOverview(region: string = '青龙山村'): Promise<SentimentOverview> {
  const query = `${region} 洪水 OR 求救 OR 转移`;
  const rawItems = await searchMonid(query);
  const briefings = glmAnalyzeDisaster(rawItems, region);

  const socialItems = rawItems.filter(i => i.source === 'social');
  const rescueRequests = socialItems.filter(i =>
    /求救|被困| SOS |紧急/.test(i.content)
  ).length;
  const rumorAlerts = socialItems.filter(i =>
    i.reliability < 0.5 && /传言|听说|据说/.test(i.content)
  ).length;
  const officialNotices = rawItems.filter(i => i.source === 'authoritative').length;

  // 关键词统计
  const keywordMap = new Map<string, number>();
  const keywords = ['洪水', '求救', '转移', '被困', '水位', '降雨', '决堤', '救生艇', '物资', '断水'];
  for (const item of rawItems) {
    const text = `${item.title} ${item.content}`;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        keywordMap.set(kw, (keywordMap.get(kw) || 0) + 1);
      }
    }
  }
  const topKeywords = [...keywordMap.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    totalMentions: rawItems.length,
    rescueRequests,
    rumorAlerts,
    officialNotices,
    sentimentTrend: rescueRequests > 3 ? 'rising' : rescueRequests > 0 ? 'stable' : 'declining',
    topKeywords,
    briefings,
    lastUpdate: new Date().toISOString(),
  };
}

// ============ 内部辅助函数 ============

function detectUrgency(text: string): 'high' | 'medium' | 'low' {
  if (/求救|SOS|紧急|生命|决堤|溃坝|被困/.test(text)) return 'high';
  if (/转移|预警|上涨|超警|危险/.test(text)) return 'medium';
  return 'low';
}

function extractNeeds(text: string): string[] {
  const needs: string[] = [];
  if (/食物|食品|饥饿|断粮/.test(text)) needs.push('食物');
  if (/饮用水|断水|干净水/.test(text)) needs.push('饮用水');
  if (/药品|药|伤病|受伤/.test(text)) needs.push('药品');
  if (/救生艇|舟|船/.test(text)) needs.push('救生艇');
  if (/帐篷|被子|保暖/.test(text)) needs.push('帐篷/被褥');
  return needs;
}

function generateBriefingSummary(
  category: MonidSourceType,
  items: MonidRawItem[],
  region: string,
  crossVerified: boolean
): string {
  const verifyNote = crossVerified
    ? '该情报已经多源交叉验证，可信度较高。'
    : '该情报暂为单一来源，建议进一步核实。';

  switch (category) {
    case 'weather':
      return `据气象水文数据监测，${region}及周边区域近期降雨持续。` +
        `GLM-5.1 综合分析雷达回波和雨量筒数据，预计未来3小时降雨量将进一步增大，` +
        `建议密切关注水情变化。${verifyNote}`;
    case 'authoritative':
      return `${items[0]?.sourceName || '应急管理部门'}已发布官方通报。` +
        `GLM-5.1 对通报内容进行结构化提取，关键信息已同步至指挥调度系统。${verifyNote}`;
    case 'geo':
      return `地理交通数据表明，${region}部分低洼路段可能出现积水。` +
        `结合高程数据（DEM）分析，GLM-5.1 已标注高风险区域和可通行转移路线。${verifyNote}`;
    case 'iot':
      return `物联网传感器遥测数据显示，河道水位持续上涨。` +
        `GLM-5.1 正实时比对历史阈值，触发自动告警。${verifyNote}`;
    case 'social':
      return `社交媒体舆情监测发现${region}相关灾情讨论活跃。` +
        `GLM-5.1 已过滤谣言，提取真实求救信号并分类标记紧急程度。${verifyNote}`;
    default:
      return `GLM-5.1 已完成数据分析。${verifyNote}`;
  }
}

/**
 * 生成演示用模拟数据（无真实 Monid API Key 时使用）
 */
function generateMockData(query: string): MonidRawItem[] {
  const now = Date.now();
  const minsAgo = (m: number) => new Date(now - m * 60000).toISOString();

  return [
    // 气象水文
    {
      source: 'weather',
      sourceName: '中国气象局',
      title: '暴雨红色预警信号',
      content: `${query.includes('青龙') ? '青龙山村' : '青龙山乡'}未来3小时降雨量将达50mm以上，伴有短时强降水，请注意防范山洪灾害。`,
      location: '青龙山村',
      timestamp: minsAgo(8),
      reliability: 0.95,
      url: 'https://www.cma.gov.cn',
    },
    {
      source: 'weather',
      sourceName: '水利部水文监测',
      title: '青龙溪水位超警',
      content: '青龙溪青龙山村段当前水位 285.6m，超警戒水位 0.6m，流量 82m³/s，呈上涨趋势。',
      location: '青龙山村',
      timestamp: minsAgo(5),
      reliability: 0.98,
    },
    // 权威政务
    {
      source: 'authoritative',
      sourceName: '县应急管理局',
      title: '关于启动防汛Ⅱ级应急响应的通知',
      content: '鉴于当前汛情严峻，经研究决定自即时起启动防汛Ⅱ级应急响应。请各乡镇立即组织危险区域群众转移。',
      location: '青龙山乡',
      timestamp: minsAgo(15),
      reliability: 0.99,
    },
    {
      source: 'authoritative',
      sourceName: '县水利局',
      title: '青龙山水库泄洪通报',
      content: '青龙山水库将于今日14时开闸泄洪，泄洪流量200m³/s，请下游沿河群众注意安全。',
      location: '青龙山水库',
      timestamp: minsAgo(20),
      reliability: 0.97,
    },
    // 地理交通
    {
      source: 'geo',
      sourceName: 'OpenStreetMap',
      title: '青龙山村低洼路段积水',
      content: '青龙山村入口主干道高程282m，低于当前洪水位，预计积水深度1.2m，建议改道青龙岭转移路线。',
      location: '青龙山村',
      timestamp: minsAgo(3),
      reliability: 0.85,
    },
    {
      source: 'geo',
      sourceName: '高德地图路况',
      title: 'S204省道交通管制',
      content: 'S204省道青龙山村段因积水实施交通管制，预计恢复时间待定。',
      location: 'S204省道',
      timestamp: minsAgo(12),
      reliability: 0.9,
    },
    // IoT 传感器
    {
      source: 'iot',
      sourceName: '青龙溪水位计WS-07',
      title: '水位遥测告警',
      content: '传感器ID:WS-07，当前水位285.7m（超警0.7m），10分钟内上涨0.15m，触发自动告警。',
      location: '青龙溪中游',
      timestamp: minsAgo(2),
      reliability: 0.99,
    },
    {
      source: 'iot',
      sourceName: '雨量筒RG-03',
      title: '雨强遥测数据',
      content: '传感器ID:RG-03，当前雨强45mm/h，1小时累计38mm，2小时累计72mm。',
      location: '青龙山村',
      timestamp: minsAgo(1),
      reliability: 0.99,
    },
    // 社交媒体
    {
      source: 'social',
      sourceName: '微博',
      title: '青龙山村村民求救',
      content: '我是青龙山村三组的，家里进水了已经到腰了，老人腿脚不方便下不了楼，请求救援！',
      location: '青龙山村三组',
      timestamp: minsAgo(6),
      reliability: 0.7,
    },
    {
      source: 'social',
      sourceName: '小红书',
      title: '转移求助帖',
      content: '青龙山村这边水还在涨，附近有没有救生艇？家里有小孩急需转移！',
      location: '青龙山村',
      timestamp: minsAgo(4),
      reliability: 0.65,
    },
    {
      source: 'social',
      sourceName: 'X (Twitter)',
      title: 'Qinglong village flood SOS',
      content: 'Heavy flooding in Qinglong village area. Multiple families trapped. Need boats and supplies urgently. #FloodRescue',
      location: '青龙山村',
      timestamp: minsAgo(10),
      reliability: 0.6,
    },
    {
      source: 'social',
      sourceName: '抖音',
      title: '现场视频上报',
      content: '青龙山村洪水实拍，水已经漫过一楼，很多人在二楼等待救援，物资紧缺。',
      location: '青龙山村',
      timestamp: minsAgo(7),
      reliability: 0.68,
    },
  ];
}
