/**
 * Shared Tailwind class constants for the design system
 */

/**
 * Transitions - For smooth animations (button press effects, etc.)
 * Usage: Apply with transform utilities for punch effects
 */
export const TRANSITIONS = {
  fast: 'duration-200',
  normal: 'duration-300',
  slow: 'duration-500',
} as const;

/**
 * Border styles
 * Usage: Thick, bold borders that define element boundaries
 * Example: <div className={`${BORDERS.normal} border-black`}>
 */
export const BORDERS = {
  thin: 'border-2',
  normal: 'border-3',
  thick: 'border-4',
} as const;

/**
 * Hard Shadows (without blur)
 * Usage: Create depth through offset shadows instead of soft blur
 * Example: <div className={SHADOWS.medium}>
 */
export const SHADOWS = {
  small: 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
  medium: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  large: 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
  // Colored variants for emphasis
  orange: 'shadow-[4px_4px_0px_0px_rgb(249,115,22)]',
  red: 'shadow-[4px_4px_0px_0px_rgb(239,68,68)]',
  green: 'shadow-[4px_4px_0px_0px_rgb(34,197,94)]',
} as const;

/**
 * Border Radius
 * Usage: Subtle rounding for accessibility
 * Example: <div className={RADIUS.normal}>
 */
export const RADIUS = {
  none: 'rounded-none',
  subtle: 'rounded',      // 4px - minimal
  normal: 'rounded-lg',   // 8px - standard
} as const;





/**
 * Background Patterns
 * Usage: Apply to page containers to create cohesive backgrounds
 * Example: <div className="bg-main bg-pattern-grid">
 * 
 * Available patterns:
 * - bg-main: Soft gradient background with color orbs
 * - bg-pattern-grid: Subtle grid lines pattern
 * - bg-pattern-dots: Dot grid pattern
 * - bg-pattern-stripes: Diagonal stripes pattern
 * 
 * Geometric shapes (add as sibling divs):
 * - accent-shapes: Large geometric shapes (square, circle)
 * - shapes-extra: Additional shapes (triangle, rectangle)
 * - accent-dots: Small decorative dots
 */
export const BACKGROUNDS = {
  main: 'bg-main',
  grid: 'bg-pattern-grid',
  dots: 'bg-pattern-dots',
  stripes: 'bg-pattern-stripes',
} as const;

export const SHAPES = {
  accent: 'accent-shapes',
  extra: 'shapes-extra',
  dots: 'accent-dots',
} as const;


