/**
 * 离线状态指示器
 * 当网络中断时，显示离线提示条，并将数据缓存到 IndexedDB
 * 当网络恢复时，自动触发 OpenDeploy 离线数据同步
 */
import { useEffect, useState, useRef } from 'react';
import { WifiOff, Wifi, Loader2, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus, getUnsyncedPackets, markSynced } from '@/lib/offlineSync';
import { intelligenceApi } from '@/lib/api';

type SyncState = 'idle' | 'syncing' | 'done';

export default function OfflineIndicator() {
  const { online, wasOffline } = useOnlineStatus();
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncCount, setSyncCount] = useState(0);
  const hasSyncedRef = useRef(false);

  // 网络恢复时自动同步
  useEffect(() => {
    if (online && wasOffline && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      setSyncState('syncing');
      (async () => {
        const packets = await getUnsyncedPackets();
        if (packets.length === 0) {
          setSyncState('idle');
          return;
        }
        setSyncCount(packets.length);
        try {
          const result = await intelligenceApi.offlineSync(
            packets.map(p => ({
              id: p.id,
              nodeId: 'EDGE-001',
              type: p.type,
              payload: p.payload,
              timestamp: p.timestamp,
            }))
          );
          await markSynced(packets.map(p => p.id));
          setSyncCount(result.synced);
          setSyncState('done');
          setTimeout(() => setSyncState('idle'), 5000);
        } catch {
          setSyncState('idle');
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, wasOffline]);

  // 离线模式
  if (!online) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-warn-red text-white text-center py-1.5 text-sm font-bold flex items-center justify-center gap-2 animate-fade-in">
        <WifiOff size={16} />
        离线模式 · 数据已缓存到本地，网络恢复后将自动同步
      </div>
    );
  }

  // 同步中
  if (syncState === 'syncing') {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-warn-yellow text-ink text-center py-1.5 text-sm font-bold flex items-center justify-center gap-2 animate-fade-in">
        <Loader2 size={16} className="animate-spin" />
        OpenDeploy 正在同步离线数据…
      </div>
    );
  }

  // 同步完成
  if (syncState === 'done') {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-safe text-white text-center py-1.5 text-sm font-bold flex items-center justify-center gap-2 animate-fade-in">
        <CheckCircle2 size={16} />
        已同步 {syncCount} 条离线数据 · 边缘模型已更新
      </div>
    );
  }

  return null;
}
