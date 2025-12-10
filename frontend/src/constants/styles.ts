/**
 * Shared Tailwind class constants for Neo-Brutalist design system
 */

/**
 * Transitions - Kept for brutal animations (button press effects, etc.)
 * Usage: Apply with transform utilities for punch effects
 */
export const TRANSITIONS = {
  fast: 'duration-200',
  normal: 'duration-300',
  slow: 'duration-500',
} as const;

/**
 * Neo-Brutalist Borders
 * Usage: Thick, bold borders that define element boundaries
 * Example: <div className={`${BRUTAL_BORDERS.normal} border-black`}>
 */
export const BRUTAL_BORDERS = {
  thin: 'border-2',
  normal: 'border-3',
  thick: 'border-4',
} as const;

/**
 * Neo-Brutalist Shadows (Hard shadows without blur)
 * Usage: Create depth through offset shadows instead of soft blur
 * Example: <div className={BRUTAL_SHADOWS.medium}>
 */
export const BRUTAL_SHADOWS = {
  small: 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
  medium: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  large: 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
  // Colored variants for emphasis
  orange: 'shadow-[4px_4px_0px_0px_rgb(249,115,22)]',
  red: 'shadow-[4px_4px_0px_0px_rgb(239,68,68)]',
  green: 'shadow-[4px_4px_0px_0px_rgb(34,197,94)]',
} as const;

/**
 * Neo-Brutalist Border Radius
 * Usage: Subtle rounding acceptable in neo-brutalism for accessibility
 * Example: <div className={BRUTAL_RADIUS.normal}>
 */
export const BRUTAL_RADIUS = {
  none: 'rounded-none',
  subtle: 'rounded',      // 4px - minimal
  normal: 'rounded-lg',   // 8px - standard
} as const;

/**
 * Neo-Brutalist Button Variants
 * Usage: Bold, high-contrast buttons with press-down effect
 * Example: <button className={BRUTAL_BUTTON_VARIANTS.primary}>Click</button>
 *
 * Behavior:
 * - Hover: Translates element to reduce shadow (press-in effect)
 * - Active: Full press-down with zero shadow
 */
export const BRUTAL_BUTTON_VARIANTS = {
  primary: 'bg-orange-500 text-white border-3 border-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold',
  secondary: 'bg-white text-black border-3 border-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold',
  danger: 'bg-red-500 text-white border-3 border-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold',
  ghost: 'bg-transparent text-black border-3 border-black hover:bg-slate-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold',
} as const;

/**
 * Neo-Brutalist Card Variants
 * Usage: Container components with bold shadows and borders
 * Example: <div className={BRUTAL_CARD_VARIANTS.default}>
 */
export const BRUTAL_CARD_VARIANTS = {
  default: 'bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black p-6',
  colored: 'bg-orange-100 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black p-6',
  dark: 'bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black',
  accent: 'bg-orange-500 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white p-6',
} as const;

/**
 * Neo-Brutalist Background Patterns
 * Usage: Apply to page containers to create cohesive backgrounds
 * Example: <div className="brutal-bg-main brutal-bg-grid">
 * 
 * Available patterns:
 * - brutal-bg-main: Soft gradient background with color orbs
 * - brutal-bg-grid: Subtle grid lines pattern
 * - brutal-bg-dots: Dot grid pattern
 * - brutal-bg-stripes: Diagonal stripes pattern
 * 
 * Geometric shapes (add as sibling divs):
 * - brutal-accent-shapes: Large geometric shapes (square, circle)
 * - brutal-shapes-extra: Additional shapes (triangle, rectangle)
 * - brutal-bg-accent-dots: Small decorative dots
 */
export const BRUTAL_BACKGROUNDS = {
  main: 'brutal-bg-main',
  grid: 'brutal-bg-grid',
  dots: 'brutal-bg-dots',
  stripes: 'brutal-bg-stripes',
} as const;

export const BRUTAL_SHAPES = {
  accent: 'brutal-accent-shapes',
  extra: 'brutal-shapes-extra',
  dots: 'brutal-bg-accent-dots',
} as const;

/**
 * Neo-Brutalist Button Base Styles
 * Standard padding and radius for all buttons
 */
export const BRUTAL_BUTTON_BASE = `px-6 py-3 ${BRUTAL_RADIUS.normal}` as const;

/**
 * Neo-Brutalist Secondary Button Style
 * Usage: Cancel buttons, secondary actions
 * Example: <button className={BRUTAL_BUTTON_SECONDARY}>Annuler</button>
 */
export const BRUTAL_BUTTON_SECONDARY = `${BRUTAL_BUTTON_BASE} ${BRUTAL_BORDERS.normal} border-black bg-white text-black hover:bg-orange-50 ${BRUTAL_SHADOWS.medium} font-bold transition-all ${TRANSITIONS.fast} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none` as const;

/**
 * Neo-Brutalist Danger Button Style
 * Usage: Logout, delete actions
 * Example: <button className={BRUTAL_BUTTON_DANGER}>Déconnexion</button>
 */
export const BRUTAL_BUTTON_DANGER = `${BRUTAL_BUTTON_BASE} ${BRUTAL_BORDERS.normal} border-black bg-white text-black hover:bg-red-500 hover:text-white ${BRUTAL_SHADOWS.medium} font-bold transition-all ${TRANSITIONS.fast} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none` as const;
