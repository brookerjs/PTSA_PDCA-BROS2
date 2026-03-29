import type { Workstream } from '../types';
import { PASTILLE_COLORS } from '../types';

interface Props {
  workstream: Workstream;
  isSelected: boolean;
  isDirty: boolean;
  onClick: () => void;
}

export default function WorkstreamRow({ workstream, isSelected, isDirty, onClick }: Props) {
  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer border-b border-gray-100 transition-colors ${
        isSelected ? 'bg-light-blue' : 'hover:bg-gray-50'
      }`}
    >
      <td className="px-3 py-2.5 text-xs text-gray-400 w-10">
        <div className="flex items-center gap-1.5">
          {isDirty && (
            <span className="w-1.5 h-1.5 rounded-full bg-pastille-att flex-shrink-0" />
          )}
          {workstream.ws_number}
        </div>
      </td>
      <td className="px-3 py-2.5 text-sm text-gray-800">{workstream.title}</td>
      <td className="px-3 py-2.5 text-xs text-gray-500">{workstream.member_code}</td>
      <td className="px-3 py-2.5">
        <span
          className="w-3 h-3 rounded-full inline-block"
          style={{ backgroundColor: PASTILLE_COLORS[workstream.status] }}
        />
      </td>
      <td className="px-3 py-2.5 text-xs text-gray-500">{workstream.echeance}</td>
    </tr>
  );
}
