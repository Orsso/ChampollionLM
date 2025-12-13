import React from 'react';
import { BORDERS, RADIUS, TRANSITIONS } from '../../../constants/styles';

/**
 * LightButton Component
 * 
 * A lightweight button with minimal styling, intended for panel toggles,
 * small tools, and secondary actions where the main Button component is too heavy.
 * 
 * Style: Thin border, white background, orange-200 hover, no hard shadow offset.
 */

interface LightButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    active?: boolean;
}

export const LightButton = React.forwardRef<HTMLButtonElement, LightButtonProps>(({
    children,
    className = '',
    active = false,
    type = 'button',
    ...props
}, ref) => {
    return (
        <button
            ref={ref}
            type={type}
            className={`
                flex items-center justify-center
                px-2 py-1
                text-xs font-medium text-black
                bg-white
                ${BORDERS.thin} border-black
                ${RADIUS.subtle}
                transition-colors ${TRANSITIONS.fast}
                hover:bg-orange-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white
                ${active ? 'bg-orange-200' : ''}
                ${className}
            `}
            {...props}
        >
            {children}
        </button>
    );
});

LightButton.displayName = 'LightButton';
