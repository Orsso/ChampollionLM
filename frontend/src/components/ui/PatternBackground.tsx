import { BACKGROUNDS, SHAPES } from '../../constants/styles';

/**
 * PatternBackground Component
 * 
 * Reusable background with geometric shapes and patterns.
 * Provides a consistent visual foundation across all pages.
 * 
 * @param variant - Background pattern: 'grid' | 'dots' | 'stripes'
 * @param showShapes - Whether to display geometric accent shapes (default: true)
 */

interface PatternBackgroundProps {
  variant?: 'grid' | 'dots' | 'stripes';
  showShapes?: boolean;
}

export function PatternBackground({
  variant = 'grid',
  showShapes = true
}: PatternBackgroundProps) {
  const patternClass = BACKGROUNDS[variant];

  return (
    <>
      {showShapes && (
        <>
          <div className={SHAPES.accent} />
          <div className={SHAPES.extra} />
          <div className={SHAPES.dots} />
        </>
      )}
      <div className={`fixed inset-0 pointer-events-none z-0 ${patternClass}`} />
    </>
  );
}

// Legacy alias for backward compatibility
/** @deprecated Use PatternBackground instead */
export const BrutalBackground = PatternBackground;
