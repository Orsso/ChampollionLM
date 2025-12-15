import React from 'react';
import {
  SHADOWS,
  BORDERS,
  RADIUS,
  TRANSITIONS
} from '../../../constants/styles';

/**
 * Button Component
 *
 * Unified button component with consistent styling.
 * Single source of truth for all button styles in the application.
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleSubmit}>
 *   Enregistrer
 * </Button>
 * <Button variant="secondary" size="sm" onClick={handleCancel}>
 *   Annuler
 * </Button>
 * ```
 */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  onClick,
  variant = 'primary',
  size = 'lg',
  active = false,
  type = 'button',
  disabled = false,
  className = '',
  ...props
}, ref) => {

  // Base structural styles
  const baseStyles = `${RADIUS.normal} ${BORDERS.normal} border-black font-bold transition-all ${TRANSITIONS.fast} flex items-center justify-center gap-2`;

  // Size styles
  const sizeStyles = SIZES[size];

  // Variant styles (with active press effect for all states)
  // Active buttons are already at 2px offset, so they press to 4px (additional 2px)
  // Non-active buttons press from 0 to 4px
  const activePressNormal = 'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none';
  const activePressFromActive = 'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none';
  let variantStyles = '';

  switch (variant) {
    case 'primary':
      if (active) {
        variantStyles = `bg-orange-500 text-white translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${activePressFromActive}`;
      } else {
        variantStyles = `bg-orange-500 text-white hover:bg-orange-600 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${SHADOWS.medium} ${activePressNormal}`;
      }
      break;
    case 'secondary':
      if (active) {
        variantStyles = `bg-orange-500 text-white translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${activePressFromActive}`;
      } else {
        variantStyles = `bg-white text-black hover:bg-orange-50 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${SHADOWS.medium} ${activePressNormal}`;
      }
      break;
    case 'danger':
      variantStyles = `bg-white text-black hover:bg-red-500 hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${SHADOWS.medium} ${activePressNormal}`;
      break;
    case 'ghost':
      if (active) {
        variantStyles = `bg-slate-100 translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-black ${activePressFromActive}`;
      } else {
        variantStyles = `bg-transparent text-black hover:bg-slate-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-transparent hover:border-black ${activePressNormal}`;
      }
      break;
  }

  // Active state overrides (if generic active behavior is needed beyond variants)
  if (active && variant !== 'primary' && variant !== 'ghost') {
    // General active override if not handled above
  }

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${sizeStyles}
        ${variantStyles}
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
