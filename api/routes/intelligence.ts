/**
 * 智能情报 API 路由
 * 整合 Monid 多源数据融合 + OpenDeploy 边缘部署 + 离线同步
 */
import { Router, type Request, type Response } from 'express';
import { getSentimentOverview } from '../services/monidIntegrator.js';
import {
  triggerDeploy, receiveOfflineSync, getEdgeNodes, getDeployHistory,
} from '../services/openDeployHook.js';

const router = Router();

// ============ Monid 多源舆情 ============

/**
 * GET /api/intelligence/sentiment
 * 获取全网舆情态势总览（Monid + GLM-5.1 研判）
 */
router.get('/sentiment', async (req: Request, res: Response): Promise<void> => {
  try {
    const region = (req.query.region as string) || '青龙山村';
    const overview = await getSentimentOverview(region);
    res.json({ success: true, data: overview });
  } catch (err) {
    console.error('[Monid] 舆情获取失败:', err);
    res.status(500).json({ success: false, error: '舆情数据获取失败' });
  }
});

// ============ OpenDeploy 边缘部署 ============

/**
 * GET /api/intelligence/edge-nodes
 * 获取所有边缘节点状态
 */
router.get('/edge-nodes', (_req: Request, res: Response): void => {
  const nodes = getEdgeNodes();
  res.json({ success: true, data: nodes });
});

/**
 * GET /api/intelligence/deploy-history
 * 获取模型部署历史
 */
router.get('/deploy-history', (_req: Request, res: Response): void => {
  const tasks = getDeployHistory();
  res.json({ success: true, data: tasks });
});

/**
 * POST /api/intelligence/deploy
 * 触发模型部署（预警参数更新时自动调用）
 */
router.post('/deploy', async (req: Request, res: Response): Promise<void> => {
  try {
    const { trigger, modelConfig } = req.body;
    const task = await triggerDeploy(
      trigger || '手动触发部署',
      modelConfig || {}
    );
    res.json({ success: true, data: task });
  } catch (err) {
    console.error('[OpenDeploy] 部署失败:', err);
    res.status(500).json({ success: false, error: '模型部署失败' });
  }
});

/**
 * POST /api/intelligence/offline-sync
 * 接收救援队离线期间缓存的数据包（断网续传）
 */
router.post('/offline-sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const packets = req.body.packets || [];
    const result = await receiveOfflineSync(packets);
    res.json({
      success: true,
      data: {
        synced: result.synced,
        newModelVersion: result.newModelVersion,
        message: `已同步 ${result.synced} 条离线数据，边缘模型已更新至 ${result.newModelVersion}`,
      },
    });
  } catch (err) {
    console.error('[OpenDeploy] 离线同步失败:', err);
    res.status(500).json({ success: false, error: '离线数据同步失败' });
  }
});

export default router;
