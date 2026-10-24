/**
 * 队伍管理页 - 移动端
 * 救援队成员列表 + 车辆装备信息
 */
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Truck, Radio, Phone, User } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  roleColor: string;
  unit: string;
  experience: string;
  avatarColor: string;
  icon: React.ReactNode;
  onDuty: boolean;
}

interface VehicleEquipment {
  type: string;
  icon: React.ReactNode;
  detail: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: '李志强',
    role: '队长',
    roleColor: 'text-accent',
    unit: '应急管理局',
    experience: '10年经验',
    avatarColor: 'bg-accent/10 text-accent',
    icon: <User size={20} />,
    onDuty: true,
  },
  {
    name: '张伟',
    role: '医疗员',
    roleColor: 'text-ink-sub',
    unit: '红十字会',
    experience: '5年经验',
    avatarColor: 'bg-safe/10 text-safe',
    icon: <User size={20} />,
    onDuty: true,
  },
  {
    name: '王刚',
    role: '驾驶员',
    roleColor: 'text-ink-sub',
    unit: 'A2驾照',
    experience: '8年驾龄',
    avatarColor: 'bg-warn-orange/10 text-warn-orange',
    icon: <User size={20} />,
    onDuty: true,
  },
  {
    name: '刘洋',
    role: '救援员',
    roleColor: 'text-ink-sub',
    unit: '民兵应急连',
    experience: '3年经验',
    avatarColor: 'bg-accent/10 text-accent',
    icon: <User size={20} />,
    onDuty: true,
  },
  {
    name: '赵强',
    role: '救援员',
    roleColor: 'text-ink-sub',
    unit: '民兵应急连',
    experience: '2年经验',
    avatarColor: 'bg-safe/10 text-safe',
    icon: <User size={20} />,
    onDuty: true,
  },
];

const VEHICLES: VehicleEquipment[] = [
  { type: '救护车', icon: <Truck size={18} />, detail: '鄂A·E2026 · 担架2副 · 急救包3个' },
  { type: '物资车', icon: <Truck size={18} />, detail: '鄂A·E2027 · 载重2吨' },
  { type: '对讲机', icon: <Radio size={18} />, detail: '5部 · 频道 CH-12' },
  { type: '卫星电话', icon: <Phone size={18} />, detail: '1部 · 备用' },
];

export default function RescueTeam() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-[calc(100vh-96px)]">
      {/* 顶部导航 */}
      <div className="h-12 bg-white border-b border-border flex items-center px-2 gap-2 sticky top-0 z-50">
        <button
          onClick={() => navigate('/rescue')}
          className="flex items-center gap-1 text-sm text-ink-sub hover:text-primary"
        >
          <ArrowLeft size={18} /> 返回
        </button>
        <div className="font-bold text-sm flex-1 text-center pr-12 truncate">
          队伍管理
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {/* 救援队成员 */}
        <div className="card m-3 p-4">
          <div className="text-xs font-bold text-ink-sub mb-3 flex items-center gap-1.5">
            <Users size={14} /> 救援队成员（5人）
          </div>
          <div className="space-y-2">
            {TEAM_MEMBERS.map(member => (
              <div
                key={member.name}
                className="flex items-center gap-3 p-3 rounded-card bg-bg"
              >
                {/* 头像 */}
                <div
                  className={`w-9 h-9 rounded-full ${member.avatarColor} flex items-center justify-center shrink-0`}
                >
                  {member.icon}
                </div>
                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold">
                    {member.name}{' '}
                    <span className={`text-[11px] font-medium ${member.roleColor}`}>
                      {member.role}
                    </span>
                  </div>
                  <div className="text-xs text-ink-sub">
                    {member.unit} · {member.experience}
                  </div>
                </div>
                {/* 在岗状态 */}
                <div className="flex items-center gap-1 text-xs shrink-0">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      member.onDuty ? 'bg-safe animate-pulse' : 'bg-ink-sub'
                    }`}
                  />
                  <span className={member.onDuty ? 'text-safe' : 'text-ink-sub'}>
                    {member.onDuty ? '在岗' : '离岗'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 车辆装备 */}
        <div className="card m-3 p-4">
          <div className="text-xs font-bold text-ink-sub mb-3 flex items-center gap-1.5">
            <Truck size={14} /> 车辆装备
          </div>
          <div className="space-y-3">
            {VEHICLES.map(item => (
              <div key={item.type} className="flex items-center gap-3 text-sm">
                <span className="text-ink-sub w-16 shrink-0 text-xs font-medium">
                  {item.type}
                </span>
                <span className="flex items-center gap-1.5 text-ink">
                  <span className="text-accent">{item.icon}</span>
                  {item.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
