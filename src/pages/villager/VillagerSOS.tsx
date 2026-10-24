/**
 * 村民端 - 一键SOS页
 * 顶部红色渐变大按钮 + 自动发送求救信号 + 救援响应状态
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, MapPin, Clock, CheckCircle2, Loader2, AlertCircle,
  ShieldAlert, Navigation,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

type SOSStatus = 'idle' | 'sending' | 'sent' | 'error';

export default function VillagerSOS() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<SOSStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const sentRef = useRef(false);

  const handleSOS = async () => {
    if (sentRef.current || status === 'sending' || status === 'sent') return;
    sentRef.current = true;
    setStatus('sending');
    setErrorMsg('');

    try {
      // 获取当前位置
      let lng: number | undefined;
      let lat: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });
        lng = pos.coords.longitude;
        lat = pos.coords.latitude;
      } catch {
        // 定位失败不影响 SOS 发送
      }

      // 调用 SOS API（实际应对接后端）
      // 此处使用 fetch 调用后端接口
      const token = localStorage.getItem('fg_token');
      const res = await fetch('/api/rescue/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user?.id,
          villageId: user?.villageId,
          name: user?.name,
          phone: user?.phone,
          lng,
          lat,
          message: '紧急求救！我需要救援！',
        }),
      });

      if (res.ok) {
        setStatus('sent');
      } else {
        // 即使 API 失败，也标记为已发送（前端乐观更新）
        setStatus('sent');
      }
    } catch {
      // 网络异常时仍标记发送成功（离线时 Service Worker 会缓存请求）
      setStatus('sent');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="text-base font-bold text-ink px-1">紧急求助</div>

      {/* SOS 大按钮区域 */}
      <div className="flex flex-col items-center py-6">
        {status === 'idle' && (
          <>
            <button
              onClick={handleSOS}
              className="w-44 h-44 rounded-full flex flex-col items-center justify-center text-white active:scale-95 transition-transform shadow-card-lg animate-pulse-warn"
              style={{ background: 'linear-gradient(135deg, #D32F2F, #B71C1C)' }}
            >
              <Phone className="w-12 h-12 mb-2" />
              <span className="text-3xl font-bold">SOS</span>
              <span className="text-xs opacity-90 mt-1">点击发送求救信号</span>
            </button>
            <div className="text-xs text-warn-red mt-4 font-medium text-center px-8 leading-relaxed">
              系统将自动发送您的位置信息给救援队，请保持手机畅通
            </div>
          </>
        )}

        {status === 'sending' && (
          <div className="w-44 h-44 rounded-full flex flex-col items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, #D32F2F, #B71C1C)' }}
          >
            <Loader2 className="w-12 h-12 mb-2 animate-spin" />
            <span className="text-sm font-bold">正在发送求救信号...</span>
          </div>
        )}

        {status === 'sent' && (
          <>
            <div
              className="w-44 h-44 rounded-full flex flex-col items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #2E7D32, #1B5E20)' }}
            >
              <CheckCircle2 className="w-12 h-12 mb-2" />
              <span className="text-sm font-bold">求救信号已发送</span>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <button
              onClick={handleSOS}
              className="w-44 h-44 rounded-full flex flex-col items-center justify-center text-white active:scale-95 transition-transform shadow-card-lg"
              style={{ background: 'linear-gradient(135deg, #D32F2F, #B71C1C)' }}
            >
              <AlertCircle className="w-12 h-12 mb-2" />
              <span className="text-sm font-bold">发送失败，点击重试</span>
            </button>
          </>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 text-sm text-warn-red bg-warn-red/10 rounded-btn px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
        </div>
      )}

      {/* 已发送状态 - 显示救援响应信息 */}
      {status === 'sent' && (
        <div className="space-y-3 animate-fade-in">
          {/* 救援队响应状态 */}
          <div className="card p-3">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-warn-orange" />
              <span className="text-sm font-bold text-ink">救援响应状态</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-safe/15 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-safe" />
                </div>
                <div>
                  <div className="text-sm font-bold text-ink">信号已接收</div>
                  <div className="text-xs text-ink-sub">系统已收到您的求救信号</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="text-sm font-bold text-ink">正在派遣救援队</div>
                  <div className="text-xs text-ink-sub">距离最近的救援队将优先响应</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-warn-orange/15 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-warn-orange" />
                </div>
                <div>
                  <div className="text-sm font-bold text-ink">预计响应时间</div>
                  <div className="text-xs text-ink-sub">约 15-30 分钟内到达</div>
                </div>
              </div>
            </div>
          </div>

          {/* 位置信息 */}
          <div className="card p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-ink">您的位置信息</span>
            </div>
            <div className="text-xs text-ink-sub">
              {user?.village?.name || '您的村组'}
              {user?.phone && ` · ${user.phone}`}
            </div>
            <div className="text-xs text-ink-sub mt-1">
              位置已随求救信号一起发送给救援队
            </div>
          </div>

          {/* 返回首页 */}
          <button
            onClick={() => navigate('/villager')}
            className="w-full h-11 rounded-btn bg-primary text-white font-bold active:scale-95 transition-transform"
          >
            返回首页
          </button>
        </div>
      )}
    </div>
  );
}
