import React from 'react';
import { BRUTAL_BORDERS, BRUTAL_SHADOWS, BRUTAL_RADIUS, TRANSITIONS } from '../../../constants/styles';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
  icon?: React.ReactNode;
  title?: string;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  label,
  icon = '+',
  title,
  className = '',
}: FloatingActionButtonProps) {
  const accessibleLabel = title || label || 'Action';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 z-40 inline-flex items-center gap-3 ${BRUTAL_RADIUS.normal} bg-orange-500 hover:bg-orange-600 text-white ${BRUTAL_BORDERS.thick} border-black ${BRUTAL_SHADOWS.large} px-5 py-4 transition-all ${TRANSITIONS.fast} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 font-bold ${className}`}
      aria-label={accessibleLabel}
      title={accessibleLabel}
    >
      <span className="text-3xl leading-none">{icon}</span>
      {label && label.trim().length > 0 && (
        <span className="hidden md:inline text-sm font-bold tracking-wide uppercase">
          {label}
        </span>
      )}
    </button>
  );
}


