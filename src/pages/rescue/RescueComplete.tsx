/**
 * 完成上报页 - 移动端
 * 任务结果选择 + 转移人数 + 伤员处理 + 物资使用 + 现场照片 + 备注
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Camera, Plus, Send,
} from 'lucide-react';

type TaskResult = 'success' | 'partial' | 'failed';

const RESULT_OPTIONS: { key: TaskResult; label: string; emoji: string }[] = [
  { key: 'success', label: '顺利完成', emoji: '✅' },
  { key: 'partial', label: '部分完成', emoji: '⚠️' },
  { key: 'failed', label: '无法完成', emoji: '❌' },
];

const MATERIAL_ITEMS = [
  { name: '急救包', qty: 1, status: '已使用' },
  { name: '担架', qty: 1, status: '已使用·归还' },
  { name: '饮用水', qty: 10, status: '已发放' },
  { name: '方便食品', qty: 6, status: '已发放' },
  { name: '雨衣', qty: 4, status: '已发放' },
];

export default function RescueComplete() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<TaskResult>('success');
  const [transferCount, setTransferCount] = useState(4);
  const [injuryReport, setInjuryReport] = useState(
    '王建国右腿伤口已消毒包扎，无大碍。其余3人无伤情。已全部转移至云岭镇中心小学安置点，登记码YL-2026-0427。'
  );
  const [remark, setRemark] = useState(
    '王建国家后山有滑坡迹象，建议后续关注。村主干道K1+200处落石已清理。'
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    // 模拟提交
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      // 自动返回任务列表
      setTimeout(() => {
        navigate('/rescue', { replace: true });
      }, 1500);
    }, 800);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-96px)]">
      {/* 顶部导航 */}
      <div className="h-12 bg-white border-b border-border flex items-center px-2 gap-2 sticky top-0 z-50">
        <button
          onClick={() => navigate(`/rescue/execute/${id}`)}
          className="flex items-center gap-1 text-sm text-ink-sub hover:text-primary"
        >
          <ArrowLeft size={18} /> 返回
        </button>
        <div className="font-bold text-sm flex-1 text-center pr-12 truncate">
          完成上报
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* 提交成功提示 */}
        {submitted && (
          <div className="bg-safe/10 border-b border-safe/20 p-4 text-center animate-fade-in">
            <CheckCircle2 size={28} className="text-safe mx-auto mb-1" />
            <div className="text-sm font-bold text-safe">完成报告已提交</div>
            <div className="text-xs text-ink-sub mt-1">正在返回任务列表...</div>
          </div>
        )}

        {/* 绿色渐变卡片 */}
        <div className="bg-gradient-to-br from-safe to-green-800 text-white px-5 py-6 text-center">
          <div className="flex justify-center mb-2">
            <CheckCircle2 size={48} className="opacity-90" />
          </div>
          <h2 className="text-lg font-bold">任务即将完成</h2>
          <p className="text-sm opacity-90 mt-1">请填写完成报告</p>
        </div>

        {/* 任务结果选择 */}
        <div className="card m-3 p-4">
          <label className="text-xs font-bold text-ink-sub mb-2 block">任务结果</label>
          <div className="flex flex-wrap gap-2">
            {RESULT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setResult(opt.key)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors active:scale-[0.98] ${
                  result === opt.key
                    ? 'bg-safe text-white border-safe'
                    : 'bg-white text-ink-sub border-border hover:bg-bg'
                }`}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 转移人数 */}
        <div className="card m-3 p-4">
          <label className="text-xs font-bold text-ink-sub mb-2 block">转移人数</label>
          <input
            type="number"
            value={transferCount}
            onChange={e => setTransferCount(Number(e.target.value))}
            className="w-full h-10 rounded-btn border border-border bg-bg px-3 text-sm text-ink focus:outline-none focus:border-safe"
          />
        </div>

        {/* 伤员处理情况 */}
        <div className="card m-3 p-4">
          <label className="text-xs font-bold text-ink-sub mb-2 block">伤员处理情况</label>
          <textarea
            value={injuryReport}
            onChange={e => setInjuryReport(e.target.value)}
            rows={3}
            className="w-full rounded-btn border border-border bg-bg px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:border-safe"
          />
        </div>

        {/* 物资使用情况 */}
        <div className="card m-3 p-4">
          <div className="text-xs font-bold text-ink-sub mb-2">物资使用情况</div>
          <div className="space-y-1.5 text-sm text-ink">
            {MATERIAL_ITEMS.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <span>{item.name} x{item.qty}</span>
                <span className="text-xs text-safe font-medium">{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 现场照片上传 */}
        <div className="card m-3 p-4">
          <div className="text-xs font-bold text-ink-sub mb-2">现场照片</div>
          <div className="flex gap-2 flex-wrap">
            {/* 模拟已有照片 */}
            <div className="w-20 h-20 rounded-card bg-bg flex items-center justify-center text-2xl">
              <Camera size={24} className="text-ink-sub" />
            </div>
            <div className="w-20 h-20 rounded-card bg-bg flex items-center justify-center text-2xl">
              <Camera size={24} className="text-ink-sub" />
            </div>
            {/* 添加按钮 */}
            <button
              onClick={() => alert('相机/相册功能演示')}
              className="w-20 h-20 rounded-card border-2 border-dashed border-accent bg-accent/5 flex items-center justify-center text-accent active:scale-[0.98] transition-transform"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* 备注 */}
        <div className="card m-3 p-4">
          <label className="text-xs font-bold text-ink-sub mb-2 block">备注</label>
          <textarea
            value={remark}
            onChange={e => setRemark(e.target.value)}
            rows={3}
            placeholder="其他需要上报的情况..."
            className="w-full rounded-btn border border-border bg-bg px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:border-safe"
          />
        </div>
      </div>

      {/* 底部固定按钮 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-border p-3 z-50">
        <button
          onClick={handleSubmit}
          disabled={submitting || submitted}
          className="w-full h-11 rounded-btn bg-safe text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={18} />
          )}
          提交完成报告
        </button>
      </div>
    </div>
  );
}
