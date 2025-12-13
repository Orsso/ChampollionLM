/**
 * SourceSelectionItem Component
 * Reusable source checkbox item for selection lists
 * Matches the detailed design from GenerationControls modal
 */

import { BORDERS, RADIUS, SHADOWS, TRANSITIONS } from '../../../constants/styles';
import type { SourceType } from '../../../types';

interface SourceSelectionItemProps {
    id: number;
    title: string;
    type: SourceType;
    checked: boolean;
    onChange: (checked: boolean) => void;
    subtitle?: string;
    compact?: boolean;
}

// Source type badge colors and labels
const TYPE_STYLES: Record<SourceType, { bg: string; label: string }> = {
    audio: { bg: 'bg-purple-200 text-purple-800', label: 'AUDIO' },
    youtube: { bg: 'bg-red-200 text-red-800', label: 'YOUTUBE' },
    document: { bg: 'bg-blue-200 text-blue-800', label: 'DOC' },
};

// Source type icons
const TypeIcon = ({ type, size = 18 }: { type: SourceType; size?: number }) => {
    if (type === 'audio') {
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
        );
    }
    if (type === 'youtube') {
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                <path d="m10 15 5-3-5-3z" />
            </svg>
        );
    }
    // Default: document
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );
};

export function SourceSelectionItem({
    title,
    type,
    checked,
    onChange,
    subtitle,
    compact = false,
}: SourceSelectionItemProps) {
    const typeStyle = TYPE_STYLES[type] || TYPE_STYLES.document;

    return (
        <label
            className={`
                flex items-center gap-3 cursor-pointer
                ${compact ? BORDERS.thin : BORDERS.normal}
                border-black ${RADIUS.subtle}
                ${checked ? `bg-orange-100 ${SHADOWS.small}` : 'bg-white hover:bg-slate-50'}
                ${compact ? 'p-2' : 'p-3'}
                transition-all ${TRANSITIONS.fast}
            `}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4 accent-orange-500 flex-shrink-0"
            />
            <div className="flex-shrink-0 text-black">
                <TypeIcon type={type} size={compact ? 16 : 18} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className={`font-bold text-black truncate ${compact ? 'text-xs' : 'text-sm'}`}>{title}</p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold ${BORDERS.thin} border-black ${RADIUS.subtle} ${typeStyle.bg} flex-shrink-0`}>
                        {typeStyle.label}
                    </span>
                </div>
                {subtitle && (
                    <p className="text-xs text-slate-600 truncate font-medium mt-0.5">{subtitle}</p>
                )}
            </div>
        </label>
    );
}
