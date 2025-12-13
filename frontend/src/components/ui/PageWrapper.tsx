import type { ReactNode } from 'react';
import { PatternBackground } from './PatternBackground';
import { BACKGROUNDS } from '../../constants/styles';

/**
 * PageWrapper Component
 * 
 * Full-page wrapper with background pattern and proper z-index layering.
 * Combines background elements with content container for consistent page structure.
 * 
 * @param children - Page content to render
 * @param variant - Background pattern variant
 * @param showShapes - Whether to show geometric shapes
 * @param className - Additional CSS classes for the container
 */

interface PageWrapperProps {
  children: ReactNode;
  variant?: 'grid' | 'dots' | 'stripes';
  showShapes?: boolean;
  className?: string;
}

export function PageWrapper({
  children,
  variant = 'grid',
  showShapes = true,
  className = ''
}: PageWrapperProps) {
  return (
    <div className={`relative min-h-screen ${BACKGROUNDS.main} ${className}`}>
      <PatternBackground variant={variant} showShapes={showShapes} />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Legacy alias for backward compatibility
/** @deprecated Use PageWrapper instead */
export const BrutalPage = PageWrapper;
