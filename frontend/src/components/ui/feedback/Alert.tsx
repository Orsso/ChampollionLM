import type { ReactNode } from 'react';
import { BRUTAL_BORDERS, BRUTAL_SHADOWS, BRUTAL_RADIUS } from '../../../constants/styles';

/**
 * Alert Component
 *
 * Neo-brutalist alert component for displaying error, success, warning, and info messages.
 * Opaque backgrounds with colored borders and hard shadows.
 *
 * @example
 * ```tsx
 * <Alert variant="error" message="Something went wrong" />
 * <Alert variant="success">Operation completed</Alert>
 * ```
 */

interface AlertProps {
  variant: 'error' | 'success' | 'warning' | 'info';
  message?: string;
  children?: ReactNode;
  className?: string;
}

const variantStyles = {
  error: {
    container: 'bg-red-100 border-red-500',
    text: 'text-red-900',
    shadow: BRUTAL_SHADOWS.red,
  },
  success: {
    container: 'bg-green-100 border-green-500',
    text: 'text-green-900',
    shadow: BRUTAL_SHADOWS.green,
  },
  warning: {
    container: 'bg-amber-100 border-amber-500',
    text: 'text-amber-900',
    shadow: 'shadow-[4px_4px_0px_0px_rgb(245,158,11)]',
  },
  info: {
    container: 'bg-cyan-100 border-cyan-500',
    text: 'text-cyan-900',
    shadow: 'shadow-[4px_4px_0px_0px_rgb(6,182,212)]',
  },
};

export function Alert({ variant, message, children, className = '' }: AlertProps) {
  const styles = variantStyles[variant];
  const content = message || children;

  if (!content) return null;

  return (
    <div className={`p-3 ${styles.container} ${BRUTAL_BORDERS.normal} ${BRUTAL_RADIUS.normal} ${styles.shadow} ${className}`}>
      <p className={`${styles.text} text-sm font-bold`}>{content}</p>
    </div>
  );
}
