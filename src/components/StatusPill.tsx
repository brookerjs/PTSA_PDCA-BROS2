import type { WorkstreamStatus } from '../types';

interface Props {
  status: WorkstreamStatus | 'all';
  label: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
}

const DOT_COLORS: Record<WorkstreamStatus | 'all', string> = {
  all: 'bg-gray-400',
  ok: 'bg-pastille-ok',
  att: 'bg-pastille-att',
  blk: 'bg-pastille-blk',
};

export default function StatusPill({ status, label, count, isSelected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        isSelected
          ? 'bg-navy text-white'
          : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${DOT_COLORS[status]}`} />
      {label}
      <span className={isSelected ? 'text-white/60' : 'text-gray-400'}>{count}</span>
    </button>
  );
}
