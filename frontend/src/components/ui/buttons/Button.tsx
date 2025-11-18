import React from 'react';
import { 
  BRUTAL_BUTTON_BASE, 
  BRUTAL_BUTTON_SECONDARY, 
  BRUTAL_BUTTON_DANGER,
  BRUTAL_BUTTON_VARIANTS,
  BRUTAL_SHADOWS
} from '../../../constants/styles';

/**
 * Button Component
 *
 * Unified button component with consistent Neo-Brutalist styling.
 * Single source of truth for all button styles in the application.
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleSubmit}>
 *   Enregistrer
 * </Button>
 * <Button variant="secondary" onClick={handleCancel}>
 *   Annuler
 * </Button>
 * <Button variant="danger" onClick={handleLogout}>
 *   Déconnexion
 * </Button>
 * ```
 */

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = ''
}: ButtonProps) {
  // Use predefined constants for secondary and danger variants
  let buttonClasses = '';
  
  if (variant === 'secondary') {
    buttonClasses = BRUTAL_BUTTON_SECONDARY;
  } else if (variant === 'danger') {
    buttonClasses = BRUTAL_BUTTON_DANGER;
  } else {
    // For primary and ghost, use BRUTAL_BUTTON_VARIANTS
    const variantClasses = BRUTAL_BUTTON_VARIANTS[variant];
    buttonClasses = `${BRUTAL_BUTTON_BASE} ${BRUTAL_SHADOWS.medium} ${variantClasses}`;
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${buttonClasses} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 ${className}`}
    >
      {children}
    </button>
  );
}

