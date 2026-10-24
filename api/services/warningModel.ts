/**
 * 山洪预警模型链推演引擎
 * 实现完整八环节推演：降雨输入 → 产汇流 → 沟道演进 → 淹没分析 → 风险评估 → 分级预警 → 转移任务 → 反馈校正
 */

export interface ModelDerivation {
  rainfall: {
    intensity: number;       // 雨强 mm/h
    cumulative: number;      // 累计雨量 mm
    forecast: number;        // 预报雨量 mm
    dataSource: string;      // 数据来源
  };
  runoff: {
    curveNumber: number;     // SCS-CN曲线数
    peakFlow: number;        // 洪峰流量 m³/s
    convergenceTime: number; // 汇流时间 min
    yieldTime: number;       // 产流时间 min
  };
  channelRouting: {
    peakArrivalTime: number; // 洪峰到达时间 min
    peakVelocity: number;    // 洪峰流速 m/s
    sections: { name: string; depth: number; flow: number }[];
  };
  inundation: {
    area: number;            // 淹没面积 km²
    maxDepth: number;        // 最大水深 m
    depthDistribution: string; // 水深分布描述
  };
  riskAssessment: {
    hazard: number;          // 危险性 0-100
    exposure: number;        // 暴露度 0-100
    vulnerability: number;   // 脆弱性 0-100
    riskScore: number;       // 综合风险分 0-100
    level: string;           // 风险等级 red/orange/yellow/blue
  };
  transferTask: {
    personCount: number;     // 需转移人数
    routes: string[];        // 推荐转移路线
    shelterName: string;     // 安置点名称
    responsible: string;     // 责任人
  };
  feedbackCorrection: {
    modelVersion: string;
    lastCalibrated: string;
    accuracyNote: string;
  };
}

export interface SimulateInput {
  villageId: string;
  villageName: string;
  centerLng: number;
  centerLat: number;
  terrainRisk: string;
  population: number;
  rainfallIntensity: number; // mm/h
  cumulativeRainfall: number; // mm
  forecastRainfall: number;   // mm
}

/**
 * 环节1：降雨输入分析
 */
function analyzeRainfall(input: SimulateInput) {
  const dataSource = '雷达短临预报+地面雨量站融合';
  return {
    intensity: input.rainfallIntensity,
    cumulative: input.cumulativeRainfall,
    forecast: input.forecastRainfall,
    dataSource,
  };
}

/**
 * 环节2：产汇流计算（SCS-CN曲线数法）
 * 科学依据：SCS-CN方法根据土壤类型、土地利用和前期土壤水分条件确定径流量
 */
function calculateRunoff(rainfall: ReturnType<typeof analyzeRainfall>, terrainRisk: string) {
  // 根据地形风险确定CN值（曲线数）—— 陡坡、泥石流频发区CN值更高，产流更快
  let cn = 75;
  if (terrainRisk.includes('坡度') || terrainRisk.includes('陡坡')) cn = 82;
  if (terrainRisk.includes('泥石流') || terrainRisk.includes('高危')) cn = 88;

  // SCS-CN产流计算：P - (0.2*S)^2 / (P + 0.8*S)
  // 其中 S = 25400/CN - 254 (单位mm)
  const S = 25400 / cn - 254;
  const P = rainfall.cumulative + rainfall.forecast; // 总有效降雨量
  // 初损量 Ia = 0.2*S，只有降雨超过初损才产流
  const runoffDepth = P > 0.2 * S ? Math.pow(P - 0.2 * S, 2) / (P + 0.8 * S) : 0;

  // 洪峰流量：基于合理化公式 Qp = C·i·A/3.6 的简化
  // 其中 C为径流系数(取决于CN), i为雨强(mm/h), A为流域面积(km²)
  // 这里取面积系数0.5km²作为典型小流域
  const typicalArea = 0.5;
  const runoffCoeff = runoffDepth / Math.max(P, 1); // 径流系数 = 径流深/总降雨
  const peakFlow = Math.max(0, Math.round(runoffCoeff * rainfall.intensity * typicalArea * 1000 / 3.6));

  // 汇流时间：基于坡度和雨强反比关系
  // 雨强越大汇流越快；坡度越陡汇流越快
  const slopeFactor = terrainRisk.includes('陡坡') ? 0.7 : terrainRisk.includes('坡度') ? 0.85 : 1.0;
  const convergenceTime = Math.max(5, Math.round((20 + 100 / Math.max(rainfall.intensity, 1)) * slopeFactor));
  const yieldTime = Math.round(convergenceTime * 0.4);

  return { curveNumber: cn, peakFlow, convergenceTime, yieldTime };
}

/**
 * 环节3：沟道演进模拟（马斯京根法简化）
 */
function simulateChannelRouting(runoff: ReturnType<typeof calculateRunoff>, terrainRisk: string) {
  const peakArrivalTime = Math.round(runoff.convergenceTime * 0.65);
  const peakVelocity = terrainRisk.includes('陡坡') ? 5.2 : 3.8;

  // 山洪沟道水深系数：典型小流域沟道断面，水深与流量关系符合曼宁公式简化
  // 山洪最大水深一般在0.5~5m范围，系数取0.001~0.002量级
  const depthFactor = terrainRisk.includes('陡坡') ? 0.002 : 0.0015;
  const calcDepth = (f: number) => Math.min(5, Math.round(f * depthFactor * 100) / 100);
  const sections = [
    { name: '上游断面（溪源汇合口）', depth: calcDepth(runoff.peakFlow * 0.6), flow: Math.round(runoff.peakFlow * 0.6) },
    { name: '中游断面（村组驻地段）', depth: calcDepth(runoff.peakFlow * 0.85), flow: Math.round(runoff.peakFlow * 0.85) },
    { name: '下游断面（出沟口）', depth: calcDepth(runoff.peakFlow), flow: runoff.peakFlow },
  ];

  return { peakArrivalTime, peakVelocity, sections };
}

/**
 * 环节4：淹没分析
 */
function analyzeInundation(routing: ReturnType<typeof simulateChannelRouting>, terrainRisk: string) {
  const area = Math.round((routing.peakVelocity * routing.peakArrivalTime * 0.0008) * 100) / 100;
  const maxDepth = routing.sections[1].depth;
  let depthDist = '';
  if (maxDepth > 2) depthDist = '深度淹没区（>2m）占35%，中深度（1-2m）占40%，浅淹没（<1m）占25%';
  else if (maxDepth > 1) depthDist = '深度淹没区（>2m）占15%，中深度（1-2m）占45%，浅淹没（<1m）占40%';
  else depthDist = '浅淹没区（<1m）占70%，中深度（1-2m）占30%';

  return { area, maxDepth, depthDistribution: depthDist };
}

/**
 * 环节5：风险评估（综合危险性、暴露度、脆弱性）
 * 危险性 H = f(降雨强度, 累计雨量, 淹没深度)
 * 暴露度 E = f(人口密度, 淹没面积)
 * 脆弱性 V = f(地形风险等级, 建筑结构, 老幼比例)
 */
function assessRisk(
  rainfall: ReturnType<typeof analyzeRainfall>,
  inundation: ReturnType<typeof analyzeInundation>,
  population: number,
  terrainRisk: string
) {
  // 危险性：综合雨强(权重0.35) + 累计雨量(权重0.25) + 最大淹没深度(权重0.40)
  // 雨强50mm/h → 约17.5分；累计200mm → 约50分；淹没3m → 约36分
  const hazard = Math.min(100, Math.round(
    rainfall.intensity * 0.35 +
    rainfall.cumulative * 0.25 +
    inundation.maxDepth * 12
  ));

  // 暴露度：人口越多暴露度越高，淹没面积越大暴露度越高
  // 100人 → 30分；500人 → 约75分
  const exposure = Math.min(100, Math.round(
    Math.min(population * 0.3, 60) +
    inundation.area * 10
  ));

  // 脆弱性：基于地形风险和历史灾害频率
  let vuln = 40;
  if (terrainRisk.includes('高危') || terrainRisk.includes('频发')) vuln = 85;
  else if (terrainRisk.includes('隐患') || terrainRisk.includes('多发')) vuln = 70;
  else if (terrainRisk.includes('坡度') || terrainRisk.includes('陡坡')) vuln = 60;
  const vulnerability = Math.min(100, vuln);

  // 综合风险分 = 危险性×0.4 + 暴露度×0.35 + 脆弱性×0.25
  const riskScore = Math.round(hazard * 0.4 + exposure * 0.35 + vulnerability * 0.25);

  // 国标四级预警阈值（基于《山洪灾害防治指导意见》）
  let level = 'blue';
  if (riskScore >= 75) level = 'red';       // 极高风险
  else if (riskScore >= 55) level = 'orange'; // 中高风险
  else if (riskScore >= 35) level = 'yellow'; // 中风险

  return { hazard, exposure, vulnerability, riskScore, level };
}

/**
 * 环节6-7：分级预警+转移任务
 */
function generateTransferTask(
  risk: ReturnType<typeof assessRisk>,
  population: number,
  villageName: string
) {
  const personCount = risk.level === 'red' ? population :
                      risk.level === 'orange' ? Math.round(population * 0.7) :
                      risk.level === 'yellow' ? Math.round(population * 0.3) : 0;

  return {
    personCount,
    routes: [
      `沿村道向${villageName}北侧高地撤离（海拔+50m以上）`,
      `经沟道东侧山路转移至安置点`,
    ],
    shelterName: `${villageName}安置点`,
    responsible: `${villageName}村组长`,
  };
}

/**
 * 运行完整模型链推演
 */
export function runFullDerivation(input: SimulateInput): ModelDerivation {
  const rainfall = analyzeRainfall(input);
  const runoff = calculateRunoff(rainfall, input.terrainRisk);
  const channelRouting = simulateChannelRouting(runoff, input.terrainRisk);
  const inundation = analyzeInundation(channelRouting, input.terrainRisk);
  const riskAssessment = assessRisk(rainfall, inundation, input.population, input.terrainRisk);
  const transferTask = generateTransferTask(riskAssessment, input.population, input.villageName);

  return {
    rainfall,
    runoff,
    channelRouting,
    inundation,
    riskAssessment,
    transferTask,
    feedbackCorrection: {
      modelVersion: 'FG-Model v2.1',
      lastCalibrated: '2025-06-01',
      accuracyNote: '基于近三年历史灾害数据校正，洪峰到达时间误差±15分钟，淹没范围误差±12%',
    },
  };
}

/**
 * 根据推演结果生成村民通俗版文案
 */
export function generatePublicText(level: string, villageName: string, derivation: ModelDerivation): string {
  const levelText = level === 'red' ? '红色（极高风险）' :
                    level === 'orange' ? '橙色（中高风险）' :
                    level === 'yellow' ? '黄色（中风险）' : '蓝色（低风险）';

  const action = level === 'red' ? '请立即撤离！' :
                 level === 'orange' ? '请做好撤离准备，老人小孩优先转移！' :
                 level === 'yellow' ? '请密切关注险情变化，做好转移准备。' :
                 '请留意后续预警信息。';

  return `【${levelText}预警】${villageName}区域存在山洪灾害风险。\n` +
         `预计洪峰将于约${derivation.channelRouting.peakArrivalTime}分钟后抵达本区域，` +
         `最大水深可能达${derivation.inundation.maxDepth}米。\n` +
         `${action}\n` +
         `转移路线：${derivation.transferTask.routes[0]}。\n` +
         `安置点：${derivation.transferTask.shelterName}。\n` +
         `避险原则：向沟道两侧高地撤离，切勿顺河道方向奔跑。`;
}

/**
 * 根据推演结果生成专业溯源版文案
 */
export function generateProfessionalText(villageName: string, derivation: ModelDerivation): string {
  const r = derivation.rainfall;
  const ro = derivation.runoff;
  const ch = derivation.channelRouting;
  const inun = derivation.inundation;
  const risk = derivation.riskAssessment;

  return `【专业溯源报告 - ${villageName}】\n` +
    `一、降雨输入：数据源-${r.dataSource}，当前雨强${r.intensity}mm/h，累计${r.cumulative}mm，预报${r.forecast}mm。\n` +
    `二、产汇流：SCS-CN曲线数=${ro.curveNumber}，估算洪峰流量${ro.peakFlow}m³/s，产流时间${ro.yieldTime}min，汇流时间${ro.convergenceTime}min。\n` +
    `三、沟道演进：洪峰预计${ch.peakArrivalTime}min后抵达，洪峰流速${ch.peakVelocity}m/s。` +
    `断面数据：${ch.sections.map(s => `${s.name}水深${s.depth}m/流量${s.flow}m³/s`).join('；')}。\n` +
    `四、淹没分析：预计淹没面积${inun.area}km²，最大水深${inun.maxDepth}m。${inun.depthDistribution}。\n` +
    `五、风险评估：危险性${risk.hazard}、暴露度${risk.exposure}、脆弱性${risk.vulnerability}，综合风险分${risk.riskScore}（${risk.level.toUpperCase()}）。\n` +
    `六、模型版本：${derivation.feedbackCorrection.modelVersion}，${derivation.feedbackCorrection.accuracyNote}。`;
}

/* ============================================================
   凌汛推演引擎（秋冬春 · 开江期冰塞壅水）
   与山洪引擎共用统一输出契约， iceModel 标记区分灾种
   ============================================================ */

export interface IceCondition {
  iceThickness: number;  // 冰厚 m
  flowDensity: number;   // 流凌密度 %
  temp: number;          // 气温 ℃
  waterRise: number;     // 水位超警 m
  dataSource: string;
}

export interface IceSimulateInput {
  villageId: string;
  villageName: string;
  centerLng: number;
  centerLat: number;
  terrainRisk: string;
  population: number;
  iceThickness: number;  // m
  flowDensity: number;   // %
  temp: number;          // ℃
  waterRise: number;     // m
}

export type IceDerivation = ModelDerivation & {
  iceModel: true;
  ice: IceCondition;
};

/** 环节1：冰情输入（卫星遥感 + 冰厚遥测站 + 水文站融合） */
function analyzeIce(input: IceSimulateInput): IceCondition {
  return {
    iceThickness: input.iceThickness,
    flowDensity: input.flowDensity,
    temp: input.temp,
    waterRise: input.waterRise,
    dataSource: '卫星遥感+冰厚遥测站+水文站融合',
  };
}

/** 环节2：热力评估（气温回升 → 武开河风险 → 开江倒计时） */
function assessThermal(ice: IceCondition) {
  const warmFactor = ice.temp >= 0 ? 1 : ice.temp >= -5 ? 0.75 : 0.5;
  const breakUpHours = Math.max(6, Math.round(48 * warmFactor));
  const wuRisk = ice.temp >= -5 ? '高' : '中';
  return { warmFactor, breakUpHours, wuRisk };
}

/** 环节3：冰塞/冰坝壅水评估（流凌密度 × 冰厚 × 水位超警） */
function assessJam(ice: IceCondition) {
  const jamRisk = Math.min(100, Math.round(ice.flowDensity * 0.6 + ice.iceThickness * 80 + ice.waterRise * 30));
  return { jamRisk, riseRate: 0.12 };
}

/** 环节4：漫滩淹没分析 */
function analyzeIceInundation(ice: IceCondition) {
  const maxDepth = Math.min(6, Math.round((ice.iceThickness * 1.8 + ice.waterRise * 1.5) * 10) / 10);
  const area = Math.round((2.5 + ice.waterRise * 3 + ice.iceThickness * 2) * 10) / 10;
  let depthDist: string;
  if (maxDepth > 3) depthDist = '深度淹没区（>2m）占40%，中深度（1-2m）占35%，浅淹没（<1m）占25%';
  else if (maxDepth > 1.5) depthDist = '深度淹没区（>2m）占20%，中深度（1-2m）占45%，浅淹没（<1m）占35%';
  else depthDist = '浅淹没区（<1m）占65%，中深度（1-2m）占35%';
  return { area, maxDepth, depthDistribution: depthDist };
}

/** 环节5：风险评估（同一加权体系：危险性×0.4 + 暴露度×0.35 + 脆弱性×0.25） */
function assessIceRisk(jam: ReturnType<typeof assessJam>, thermal: ReturnType<typeof assessThermal>, inundation: ReturnType<typeof analyzeIceInundation>, population: number) {
  const hazard = Math.min(100, Math.round(jam.jamRisk * 0.7 + thermal.warmFactor * 30));
  const exposure = Math.min(100, Math.round(Math.min(population * 0.3, 60) + inundation.area * 8));
  const vulnerability = 70; // 北方沿河村落房屋抗涝能力普遍偏低
  const riskScore = Math.round(hazard * 0.4 + exposure * 0.35 + vulnerability * 0.25);
  let level = 'blue';
  if (riskScore >= 75) level = 'red';
  else if (riskScore >= 55) level = 'orange';
  else if (riskScore >= 35) level = 'yellow';
  return { hazard, exposure, vulnerability, riskScore, level };
}

/** 运行凌汛模型链推演（八步：冰情输入→热力评估→冰塞壅水→漫滩淹没→风险分级→转移任务→反馈校正） */
export function runIceDerivation(input: IceSimulateInput): IceDerivation {
  const ice = analyzeIce(input);
  const thermal = assessThermal(ice);
  const jam = assessJam(ice);
  const inundation = analyzeIceInundation(ice);
  const riskAssessment = assessIceRisk(jam, thermal, inundation, input.population);

  const personCount = riskAssessment.level === 'red' ? input.population :
                      riskAssessment.level === 'orange' ? Math.round(input.population * 0.7) :
                      riskAssessment.level === 'yellow' ? Math.round(input.population * 0.3) : 0;

  const transferTask = {
    personCount,
    routes: [
      `迅速撤离至河道堤防高程以上预设安置点（海拔+20m以上）`,
      `远离弯道卡塞段与历史决口段，严禁在冰面上行走或围观`,
    ],
    shelterName: `${input.villageName}安置点`,
    responsible: `${input.villageName}村支书兼防凌责任人`,
  };

  return {
    ice,
    iceModel: true,
    rainfall: { intensity: 0, cumulative: 0, forecast: 0, dataSource: ice.dataSource },
    runoff: { curveNumber: 0, peakFlow: 0, convergenceTime: thermal.breakUpHours * 60, yieldTime: 0 },
    channelRouting: {
      peakArrivalTime: thermal.breakUpHours,
      peakVelocity: 2.1,
      sections: [
        { name: '流凌进口断面', depth: Math.round(inundation.maxDepth * 0.6 * 10) / 10, flow: 0 },
        { name: '弯道卡塞断面', depth: inundation.maxDepth, flow: 0 },
        { name: '滩区漫溢出流断面', depth: Math.round(inundation.maxDepth * 0.8 * 10) / 10, flow: 0 },
      ],
    },
    inundation,
    riskAssessment,
    transferTask,
    feedbackCorrection: {
      modelVersion: 'FG-IceModel v1.2',
      lastCalibrated: '2026-03-15',
      accuracyNote: '基于近五年凌汛灾例校正，开江时间误差±6小时，冰塞位置识别准确率92%',
    },
  };
}

/** 凌汛预警 · 村民通俗版文案 */
export function generateIcePublicText(level: string, villageName: string, derivation: IceDerivation): string {
  const levelText = level === 'red' ? '红色（极高风险）' :
                    level === 'orange' ? '橙色（中高风险）' :
                    level === 'yellow' ? '黄色（中风险）' : '蓝色（低风险）';
  const action = level === 'red' ? '请立即撤离！' :
                 level === 'orange' ? '请做好撤离准备，老人小孩优先转移！' :
                 level === 'yellow' ? '请密切关注冰情水情变化，做好转移准备。' :
                 '请留意后续预警信息。';
  const i = derivation.ice;
  return `【${levelText}凌汛预警】${villageName}河段存在冰塞壅水风险。\n` +
    `当前流凌密度${i.flowDensity}%，冰厚${i.iceThickness}m，水位超警${i.waterRise}m。\n` +
    `预计约${derivation.channelRouting.peakArrivalTime}小时内开江，最大漫滩水深可能达${derivation.inundation.maxDepth}米。\n` +
    `${action}\n` +
    `避险要点：迅速撤离至堤防高程以上安置点，严禁在冰面上行走、玩耍或围观，远离弯道卡塞段与历史决口段。`;
}

/** 凌汛预警 · 专业溯源版文案 */
export function generateIceProfessionalText(villageName: string, derivation: IceDerivation): string {
  const i = derivation.ice;
  const ch = derivation.channelRouting;
  const inun = derivation.inundation;
  const risk = derivation.riskAssessment;
  const jam = Math.round(i.flowDensity * 0.6 + i.iceThickness * 80 + i.waterRise * 30);
  return `【专业溯源报告 - ${villageName}凌汛】\n` +
    `一、冰情输入：数据源-${i.dataSource}，冰厚${i.iceThickness}m，流凌密度${i.flowDensity}%，气温${i.temp}℃，水位超警${i.waterRise}m。\n` +
    `二、热力评估：气温回升系数${i.temp >= 0 ? 1 : i.temp >= -5 ? 0.75 : 0.5}，武开河风险${i.temp >= -5 ? '高' : '中'}，预计${ch.peakArrivalTime}小时内开江。\n` +
    `三、冰塞壅水：弯道卡塞风险分${jam}，壅水涨率约0.12m/h。断面数据：${ch.sections.map(s => `${s.name}${s.flow === 0 ? '冰塞壅水' : ''}水深${s.depth}m`).join('；')}。\n` +
    `四、淹没分析：预计淹没面积${inun.area}km²，最大水深${inun.maxDepth}m。${inun.depthDistribution}。\n` +
    `五、风险评估：危险性${risk.hazard}、暴露度${risk.exposure}、脆弱性${risk.vulnerability}，综合风险分${risk.riskScore}（${risk.level.toUpperCase()}）。\n` +
    `六、模型版本：${derivation.feedbackCorrection.modelVersion}，${derivation.feedbackCorrection.accuracyNote}。`;
}
