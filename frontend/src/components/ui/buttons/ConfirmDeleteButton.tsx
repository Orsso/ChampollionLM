import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { BRUTAL_BORDERS, BRUTAL_SHADOWS, BRUTAL_RADIUS, TRANSITIONS } from '../../../constants/styles';

/**
 * ConfirmDeleteButton Component
 *
 * Neo-brutalist button with two-step confirmation for delete actions.
 * Uses GSAP animation to expand and show "Confirmer ?" text.
 * Bold borders and hard red shadow on confirm state.
 *
 * @example
 * ```tsx
 * <ConfirmDeleteButton
 *   isConfirming={confirmingDelete}
 *   onDelete={() => handleDelete(id)}
 *   ariaLabel="Supprimer l'élément"
 * />
 * ```
 */

interface ConfirmDeleteButtonProps {
  isConfirming: boolean;
  onDelete: () => void;
  ariaLabel: string;
  className?: string;
}

export function ConfirmDeleteButton({
  isConfirming,
  onDelete,
  ariaLabel,
  className = '',
}: ConfirmDeleteButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!buttonRef.current || !iconRef.current || !textRef.current) return;

    const ease = 'power3.out';

    if (isConfirming) {
      gsap.to(buttonRef.current, {
        width: 120,
        paddingLeft: 16,
        paddingRight: 16,
        duration: 0.3,
        ease
      });
      gsap.to(iconRef.current, {
        opacity: 0,
        scale: 0.5,
        duration: 0.2,
        ease
      });
      gsap.to(textRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        delay: 0.1,
        ease
      });
    } else {
      gsap.to(textRef.current, {
        opacity: 0,
        scale: 0.5,
        duration: 0.2,
        ease
      });
      gsap.to(iconRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        delay: 0.1,
        ease
      });
      gsap.to(buttonRef.current, {
        width: 40,
        paddingLeft: 8,
        paddingRight: 8,
        duration: 0.3,
        delay: 0.15,
        ease
      });
    }
  }, [isConfirming]);

  return (
    <button
      ref={buttonRef}
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      className={`relative h-10 flex items-center justify-center text-sm font-bold ${BRUTAL_RADIUS.subtle} ${BRUTAL_BORDERS.normal} transition-all ${TRANSITIONS.fast} flex-shrink-0 overflow-hidden ${
        isConfirming
          ? `bg-red-500 hover:bg-red-600 text-white border-black ${BRUTAL_SHADOWS.red} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgb(239,68,68)]`
          : `bg-white hover:bg-orange-50 text-black border-black ${BRUTAL_SHADOWS.small} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`
      } ${className}`}
      style={{ width: 40 }}
      aria-label={ariaLabel}
    >
      <span ref={iconRef} className="absolute inset-0 flex items-center justify-center">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      </span>

      <span ref={textRef} className="absolute inset-0 flex items-center justify-center whitespace-nowrap opacity-0 font-bold">
        Confirmer ?
      </span>
    </button>
  );
}
