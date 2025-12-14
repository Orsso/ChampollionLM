import { BORDERS, SHADOWS } from '../../../constants/styles';

interface PageLoaderProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Full-page loading indicator with morphing animation.
 * Designed for page transitions and authentication loading states.
 */
export function PageLoader({ size = 'md', className = '' }: PageLoaderProps) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
    };

    return (
        <div className={className} role="status" aria-label="Chargement">
            <div
                className={`
          ${sizeClasses[size]}
          bg-orange-500
          ${BORDERS.thick} border-black
          ${SHADOWS.medium}
          animate-page-loader
        `}
            />
        </div>
    );
}
