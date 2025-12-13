import React from 'react';
import { BORDERS, RADIUS } from '../../../constants/styles';

/**
 * Badge Component
 *
 * Status badge with color variants for different states.
 * Opaque backgrounds with bold borders and saturated colors.
 *
 * @example
 * ```tsx
 * <Badge color="green">Prêt</Badge>
 * <Badge color="amber">En cours</Badge>
 * <Badge color="red">Erreur</Badge>
 * <Badge color="gray">Brouillon</Badge>
 * ```
 */

interface BadgeProps {
  children: React.ReactNode;
  color?: 'green' | 'amber' | 'red' | 'gray' | 'cyan' | 'purple';
  className?: string;
}

export function Badge({
  children,
  color = 'gray',
  className = ''
}: BadgeProps) {
  const colorClasses = {
    green: 'bg-green-400 text-green-900 border-black',
    amber: 'bg-amber-400 text-amber-900 border-black',
    red: 'bg-red-400 text-red-900 border-black',
    gray: 'bg-slate-300 text-slate-900 border-slate-600',
    cyan: 'bg-cyan-200 text-cyan-800 border-black',
    purple: 'bg-purple-200 text-purple-800 border-black',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 ${RADIUS.subtle} text-xs font-bold uppercase tracking-wide ${BORDERS.thin} ${colorClasses[color]} ${className}`}>
      {children}
    </span>
  );
}
