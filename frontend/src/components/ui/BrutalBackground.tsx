import { BRUTAL_BACKGROUNDS, BRUTAL_SHAPES } from '../../constants/styles';

/**
 * BrutalBackground Component
 * 
 * Reusable neo-brutalist background with geometric shapes and patterns.
 * Provides a consistent visual foundation across all pages.
 * 
 * @param variant - Background pattern: 'grid' | 'dots' | 'stripes'
 * @param showShapes - Whether to display geometric accent shapes (default: true)
 */

interface BrutalBackgroundProps {
  variant?: 'grid' | 'dots' | 'stripes';
  showShapes?: boolean;
}

export function BrutalBackground({ 
  variant = 'grid', 
  showShapes = true 
}: BrutalBackgroundProps) {
  const patternClass = BRUTAL_BACKGROUNDS[variant];
  
  return (
    <>
      {showShapes && (
        <>
          <div className={BRUTAL_SHAPES.accent} />
          <div className={BRUTAL_SHAPES.extra} />
          <div className={BRUTAL_SHAPES.dots} />
        </>
      )}
      <div className={`fixed inset-0 pointer-events-none z-0 ${patternClass}`} />
    </>
  );
}

