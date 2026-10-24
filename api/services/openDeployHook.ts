/**
 * OpenDeploy 边缘部署与模型分发引擎
 *
 * 将系统打包为边缘 Agent，部署到救援队本地设备或边缘服务器。
 * 核心能力：
 *  1. 模型容器化打包（含八步水文模型 + 轻量化推理）
 *  2. 边缘节点注册与健康检查
 *  3. 离线数据同步（断网续传）
 *  4. 边缘模型热更新
 */

/** 边缘节点状态 */
export interface EdgeNode {
  id: string;
  name: string;              // 节点名称（如"救援一队-边缘终端"）
  type: 'rescue_device' | 'edge_server' | 'village_kiosk';
  status: 'online' | 'offline' | 'syncing';
  lastHeartbeat: string;     // 最后心跳时间
  modelVersion: string;      // 当前模型版本
  location?: string;
  pendingSync: number;       // 待同步数据条数
  batteryLevel?: number;     // 电量百分比（移动设备）
}

/** 部署任务 */
export interface DeployTask {
  id: string;
  version: string;           // 模型版本号
  status: 'building' | 'pushing' | 'deployed' | 'failed';
  trigger: string;           // 触发原因（如"预警参数更新"）
  targetNodes: string[];     // 目标节点列表
  startedAt: string;
  completedAt?: string;
  logs: DeployLog[];
}

interface DeployLog {
  time: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

/** 离线数据包（救援队在网络中断期间缓存的数据） */
export interface OfflinePacket {
  id: string;
  nodeId: string;
  type: 'personnel_report' | 'rescue_update' | 'location_trace' | 'agriculture_record';
  payload: Record<string, unknown>;
  timestamp: string;
  synced: boolean;
}

const OPENDEPLOY_API_URL = process.env.OPENDEPLOY_API_URL || 'https://api.opendeploy.io/v1';
const OPENDEPLOY_API_KEY = process.env.OPENDEPLOY_API_KEY || '';

// 内存中的边缘节点注册表
const edgeNodes: Map<string, EdgeNode> = new Map();
const deployTasks: DeployTask[] = [];
const offlinePackets: OfflinePacket[] = [];

/**
 * 初始化内置边缘节点（演示用）
 */
function initEdgeNodes(): void {
  if (edgeNodes.size > 0) return;
  const now = Date.now();
  const nodes: EdgeNode[] = [
    {
      id: 'EDGE-001', name: '救援一队-便携终端', type: 'rescue_device',
      status: 'online', lastHeartbeat: new Date(now - 30000).toISOString(),
      modelVersion: 'v2.3.1', location: '青龙山村', pendingSync: 0, batteryLevel: 78,
    },
    {
      id: 'EDGE-002', name: '救援二队-便携终端', type: 'rescue_device',
      status: 'syncing', lastHeartbeat: new Date(now - 120000).toISOString(),
      modelVersion: 'v2.3.0', location: '云岭村', pendingSync: 4, batteryLevel: 52,
    },
    {
      id: 'EDGE-003', name: '青龙山乡-边缘服务器', type: 'edge_server',
      status: 'online', lastHeartbeat: new Date(now - 10000).toISOString(),
      modelVersion: 'v2.3.1', location: '乡政府机房', pendingSync: 0,
    },
    {
      id: 'EDGE-004', name: '青龙山村-信息亭', type: 'village_kiosk',
      status: 'offline', lastHeartbeat: new Date(now - 600000).toISOString(),
      modelVersion: 'v2.2.5', location: '村委会', pendingSync: 12,
    },
  ];
  for (const n of nodes) edgeNodes.set(n.id, n);
}

/**
 * 触发模型部署（当预警参数更新时自动调用）
 *
 * 执行流程：
 *  1. git commit 当前模型参数
 *  2. docker build 新的救援镜像
 *  3. 推送到边缘节点
 */
export async function triggerDeploy(
  trigger: string,
  modelConfig: Record<string, unknown>
): Promise<DeployTask> {
  initEdgeNodes();
  const taskId = `DEPLOY-${Date.now()}`;
  const version = `v2.${new Date().getMonth() + 1}.${new Date().getDate()}.${Math.floor(Math.random() * 10)}`;

  const task: DeployTask = {
    id: taskId,
    version,
    status: 'building',
    trigger,
    targetNodes: [...edgeNodes.keys()],
    startedAt: new Date().toISOString(),
    logs: [
      { time: new Date().toISOString(), level: 'info', message: `开始构建模型镜像 ${version}（触发: ${trigger}）` },
    ],
  };
  deployTasks.unshift(task);

  // 模拟异步构建→推送→部署流程
  simulateDeployPipeline(task, modelConfig);

  return task;
}

/**
 * 模拟 OpenDeploy 的 CI/CD 管道
 * building → pushing → deployed
 */
function simulateDeployPipeline(task: DeployTask, _config: Record<string, unknown>): void {
  setTimeout(() => {
    task.logs.push({
      time: new Date().toISOString(), level: 'info',
      message: '镜像构建完成，开始推送到边缘节点…',
    });
    task.status = 'pushing';
  }, 1500);

  setTimeout(() => {
    task.logs.push({
      time: new Date().toISOString(), level: 'info',
      message: `已推送至 ${task.targetNodes.length} 个边缘节点，正在执行热更新…`,
    });
    // 更新在线节点的模型版本
    for (const nodeId of task.targetNodes) {
      const node = edgeNodes.get(nodeId);
      if (node && node.status !== 'offline') {
        node.modelVersion = task.version;
      }
    }
    task.logs.push({
      time: new Date().toISOString(), level: 'info',
      message: `部署完成。在线节点已更新至 ${task.version}，离线节点将在恢复连接后自动同步。`,
    });
    task.status = 'deployed';
    task.completedAt = new Date().toISOString();
  }, 3500);
}

/**
 * 接收救援队离线期间缓存的数据包
 * 模拟"断网续传"：网络恢复后自动回传
 */
export async function receiveOfflineSync(
  packets: OfflinePacket[]
): Promise<{ synced: number; newModelVersion: string }> {
  initEdgeNodes();
  let synced = 0;

  for (const pkt of packets) {
    // 模拟 GLM-5.1 数据清洗和去重
    pkt.synced = true;
    offlinePackets.push(pkt);
    synced++;

    // 更新对应节点的待同步计数
    const node = edgeNodes.get(pkt.nodeId);
    if (node) {
      node.pendingSync = Math.max(0, node.pendingSync - 1);
      node.status = 'online';
      node.lastHeartbeat = new Date().toISOString();
    }
  }

  // 返回最新模型版本（实现边缘模型热更新）
  const latestNode = [...edgeNodes.values()][0];
  const newModelVersion = latestNode?.modelVersion || 'v2.3.1';

  return { synced, newModelVersion };
}

/**
 * 获取所有边缘节点状态
 */
export function getEdgeNodes(): EdgeNode[] {
  initEdgeNodes();
  // 更新离线判断（超过5分钟无心跳视为离线）
  const now = Date.now();
  for (const node of edgeNodes.values()) {
    const elapsed = now - new Date(node.lastHeartbeat).getTime();
    if (elapsed > 300000 && node.status === 'online') {
      node.status = 'offline';
    }
  }
  return [...edgeNodes.values()];
}

/**
 * 获取部署历史
 */
export function getDeployHistory(): DeployTask[] {
  return deployTasks.slice(0, 10);
}
