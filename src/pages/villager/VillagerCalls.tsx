/**
 * 村民端 - 应急电话页
 * 紧急救援（119/120/110）+ 本地应急（防汛指挥部/村主任/救援队长）+ 安置点电话
 */
import {
  Phone, PhoneCall, Building2, User, Shield, Flame,
  Siren, HeartPulse, Landmark, UsersRound,
} from 'lucide-react';

interface PhoneCard {
  name: string;
  number: string;
  icon: React.ReactNode;
  iconBg: string;
}

const EMERGENCY_PHONES: PhoneCard[] = [
  {
    name: '消防救援',
    number: '119',
    icon: <Flame className="w-5 h-5 text-warn-red" />,
    iconBg: 'bg-warn-red/10',
  },
  {
    name: '医疗急救',
    number: '120',
    icon: <HeartPulse className="w-5 h-5 text-safe" />,
    iconBg: 'bg-safe/10',
  },
  {
    name: '公安报警',
    number: '110',
    icon: <Siren className="w-5 h-5 text-primary" />,
    iconBg: 'bg-accent/10',
  },
];

const LOCAL_PHONES: PhoneCard[] = [
  {
    name: '防汛指挥部',
    number: '027-8XXX-1001',
    icon: <Landmark className="w-5 h-5 text-warn-orange" />,
    iconBg: 'bg-warn-orange/10',
  },
  {
    name: '村主任',
    number: '138-XXXX-2001',
    icon: <User className="w-5 h-5 text-primary" />,
    iconBg: 'bg-accent/10',
  },
  {
    name: '救援队队长',
    number: '139-XXXX-3001',
    icon: <Shield className="w-5 h-5 text-safe" />,
    iconBg: 'bg-safe/10',
  },
];

const SHELTER_PHONE: PhoneCard = {
  name: '安置点电话',
  number: '027-8XXX-4001',
  icon: <Building2 className="w-5 h-5 text-safe" />,
  iconBg: 'bg-safe/10',
};

function PhoneItem({ card }: { card: PhoneCard }) {
  return (
    <a
      href={`tel:${card.number.replace(/-/g, '')}`}
      className="card p-4 flex items-center gap-4 active:bg-bg transition-colors"
    >
      <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${card.iconBg}`}>
        {card.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-ink">{card.name}</div>
        <div className="text-xs text-primary font-medium mt-0.5">{card.number}</div>
      </div>
      <div className="w-10 h-10 rounded-full bg-safe text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform">
        <PhoneCall className="w-5 h-5" />
      </div>
    </a>
  );
}

export default function VillagerCalls() {
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="text-base font-bold text-ink px-1 flex items-center gap-1">
        <Phone className="w-4 h-4 text-primary" /> 应急电话
      </div>

      {/* 紧急救援 */}
      <div className="text-sm font-bold text-ink-sub px-1">紧急救援</div>
      <div className="space-y-2">
        {EMERGENCY_PHONES.map((card) => (
          <PhoneItem key={card.number} card={card} />
        ))}
      </div>

      {/* 本地应急 */}
      <div className="text-sm font-bold text-ink-sub px-1">本地应急</div>
      <div className="space-y-2">
        {LOCAL_PHONES.map((card) => (
          <PhoneItem key={card.number} card={card} />
        ))}
      </div>

      {/* 安置点 */}
      <div className="text-sm font-bold text-ink-sub px-1">安置点</div>
      <PhoneItem card={SHELTER_PHONE} />
    </div>
  );
}
