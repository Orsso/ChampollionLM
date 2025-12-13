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
 * Button Variants
 * Usage: Bold, high-contrast buttons with press-down effect
 * Example: <button className={BUTTON_VARIANTS.primary}>Click</button>
 *
 * Behavior:
 * - Hover: Translates element to reduce shadow (press-in effect)
 * - Active: Full press-down with zero shadow
 */
export const BUTTON_VARIANTS = {
  primary: 'bg-orange-500 text-white border-3 border-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold',
  secondary: 'bg-white text-black border-3 border-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold',
  danger: 'bg-red-500 text-white border-3 border-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold',
  ghost: 'bg-transparent text-black border-3 border-black hover:bg-slate-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold',
} as const;

/**
 * Card Variants
 * Usage: Container components with bold shadows and borders
 * Example: <div className={CARD_VARIANTS.default}>
 */
export const CARD_VARIANTS = {
  default: 'bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black p-6',
  colored: 'bg-orange-100 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black p-6',
  dark: 'bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black',
  accent: 'bg-orange-500 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white p-6',
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

/**
 * Button Base Styles
 * Standard padding and radius for all buttons
 */
export const BUTTON_BASE = `px-6 py-3 ${RADIUS.normal}` as const;

/**
 * Secondary Button Style
 * Usage: Cancel buttons, secondary actions
 * Example: <button className={BUTTON_SECONDARY}>Annuler</button>
 */
export const BUTTON_SECONDARY = `${BUTTON_BASE} ${BORDERS.normal} border-black bg-white text-black hover:bg-orange-50 ${SHADOWS.medium} font-bold transition-all ${TRANSITIONS.fast} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none` as const;

/**
 * Danger Button Style
 * Usage: Logout, delete actions
 * Example: <button className={BUTTON_DANGER}>Déconnexion</button>
 */
export const BUTTON_DANGER = `${BUTTON_BASE} ${BORDERS.normal} border-black bg-white text-black hover:bg-red-500 hover:text-white ${SHADOWS.medium} font-bold transition-all ${TRANSITIONS.fast} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none` as const;

// Legacy aliases for backward compatibility (deprecated, will be removed)
/** @deprecated Use BORDERS instead */
export const BRUTAL_BORDERS = BORDERS;
/** @deprecated Use SHADOWS instead */
export const BRUTAL_SHADOWS = SHADOWS;
/** @deprecated Use RADIUS instead */
export const BRUTAL_RADIUS = RADIUS;
/** @deprecated Use BUTTON_VARIANTS instead */
export const BRUTAL_BUTTON_VARIANTS = BUTTON_VARIANTS;
/** @deprecated Use CARD_VARIANTS instead */
export const BRUTAL_CARD_VARIANTS = CARD_VARIANTS;
/** @deprecated Use BACKGROUNDS instead */
export const BRUTAL_BACKGROUNDS = BACKGROUNDS;
/** @deprecated Use SHAPES instead */
export const BRUTAL_SHAPES = SHAPES;
/** @deprecated Use BUTTON_BASE instead */
export const BRUTAL_BUTTON_BASE = BUTTON_BASE;
/** @deprecated Use BUTTON_SECONDARY instead */
export const BRUTAL_BUTTON_SECONDARY = BUTTON_SECONDARY;
/** @deprecated Use BUTTON_DANGER instead */
export const BRUTAL_BUTTON_DANGER = BUTTON_DANGER;
