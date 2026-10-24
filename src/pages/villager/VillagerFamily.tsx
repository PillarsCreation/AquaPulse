/**
 * 村民端 - 家人报平安页
 * 顶部蓝色渐变卡片 + 紧急联系人 + 可编辑平安信息 + 一键报平安
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Send, CheckCircle2, Loader2, AlertCircle, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  avatar: string;
  avatarBg: string;
}

const DEFAULT_CONTACTS: Contact[] = [
  {
    id: '1',
    name: '王秀兰',
    relation: '妻子',
    phone: '138-XXXX-5001',
    avatar: '女',
    avatarBg: 'bg-accent/10',
  },
  {
    id: '2',
    name: '王小明',
    relation: '儿子',
    phone: '139-XXXX-5002',
    avatar: '男',
    avatarBg: 'bg-safe/10',
  },
  {
    id: '3',
    name: '王大爷',
    relation: '父亲',
    phone: '137-XXXX-5003',
    avatar: '老',
    avatarBg: 'bg-warn-orange/10',
  },
];

const DEFAULT_MESSAGE = '我已安全，正在转移至安置点。请放心。';

export default function VillagerFamily() {
  const navigate = useNavigate();
  const [contacts] = useState<Contact[]>(DEFAULT_CONTACTS);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [sending, setSending] = useState(false);
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());
  const [allSent, setAllSent] = useState(false);
  const [error, setError] = useState('');
  const sendingRef = useRef(false);

  const handleSendToSingle = async (contact: Contact) => {
    if (sentSet.has(contact.id) || sending) return;
    setSending(true);
    setError('');

    try {
      // 模拟发送（实际应调用 API）
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSentSet((prev) => new Set(prev).add(contact.id));

      // 检查是否全部发送
      const newSet = new Set(sentSet);
      newSet.add(contact.id);
      if (newSet.size === contacts.length) {
        setAllSent(true);
      }
    } catch {
      setError('发送失败，请重试');
    } finally {
      setSending(false);
    }
  };

  const handleSendAll = async () => {
    if (sendingRef.current || sending || allSent) return;
    sendingRef.current = true;
    setSending(true);
    setError('');

    try {
      // 模拟一键发送给所有联系人
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setSentSet(new Set(contacts.map((c) => c.id)));
      setAllSent(true);
    } catch {
      setError('发送失败，请重试');
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* 全部发送成功状态 */}
      {allSent ? (
        <div className="flex flex-col items-center justify-center py-10 animate-fade-in text-center">
          <CheckCircle2 className="w-16 h-16 text-safe" />
          <div className="text-lg font-bold mt-3 text-ink">发送成功</div>
          <div className="text-sm text-ink-sub mt-1">
            平安信息已发送给所有紧急联系人
          </div>
          <button
            onClick={() => navigate('/villager')}
            className="mt-5 h-11 px-8 rounded-btn bg-primary text-white font-bold active:scale-95 transition-transform"
          >
            返回首页
          </button>
        </div>
      ) : (
        <>
          <div className="text-base font-bold text-ink px-1">家人报平安</div>

          {/* 顶部蓝色渐变卡片 */}
          <div
            className="rounded-card p-6 text-white text-center"
            style={{ background: 'linear-gradient(135deg, #1565C0, #0D47A1)' }}
          >
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
              <Heart className="w-8 h-8" />
            </div>
            <div className="text-lg font-bold mb-1">向家人报平安</div>
            <div className="text-xs opacity-90">一键发送平安信息给紧急联系人</div>
          </div>

          {/* 紧急联系人 */}
          <div className="text-sm font-bold text-ink px-1">紧急联系人</div>
          <div className="card overflow-hidden">
            {contacts.map((contact, idx) => {
              const isSent = sentSet.has(contact.id);
              return (
                <div
                  key={contact.id}
                  className={cn(
                    'flex items-center gap-3 p-3',
                    idx < contacts.length - 1 && 'border-b border-border'
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-ink', contact.avatarBg)}>
                    {contact.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-ink">
                      {contact.name}
                      <span className="text-xs font-normal text-ink-sub ml-1">（{contact.relation}）</span>
                    </div>
                    <div className="text-xs text-ink-sub">{contact.phone}</div>
                  </div>
                  {isSent ? (
                    <div className="flex items-center gap-1 text-xs text-safe font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 已发送
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSendToSingle(contact)}
                      disabled={sending}
                      className="w-9 h-9 rounded-full bg-safe/10 text-safe flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* 可编辑的平安信息 */}
          <div className="card p-3">
            <div className="text-sm font-bold text-ink mb-2">平安信息（可编辑）</div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-field min-h-[80px] resize-none"
              placeholder="请输入平安信息..."
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-warn-red bg-warn-red/10 rounded-btn px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* 一键报平安按钮 */}
          <button
            onClick={handleSendAll}
            disabled={sending || allSent}
            className={cn(
              'w-full h-14 rounded-btn bg-safe text-white font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform',
              (sending || allSent) && 'opacity-70'
            )}
          >
            {sending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> 发送中...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" /> 一键报平安
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
