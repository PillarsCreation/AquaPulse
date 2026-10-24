/**
 * 预警路由 - 模型链推演、预警发布、查询
 */
import { Router, type Request, type Response } from 'express';
import { tables, initData, genId } from '../db.js';
import {
  runFullDerivation, generatePublicText, generateProfessionalText,
  runIceDerivation, generateIcePublicText, generateIceProfessionalText,
} from '../services/warningModel.js';

const router = Router();

/** 灾种标签（用于预警标题） */
const DISASTER_LABEL: Record<string, string> = {
  flashflood: '山洪', landslide: '滑坡', urban: '城市内涝', typhoon: '台风风暴潮',
  icejam: '凌汛', winterflood: '南方冬汛', snowmelt: '融雪', drought: '干旱',
};

/** 冰情输入校验（凌汛灾种） */
function validateIceInput(params: {
  iceThickness?: number; flowDensity?: number; temp?: number; waterRise?: number;
}): { valid: boolean; error?: string; iceThickness: number; flowDensity: number; temp: number; waterRise: number } {
  const it = Number(params.iceThickness);
  const fd = Number(params.flowDensity);
  const tp = Number(params.temp);
  const wr = Number(params.waterRise);
  if (it < 0 || fd < 0 || wr < 0) {
    return { valid: false, error: '冰厚/流凌密度/水位超警不能为负数', iceThickness: 0, flowDensity: 0, temp: 0, waterRise: 0 };
  }
  const iceThickness = Math.min(it, 3);
  const flowDensity = Math.min(fd, 100);
  const waterRise = Math.min(wr, 10);
  if (iceThickness === 0 && flowDensity === 0 && waterRise === 0) {
    return { valid: false, error: '当前无冰情数据，无需启动凌汛推演', iceThickness: 0, flowDensity: 0, temp: 0, waterRise: 0 };
  }
  return { valid: true, iceThickness, flowDensity, temp: tp, waterRise };
}

/**
 * 极端降雨输入校验
 * 返回 { valid, error, clamped }
 */
function validateRainfallInput(params: {
  rainfallIntensity?: number;
  cumulativeRainfall?: number;
  forecastRainfall?: number;
}): { valid: boolean; error?: string; intensity: number; cumulative: number; forecast: number } {
  const ri = Number(params.rainfallIntensity);
  const cr = Number(params.cumulativeRainfall);
  const fr = Number(params.forecastRainfall);

  // 检查负值
  if (ri < 0 || cr < 0 || fr < 0) {
    return { valid: false, error: '降雨量不能为负数，请输入有效值', intensity: 0, cumulative: 0, forecast: 0 };
  }

  // 检查超大值（雨强上限 300mm/h，累计上限 2000mm）
  const MAX_INTENSITY = 300;
  const MAX_CUMULATIVE = 2000;
  const intensity = Math.min(ri, MAX_INTENSITY);
  const cumulative = Math.min(cr, MAX_CUMULATIVE);
  const forecast = Math.min(fr, MAX_CUMULATIVE);

  // 全部为 0 → 无降雨
  if (intensity === 0 && cumulative === 0 && forecast === 0) {
    return { valid: false, error: '当前无降雨数据，无需启动预警推演', intensity: 0, cumulative: 0, forecast: 0 };
  }

  return { valid: true, intensity, cumulative, forecast };
}

router.post('/simulate', (req: Request, res: Response): void => {
  const { villageId, rainfallIntensity, cumulativeRainfall, forecastRainfall, population,
    iceThickness, flowDensity, temp, waterRise } = req.body;
  if (!villageId) { res.status(400).json({ success: false, error: '请选择村组' }); return; }

  initData();
  const village = tables.villages.find(v => v.id === villageId);
  if (!village) { res.status(404).json({ success: false, error: '村组不存在' }); return; }

  // 凌汛灾种：走冰情推演分支
  if (village.disaster_type === 'icejam') {
    const checked = validateIceInput({ iceThickness, flowDensity, temp, waterRise });
    if (!checked.valid) { res.status(400).json({ success: false, error: checked.error }); return; }
    const derivation = runIceDerivation({
      villageId: village.id, villageName: village.name,
      centerLng: village.lng, centerLat: village.lat, terrainRisk: village.terrain_risk,
      population: population || 20,
      iceThickness: checked.iceThickness, flowDensity: checked.flowDensity,
      temp: checked.temp, waterRise: checked.waterRise,
    });
    res.json({
      success: true,
      data: {
        derivation,
        publicText: generateIcePublicText(derivation.riskAssessment.level, village.name, derivation),
        professionalText: generateIceProfessionalText(village.name, derivation),
        level: derivation.riskAssessment.level,
        village,
      },
    });
    return;
  }

  // 极端降雨输入校验
  const checked = validateRainfallInput({ rainfallIntensity, cumulativeRainfall, forecastRainfall });
  if (!checked.valid) {
    res.status(400).json({ success: false, error: checked.error });
    return;
  }

  const derivation = runFullDerivation({
    villageId: village.id, villageName: village.name,
    centerLng: village.lng, centerLat: village.lat, terrainRisk: village.terrain_risk,
    population: population || 20,
    rainfallIntensity: checked.intensity,
    cumulativeRainfall: checked.cumulative,
    forecastRainfall: checked.forecast,
  });

  res.json({
    success: true,
    data: {
      derivation,
      publicText: generatePublicText(derivation.riskAssessment.level, village.name, derivation),
      professionalText: generateProfessionalText(village.name, derivation),
      level: derivation.riskAssessment.level,
      village,
    },
  });
});

router.post('/', (req: Request, res: Response): void => {
  const { villageId, rainfallIntensity, cumulativeRainfall, forecastRainfall, population, customPublicText,
    iceThickness, flowDensity, temp, waterRise } = req.body;
  if (!villageId) { res.status(400).json({ success: false, error: '请选择村组' }); return; }

  initData();
  const village = tables.villages.find(v => v.id === villageId);
  if (!village) { res.status(404).json({ success: false, error: '村组不存在' }); return; }

  const now = new Date();
  const levelTextOf = (lv: string) => lv === 'red' ? '红色' : lv === 'orange' ? '橙色' : lv === 'yellow' ? '黄色' : '蓝色';
  const disasterLabel = DISASTER_LABEL[village.disaster_type || 'flashflood'] || '山洪';

  // 凌汛灾种发布分支
  if (village.disaster_type === 'icejam') {
    const checked = validateIceInput({ iceThickness, flowDensity, temp, waterRise });
    if (!checked.valid) { res.status(400).json({ success: false, error: checked.error }); return; }
    const derivation = runIceDerivation({
      villageId: village.id, villageName: village.name,
      centerLng: village.lng, centerLat: village.lat, terrainRisk: village.terrain_risk,
      population: population || 20,
      iceThickness: checked.iceThickness, flowDensity: checked.flowDensity,
      temp: checked.temp, waterRise: checked.waterRise,
    });
    const level = derivation.riskAssessment.level;
    const warning = {
      id: genId('W'),
      level,
      title: `${village.name}${disasterLabel}灾害${levelTextOf(level)}预警`,
      village_id: village.id,
      center_lng: village.lng, center_lat: village.lat,
      affected_radius: derivation.inundation.area * 1000,
      public_text: customPublicText || generateIcePublicText(level, village.name, derivation),
      professional_text: generateIceProfessionalText(village.name, derivation),
      derivation_json: JSON.stringify(derivation),
      publish_time: now.toISOString(),
      expire_time: new Date(now.getTime() + 86400000).toISOString(),
      status: 'active',
      disaster_type: 'icejam',
    };
    tables.warnings.push(warning);
    res.json({ success: true, data: warning });
    return;
  }

  // 极端降雨输入校验
  const checked = validateRainfallInput({ rainfallIntensity, cumulativeRainfall, forecastRainfall });
  if (!checked.valid) {
    res.status(400).json({ success: false, error: checked.error });
    return;
  }

  const derivation = runFullDerivation({
    villageId: village.id, villageName: village.name,
    centerLng: village.lng, centerLat: village.lat, terrainRisk: village.terrain_risk,
    population: population || 20,
    rainfallIntensity: checked.intensity,
    cumulativeRainfall: checked.cumulative,
    forecastRainfall: checked.forecast,
  });

  // 支持管理员自定义编辑后的村民版文案
  const publicText = customPublicText || generatePublicText(derivation.riskAssessment.level, village.name, derivation);
  const professionalText = generateProfessionalText(village.name, derivation);
  const levelText = levelTextOf(derivation.riskAssessment.level);

  const warning = {
    id: genId('W'),
    level: derivation.riskAssessment.level,
    title: `${village.name}${disasterLabel}灾害${levelText}预警`,
    village_id: village.id,
    center_lng: village.lng, center_lat: village.lat,
    affected_radius: derivation.inundation.area * 1000,
    public_text: publicText,
    professional_text: professionalText,
    derivation_json: JSON.stringify(derivation),
    publish_time: now.toISOString(),
    expire_time: new Date(now.getTime() + 86400000).toISOString(),
    status: 'active',
    disaster_type: village.disaster_type || 'flashflood',
  };
  tables.warnings.push(warning);
  res.json({ success: true, data: warning });
});

router.get('/', (req: Request, res: Response): void => {
  initData();
  const { villageId, status, level } = req.query;
  let result = tables.warnings.map(w => ({
    ...w,
    village_name: tables.villages.find(v => v.id === w.village_id)?.name,
    township: tables.villages.find(v => v.id === w.village_id)?.township,
  }));
  if (villageId) result = result.filter(w => w.village_id === villageId);
  if (status) result = result.filter(w => w.status === status);
  if (level) result = result.filter(w => w.level === level);
  result.sort((a, b) => b.publish_time.localeCompare(a.publish_time));
  res.json({ success: true, data: result });
});

router.get('/:id', (req: Request, res: Response): void => {
  initData();
  const warning = tables.warnings.find(w => w.id === req.params.id);
  if (!warning) { res.status(404).json({ success: false, error: '预警不存在' }); return; }
  const village = tables.villages.find(v => v.id === warning.village_id);
  res.json({
    success: true,
    data: {
      ...warning,
      village_name: village?.name,
      township: village?.township,
      terrain_risk: village?.terrain_risk,
      derivation: JSON.parse(warning.derivation_json),
    },
  });
});

router.patch('/:id/cancel', (req: Request, res: Response): void => {
  initData();
  const warning = tables.warnings.find(w => w.id === req.params.id);
  if (warning) warning.status = 'cancelled';
  res.json({ success: true, data: { id: req.params.id, status: 'cancelled' } });
});

export default router;
