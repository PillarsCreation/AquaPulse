/**
 * 统一登录页 - 四角色选择 + 登录表单
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Home, LifeBuoy, Sprout, LogIn, Lock, User as UserIcon,
  Droplets, AlertCircle,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@/types';

interface RoleOption {
  role: UserRole;
  name: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  demoUser: string;
  demoPwd: string;
}

const ROLES: RoleOption[] = [
  {
    role: 'admin',
    name: '防汛抗旱指挥部',
    desc: '指挥调度、预警发布、全局监控',
    icon: <ShieldCheck size={26} />,
    color: '#00B4D8',
    gradient: 'linear-gradient(135deg, #003D66 0%, #0070B8 100%)',
    demoUser: 'admin',
    demoPwd: 'admin123',
  },
  {
    role: 'villager',
    name: '辖区村民',
    desc: '避险登记、灾情上报、救援请求',
    icon: <Home size={26} />,
    color: '#00E676',
    gradient: 'linear-gradient(135deg, #1B7A3F 0%, #2ECC71 100%)',
    demoUser: 'villager1',
    demoPwd: '123456',
  },
  {
    role: 'rescue',
    name: '应急救援队伍',
    desc: '接收任务、导航救援、轨迹上报',
    icon: <LifeBuoy size={26} />,
    color: '#FF6D00',
    gradient: 'linear-gradient(135deg, #E65100 0%, #FB8C00 100%)',
    demoUser: 'rescue1',
    demoPwd: '123456',
  },
  {
    role: 'agriculture',
    name: '农业灾情统计员',
    desc: '农业灾情登记、损失汇总统计',
    icon: <Sprout size={26} />,
    color: '#42A5F5',
    gradient: 'linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)',
    demoUser: 'agriculture',
    demoPwd: 'agri123',
  },
];

/* ========== 雨滴背景组件 ========== */
function Raindrops() {
  const drops = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = 0.8 + Math.random() * 1.2;
      const height = 15 + Math.random() * 30;
      const opacity = 0.08 + Math.random() * 0.18;
      return { id: i, left, delay, duration, height, opacity };
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {drops.map(d => (
        <div
          key={d.id}
          className="absolute rounded-full animate-raindrop"
          style={{
            left: `${d.left}%`,
            top: '-40px',
            width: '1.5px',
            height: `${d.height}px`,
            background: `linear-gradient(to bottom, transparent, rgba(0,180,216,${d.opacity}))`,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ========== 水波纹背景 ========== */
function WaterRipples() {
  const ripples = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      size: 300 + i * 200,
      delay: i * 2.5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {ripples.map(r => (
        <div
          key={r.id}
          className="absolute rounded-full animate-water-ripple"
          style={{
            width: `${r.size}px`,
            height: `${r.size}px`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            border: '1px solid rgba(0,180,216,0.06)',
            animationDelay: `${r.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ========== 主组件 ========== */
export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function pickRole(r: RoleOption) {
    setSelectedRole(r.role);
    setUsername(r.demoUser);
    setPassword(r.demoPwd);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) {
      setError('请先选择登录角色');
      return;
    }
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { user, token } = await authApi.login(username, password, selectedRole);
      setAuth(user, token);
      navigate(`/${user.role}`, { replace: true });
    } catch (err: any) {
      setError(err?.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="login-page min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #001220 0%, #002B4A 40%, #003D66 100%)',
      }}
    >
      {/* === 全局 CSS 动画（通过 <style> 注入）=== */}
      <style>{`
        /* 雨滴下落 */
        @keyframes raindrop {
          0% { transform: translateY(-40px) translateX(0); opacity: 1; }
          100% { transform: translateY(110vh) translateX(-8px); opacity: 0; }
        }
        .animate-raindrop { animation: raindrop linear infinite; }

        /* 水波纹扩散 */
        @keyframes water-ripple {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
        }
        .animate-water-ripple { animation: water-ripple 8s ease-out infinite; }

        /* 滚动公告 */
        @keyframes scroll-notice {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-notice { animation: scroll-notice 30s linear infinite; }

        /* 卡片入场 */
        @keyframes card-enter {
          0% { opacity: 0; transform: translateY(30px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-card-enter { animation: card-enter 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        /* 标题呼吸光效 */
        @keyframes glow-pulse {
          0%, 100% { text-shadow: 0 0 20px rgba(0,180,216,0.4), 0 0 40px rgba(0,180,216,0.2); }
          50% { text-shadow: 0 0 30px rgba(0,180,216,0.6), 0 0 60px rgba(0,180,216,0.3), 0 0 80px rgba(0,180,216,0.1); }
        }
        .animate-glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }

        /* 图标容器呼吸 */
        @keyframes icon-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0,180,216,0.3), 0 0 40px rgba(0,180,216,0.1); }
          50% { box-shadow: 0 0 30px rgba(0,180,216,0.5), 0 0 60px rgba(0,180,216,0.2), 0 0 90px rgba(0,180,216,0.1); }
        }
        .animate-icon-glow { animation: icon-glow 3s ease-in-out infinite; }

        /* 角色卡片选中光晕 */
        @keyframes selected-halo {
          0%, 100% { box-shadow: 0 0 15px var(--halo-color), 0 0 30px var(--halo-color); }
          50% { box-shadow: 0 0 25px var(--halo-color), 0 0 50px var(--halo-color), 0 0 70px var(--halo-color); }
        }
        .animate-selected-halo { animation: selected-halo 2s ease-in-out infinite; }

        /* 按钮发光 */
        @keyframes btn-glow {
          0%, 100% { box-shadow: 0 4px 20px rgba(0,180,216,0.4), 0 0 40px rgba(0,180,216,0.1); }
          50% { box-shadow: 0 4px 30px rgba(0,180,216,0.6), 0 0 60px rgba(0,180,216,0.2); }
        }
        .animate-btn-glow { animation: btn-glow 2.5s ease-in-out infinite; }

        /* 浮动粒子 */
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(30px); opacity: 0; }
        }
      `}</style>

      {/* 雨滴动画 */}
      <Raindrops />

      {/* 水波纹 */}
      <WaterRipples />

      {/* 背景光晕 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[8%] left-[3%] w-80 h-80 rounded-full bg-cyan-400/[0.04] blur-3xl" />
        <div className="absolute bottom-[5%] right-[3%] w-[500px] h-[500px] rounded-full bg-blue-500/[0.04] blur-3xl" />
        <div className="absolute top-[40%] left-[60%] w-64 h-64 rounded-full bg-teal-400/[0.03] blur-3xl" />
      </div>

      {/* ===== 登录主卡片 ===== */}
      <div
        className="relative w-full max-w-4xl rounded-2xl p-8 animate-card-enter"
        style={{
          background: 'rgba(0,40,70,0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(0,180,216,0.15)',
          boxShadow: '0 8px 60px rgba(0,0,0,0.4), 0 0 40px rgba(0,180,216,0.08)',
        }}
      >
        {/* ---- 标题区域 ---- */}
        <div className="flex items-center gap-4 mb-8 justify-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white animate-icon-glow"
            style={{
              background: 'linear-gradient(135deg, #003D66 0%, #00B4D8 100%)',
            }}
          >
            <Droplets size={34} />
          </div>
          <div>
            <h1
              className="text-3xl font-bold text-white animate-glow-pulse"
            >
              洪水安防地理智能系统
            </h1>
            <p className="text-sm text-white/60 mt-1">山洪与山体滑坡灾害智能预警调度平台</p>
          </div>
        </div>

        {/* ---- 角色选择卡片 ---- */}
        <div className="mb-6">
          <p className="text-sm font-medium text-white/50 mb-3 tracking-wide">
            {'\u26A1'} 请选择登录角色
          </p>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map(r => {
              const active = selectedRole === r.role;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => pickRole(r)}
                  className={`relative text-left rounded-xl border-2 transition-all duration-300 flex items-center gap-3 overflow-hidden ${
                    active ? 'animate-selected-halo' : ''
                  }`}
                  style={{
                    '--halo-color': `${r.color}40`,
                    borderColor: active ? r.color : 'rgba(255,255,255,0.08)',
                    background: active ? 'rgba(0,180,216,0.08)' : 'rgba(255,255,255,0.03)',
                    transform: active ? 'scale(1.02)' : 'scale(1)',
                  } as React.CSSProperties}
                >
                  {/* 左侧彩色竖条 */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300"
                    style={{
                      background: active
                        ? r.color
                        : 'rgba(255,255,255,0.1)',
                      width: active ? '4px' : '3px',
                    }}
                  />
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0"
                    style={{ background: r.gradient, opacity: active ? 1 : 0.7 }}
                  >
                    {r.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-bold text-sm"
                      style={{ color: active ? r.color : 'rgba(255,255,255,0.85)' }}
                    >
                      {r.name}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">{r.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- 登录表单 ---- */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">用户名</label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-white/30 outline-none transition-all duration-200 focus:ring-2 focus:ring-cyan-400/50"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                placeholder="请输入用户名"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">密码</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-white/30 outline-none transition-all duration-200 focus:ring-2 focus:ring-cyan-400/50"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                placeholder="请输入密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
              style={{
                color: '#FF6D00',
                background: 'rgba(255,109,0,0.1)',
                border: '1px solid rgba(255,109,0,0.2)',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 animate-btn-glow"
            style={{
              background: 'linear-gradient(135deg, #005288 0%, #00B4D8 100%)',
              border: 'none',
            }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                登录中...
              </>
            ) : (
              <>
                <LogIn size={18} />
                登 录
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-white/20 mt-6">
          AquaPulse &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
