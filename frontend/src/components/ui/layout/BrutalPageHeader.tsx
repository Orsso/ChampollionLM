import type { ReactNode } from 'react';
import { BRUTAL_BORDERS } from '../../../constants/styles';

/**
 * BrutalPageHeader Component
 *
 * Reusable page header with neo-brutalist styling.
 * Features bold borders, hard shadow, and optional colored background.
 *
 * @example
 * ```tsx
 * <BrutalPageHeader
 *   title="Projets"
 *   subtitle="Gérez tous vos projets Champollion"
 * />
 *
 * <BrutalPageHeader
 *   title="Paramètres"
 *   subtitle="Configurez votre compte"
 *   variant="colored"
 * />
 * ```
 */

interface BrutalPageHeaderProps {
  /** Main title text */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Header style variant */
  variant?: 'default' | 'colored' | 'accent';
  /** Subtitle style variant */
  subtitleVariant?: 'default' | 'highlight';
  /** Optional action element (buttons, links, etc.) */
  action?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function BrutalPageHeader({
  title,
  subtitle,
  variant = 'default',
  subtitleVariant = 'default',
  action,
  className = '',
}: BrutalPageHeaderProps) {
  const variantClasses = {
    default: 'bg-white',
    colored: 'bg-orange-50',
    accent: 'bg-orange-500 text-white',
  };

  const titleColorClass = variant === 'accent' ? 'text-white' : 'text-black';
  
  const subtitleClasses = subtitleVariant === 'highlight'
    ? 'text-xl font-bold text-orange-500 uppercase tracking-wide'
    : variant === 'accent'
    ? 'text-lg font-medium text-white/90'
    : 'text-lg font-medium text-gray-600';

  return (
    <div
      className={`relative mb-8 -mx-4 px-6 py-5 ${variantClasses[variant]} ${BRUTAL_BORDERS.thick} border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${className}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className={`text-5xl font-bold ${titleColorClass} mb-1 tracking-tight`}>
            {title}
          </h1>
          {subtitle && (
            <p className={`${subtitleClasses} mt-2`}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="ml-4 flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

