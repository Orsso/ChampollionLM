import React from 'react';

/**
 * ShinyText Component
 *
 * Animated text with a bold gradient effect that moves across the text.
 * Neo-brutalist take on animated text - bold font with vibrant gradient.
 * Perfect for loading states and AI generation indicators.
 *
 * @example
 * ```tsx
 * <ShinyText>Traitement...</ShinyText>
 * <ShinyText size="sm">Génération...</ShinyText>
 * <ShinyText size="lg">En cours...</ShinyText>
 * ```
 */

interface ShinyTextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function ShinyText({
  children,
  size = 'md',
  className = ''
}: ShinyTextProps) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <span
      className={`
        inline-block
        ${sizeClasses[size]}
        ${className}
        font-bold
        bg-[linear-gradient(90deg,#000000_0%,#ffffff_25%,#000000_50%,#ffffff_75%,#000000_100%)]
        bg-[length:200%_100%]
        animate-shiny-text
        [-webkit-background-clip:text]
        [background-clip:text]
        [-webkit-text-fill-color:transparent]
        [text-fill-color:transparent]
      `}
    >
      {children}
    </span>
  );
}

