/**
 * 任务执行中页面 - 移动端
 * 绿色渐变状态栏 + 进度条 + 任务清单 + 快捷操作
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Rocket, Phone, MapPin, Share2, ShieldCheck,
  CheckSquare, Square, Camera,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  defaultChecked: boolean;
}

const CHECKLIST: ChecklistItem[] = [
  { id: 'load', label: '确认物资装车', defaultChecked: true },
  { id: 'vehicle', label: '确认车辆状况', defaultChecked: true },
  { id: 'notify', label: '通知求助人预计到达时间', defaultChecked: true },
  { id: 'route', label: '沿推荐路线行进', defaultChecked: false },
  { id: 'assess', label: '到达后评估伤情并处理伤口', defaultChecked: false },
  { id: 'transfer', label: '协助人员上车，转移至安置点', defaultChecked: false },
  { id: 'register', label: '到达安置点，交接登记', defaultChecked: false },
];

const QUICK_ACTIONS = [
  { icon: <Phone size={18} />, label: '联系求助人', color: '#2E7DFF' },
  { icon: <Phone size={18} />, label: '联系指挥中心', color: '#005288' },
  { icon: <Share2 size={18} />, label: '位置共享', color: '#F57C00' },
  { icon: <ShieldCheck size={18} />, label: '安全上报', color: '#27AE60' },
];

export default function RescueExecute() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    Object.fromEntries(CHECKLIST.map(c => [c.id, c.defaultChecked]))
  );

  const toggleCheck = (itemId: string) => {
    setChecklist(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const checkedCount = Object.values(checklist).filter(Boolean).length;

  const handleQuickAction = (label: string) => {
    alert(`${label}功能演示`);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-96px)]">
      {/* 顶部导航 */}
      <div className="h-12 bg-white border-b border-border flex items-center px-2 gap-2 sticky top-0 z-50">
        <button
          onClick={() => navigate(`/rescue/task/${id}`)}
          className="flex items-center gap-1 text-sm text-ink-sub hover:text-primary"
        >
          <ArrowLeft size={18} /> 返回
        </button>
        <div className="font-bold text-sm flex-1 text-center pr-12 truncate">
          任务执行
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* 绿色渐变状态栏 */}
        <div className="bg-gradient-to-br from-safe to-green-800 text-white px-5 py-5 text-center">
          <div className="flex justify-center mb-2">
            <Rocket size={36} className="opacity-90" />
          </div>
          <h2 className="text-lg font-bold">任务进行中</h2>
          <p className="text-sm opacity-90 mt-1">正在前往云岭村3组 · 王建国家</p>

          {/* 进度条 */}
          <div className="mt-3 bg-white/15 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all"
              style={{ width: `${Math.round((checkedCount / CHECKLIST.length) * 100)}%` }}
            />
          </div>
          <div className="text-[11px] mt-1.5 opacity-80">
            距目标 2.1km · 预计 8 分钟到达
          </div>
        </div>

        {/* 任务清单 */}
        <div className="card m-3 p-4">
          <div className="text-xs font-bold text-ink-sub mb-3 flex items-center gap-1.5">
            任务清单 ({checkedCount}/{CHECKLIST.length})
          </div>
          <div className="space-y-3">
            {CHECKLIST.map(item => {
              const checked = checklist[item.id];
              return (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 text-sm cursor-pointer transition-opacity ${
                    checked ? 'opacity-50' : ''
                  }`}
                >
                  {checked ? (
                    <CheckSquare size={20} className="text-safe shrink-0" />
                  ) : (
                    <Square size={20} className="text-ink-sub shrink-0" />
                  )}
                  <span className={checked ? 'line-through text-ink-sub' : 'text-ink'}>
                    {item.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="card m-3 p-4">
          <div className="text-xs font-bold text-ink-sub mb-3 flex items-center gap-1.5">
            快捷操作
          </div>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.label)}
                className="flex items-center justify-center gap-2 h-10 rounded-btn border border-border text-xs font-medium text-ink active:scale-[0.98] transition-transform bg-white hover:bg-bg"
              >
                <span style={{ color: action.color }}>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 底部固定按钮 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-border p-3 z-50">
        <button
          onClick={() => navigate(`/rescue/complete/${id}`)}
          className="w-full h-11 rounded-btn bg-safe text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <MapPin size={18} />
          到达目的地 · 完成上报
        </button>
      </div>
    </div>
  );
}
