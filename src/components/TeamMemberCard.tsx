import { useState } from 'react';
import { Pencil } from 'lucide-react';
import type { TeamMember } from '../types';

interface Props {
  member: TeamMember;
  isSelected: boolean;
  editable?: boolean;
  onTemperatureChange?: (value: string) => void;
  onClick: () => void;
}

export default function TeamMemberCard({ member, isSelected, editable, onTemperatureChange, onClick }: Props) {
  const [editingTemp, setEditingTemp] = useState(false);
  const [tempValue, setTempValue] = useState(member.temperature);

  const handleSaveTemp = () => {
    setEditingTemp(false);
    onTemperatureChange?.(tempValue);
  };

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
      <div className="mt-1 flex items-center gap-1">
        {editingTemp ? (
          <input
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleSaveTemp}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTemp(); }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="text-[11px] text-gray-600 bg-white border border-gray-300 rounded px-1.5 py-0.5 w-full focus:outline-none focus:border-pt-blue"
            placeholder="Temperature..."
          />
        ) : (
          <>
            <p className="text-[11px] text-gray-400 flex-1">
              {member.temperature || (editable ? <span className="italic">Temperature...</span> : null)}
            </p>
            {editable && (
              <span
                onClick={(e) => { e.stopPropagation(); setEditingTemp(true); }}
                className="text-gray-300 hover:text-gray-500 cursor-pointer"
              >
                <Pencil size={10} />
              </span>
            )}
          </>
        )}
      </div>
    </button>
  );
}
