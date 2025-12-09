import type { ReactNode } from 'react';
import { BrutalBackground } from './BrutalBackground';
import { BRUTAL_BACKGROUNDS } from '../../constants/styles';

/**
 * BrutalPage Component
 * 
 * Full-page wrapper with neo-brutalist background and proper z-index layering.
 * Combines background elements with content container for consistent page structure.
 * 
 * @param children - Page content to render
 * @param variant - Background pattern variant
 * @param showShapes - Whether to show geometric shapes
 * @param className - Additional CSS classes for the container
 */

interface BrutalPageProps {
  children: ReactNode;
  variant?: 'grid' | 'dots' | 'stripes';
  showShapes?: boolean;
  className?: string;
}

export function BrutalPage({
  children,
  variant = 'grid',
  showShapes = true,
  className = ''
}: BrutalPageProps) {
  return (
    <div className={`relative min-h-screen ${BRUTAL_BACKGROUNDS.main} ${className}`}>
      <BrutalBackground variant={variant} showShapes={showShapes} />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

