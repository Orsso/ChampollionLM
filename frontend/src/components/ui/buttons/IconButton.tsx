import { type ReactNode, forwardRef } from 'react';
import { Tooltip } from '../feedback';
import { BORDERS, SHADOWS, RADIUS, TRANSITIONS } from '../../../constants/styles';

interface IconButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  icon: ReactNode;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'default' | 'danger' | 'success' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  onClick,
  icon,
  tooltip,
  tooltipPosition = 'top',
  variant = 'default',
  size = 'md',
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}, ref) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const variantClasses = {
    default: 'bg-white border-black text-black hover:bg-orange-50',
    danger: 'bg-red-500 border-black text-white hover:bg-red-600',
    success: 'bg-green-500 border-black text-white hover:bg-green-600',
    primary: 'bg-orange-500 border-black text-white hover:bg-orange-600',
  };

  const button = (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        flex items-center justify-center
        ${RADIUS.subtle}
        ${BORDERS.normal}
        ${SHADOWS.small}
        transition-all ${TRANSITIONS.fast}
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
        disabled:hover:translate-x-0 disabled:hover:translate-y-0
        font-bold
        ${className}
      `.trim()}
      aria-label={ariaLabel || tooltip}
      type="button"
    >
      {icon}
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} position={tooltipPosition}>
        {button}
      </Tooltip>
    );
  }

  return button;
});

IconButton.displayName = 'IconButton';
