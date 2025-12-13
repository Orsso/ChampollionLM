import type { ReactNode } from 'react';
import { BORDERS, RADIUS, SHADOWS } from '../../../constants/styles';
import { LightButton } from '../buttons';

// Icons
const ChevronLeftIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

interface SlidingPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    side: 'left' | 'right';
    title: string;
    headerActions?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function SlidingPanel({ isOpen, onToggle, side, title, headerActions, children, className = '' }: SlidingPanelProps) {
    const isLeft = side === 'left';

    return (
        <div
            className={`
                flex-shrink-0 h-full overflow-hidden
                transition-all duration-300 ease-out
                ${isOpen ? 'w-64' : 'w-0'}
                ${className}
            `}
        >
            <div
                className={`
                    w-64 h-full flex flex-col
                    ${BORDERS.normal} border-black ${RADIUS.normal}
                    bg-white ${SHADOWS.medium}
                    transition-transform duration-300 ease-out
                    ${isOpen ? 'translate-x-0' : isLeft ? '-translate-x-full' : 'translate-x-full'}
                `}
            >
                <div className={`p-3 ${BORDERS.normal} border-t-0 border-x-0 border-black bg-orange-100 flex-shrink-0`}>
                    <div className="flex items-center justify-between gap-2">
                        {isLeft && (
                            <LightButton
                                onClick={onToggle}
                                className="p-1.5"
                                title="Masquer"
                            >
                                <ChevronLeftIcon />
                            </LightButton>
                        )}
                        <h4 className="font-black text-sm uppercase tracking-wide text-black flex-1">{title}</h4>
                        {headerActions}
                        {!isLeft && (
                            <LightButton
                                onClick={onToggle}
                                className="p-1.5"
                                title="Masquer"
                            >
                                <ChevronRightIcon />
                            </LightButton>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {children}
                </div>
            </div>
        </div>
    );
}
