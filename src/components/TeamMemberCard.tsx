import type { TeamMember } from '../types';

interface Props {
  member: TeamMember;
  isSelected: boolean;
  onClick: () => void;
}

export default function TeamMemberCard({ member, isSelected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
        isSelected
          ? 'bg-light-blue border-pt-blue/30'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-navy">{member.code}</span>
        <span className="text-xs text-gray-400">{member.name}</span>
      </div>
      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{member.role}</p>
      <p className="text-[11px] text-gray-400 mt-1">{member.temperature}</p>
    </button>
  );
}
