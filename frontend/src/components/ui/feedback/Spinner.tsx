/**
 * Spinner Component
 *
 * Loading spinner with thick borders and bold styling.
 * Geometric rotation animation with saturated colors.
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="sm" />
 * <Spinner size="lg" color="orange" />
 * ```
 */

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function Spinner({
  size = 'md',
  color = 'orange',
  className = ''
}: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-[3px]',
    md: 'w-8 h-8 border-[4px]',
    lg: 'w-12 h-12 border-[5px]',
  };

  const colorClasses = {
    orange: 'border-orange-500 border-t-black',
    green: 'border-green-500 border-t-black',
    red: 'border-red-500 border-t-black',
    gray: 'border-slate-400 border-t-black',
  };

  const colorClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.orange;

  return (
    <div
      className={`${sizeClasses[size]} ${colorClass} rounded-none animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

