/**
 * 离线模式检测与 IndexedDB 数据缓存
 *
 * 场景：救援队进入山区，网络中断（navigator.onLine === false）
 * 逻辑：前端自动切换到"离线模式"，所有数据写入本地 IndexedDB。
 *       当网络恢复时，OpenDeploy 管理的 Agent 会自动将离线数据包回传给指挥部。
 */

const DB_NAME = 'aquapulse_offline';
const DB_VERSION = 1;
const STORE_NAME = 'offline_packets';

/** 打开 IndexedDB */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface OfflinePacket {
  id: string;
  type: 'personnel_report' | 'rescue_update' | 'location_trace' | 'agriculture_record';
  payload: Record<string, unknown>;
  timestamp: string;
  synced: boolean;
}

/** 写入离线数据包到 IndexedDB */
export async function saveOfflinePacket(
  type: OfflinePacket['type'],
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const packet: OfflinePacket = {
      id: `PKT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
      synced: false,
    };
    tx.objectStore(STORE_NAME).add(packet);
    tx.oncomplete = () => db.close();
  } catch (e) {
    console.warn('[OfflineSync] IndexedDB 写入失败:', e);
  }
}

/** 读取所有未同步的离线数据包 */
export async function getUnsyncedPackets(): Promise<OfflinePacket[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => {
        const all = req.result as OfflinePacket[];
        resolve(all.filter(p => !p.synced));
        db.close();
      };
      req.onerror = () => { resolve([]); db.close(); };
    });
  } catch {
    return [];
  }
}

/** 标记数据包为已同步 */
export async function markSynced(ids: string[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const id of ids) {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const packet = getReq.result as OfflinePacket | undefined;
        if (packet) {
          packet.synced = true;
          store.put(packet);
        }
      };
    }
    tx.oncomplete = () => db.close();
  } catch (e) {
    console.warn('[OfflineSync] 标记同步失败:', e);
  }
}

/** 获取待同步数据条数 */
export async function getPendingSyncCount(): Promise<number> {
  const packets = await getUnsyncedPackets();
  return packets.length;
}

/** 检测当前是否在线 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * 网络状态监听 Hook
 * 返回: { online, wasOffline }
 * - online: 当前是否在线
 * - wasOffline: 是否曾经历过离线（用于触发同步）
 */
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
    };
    const handleOffline = () => {
      setOnline(false);
      setWasOffline(true);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { online, wasOffline };
}
