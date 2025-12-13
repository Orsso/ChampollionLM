import React, { type ReactNode } from 'react';
import { RADIUS, TRANSITIONS } from '../../../constants/styles';

/**
 * Card Variants
 * Usage: Container components with bold shadows and borders
 */
const CARD_VARIANTS = {
    default: 'bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black p-6',
    colored: 'bg-orange-100 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black p-6',
    dark: 'bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black',
    accent: 'bg-orange-500 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white p-6',
} as const;

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    variant?: keyof typeof CARD_VARIANTS;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
    hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
    children,
    variant = 'default',
    className = '',
    onClick,
    hoverEffect = false,
    ...props
}, ref) => {
    const baseStyles = CARD_VARIANTS[variant];
    const radiusStyles = RADIUS.normal; // Default radius for cards

    // Interactive styles for clickable cards
    const interactiveStyles = (onClick || hoverEffect)
        ? `cursor-pointer transition-all ${TRANSITIONS.fast} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none`
        : '';

    return (
        <div
            ref={ref}
            onClick={onClick}
            className={`
        ${baseStyles}
        ${radiusStyles}
        ${interactiveStyles}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
});

Card.displayName = 'Card';
