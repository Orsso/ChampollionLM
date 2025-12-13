import { BORDERS, RADIUS, TRANSITIONS } from '../../../constants/styles';

/**
 * ProgressBar Component
 *
 * Progress indicator with bold borders.
 * Solid color blocks, no gradients.
 *
 * @example
 * ```tsx
 * <ProgressBar value={uploadProgress} />
 * <ProgressBar value={75} color="green" />
 * ```
 */

interface ProgressBarProps {
  value: number; // 0-100
  color?: 'orange' | 'green' | 'amber' | 'red';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  color = 'orange',
  showLabel = false,
  className = ''
}: ProgressBarProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);

  const colorClasses = {
    orange: 'bg-orange-500',
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full h-4 bg-slate-700 ${BORDERS.normal} border-black ${RADIUS.subtle} overflow-hidden`}>
        <div
          className={`h-full ${colorClasses[color]} transition-all ${TRANSITIONS.normal} ease-out`}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <p className="text-sm text-slate-300 font-bold mt-2 text-right">
          {Math.round(clampedValue)}%
        </p>
      )}
    </div>
  );
}
