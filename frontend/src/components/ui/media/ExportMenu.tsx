import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { TRANSITIONS, BRUTAL_BORDERS, BRUTAL_SHADOWS, BRUTAL_RADIUS } from '../../../constants/styles';
import { Tooltip } from '../feedback';

export interface ExportOption {
  label: string;
  onClick: () => void;
  bgColor: string; // Couleur de fond (e.g., '#3b82f6')
}

interface ExportMenuProps {
  options: ExportOption[];
  className?: string;
}

/**
 * ExportMenu Component
 *
 * Dropdown menu for export options with Neo-Brutalist styling.
 *
 * Features:
 * - Thick borders and hard shadows on container
 * - Bold separators between items
 * - Press-down effect on hover (reduced shadow)
 * - Saturated color backgrounds
 * - Simplified GSAP animations (snap effect)
 */
export function ExportMenu({ options, className = '' }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    // Simplified brutal animations - snap effect
    const ease = 'power2.out';

    if (isOpen) {
      // Open menu with snap effect
      gsap.set(menu, { visibility: 'visible' });
      gsap.fromTo(
        menu,
        { opacity: 0, y: -8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.2,
          ease,
        }
      );

      // Snap items in quickly
      itemsRef.current.forEach((item, index) => {
        if (item) {
          gsap.fromTo(
            item,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.15,
              delay: index * 0.02,
              ease,
            }
          );
        }
      });
    } else {
      // Close menu with snap effect
      gsap.to(menu, {
        opacity: 0,
        y: -8,
        duration: 0.15,
        ease,
        onComplete: () => {
          gsap.set(menu, { visibility: 'hidden' });
        },
      });
    }
  }, [isOpen]);

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: ExportOption) => {
    option.onClick();
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Export button - Brutal style */}
      <Tooltip content="Exporter le document">
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className={`h-10 w-10 flex items-center justify-center bg-white border-black text-black hover:bg-orange-50 ${BRUTAL_RADIUS.subtle} ${BRUTAL_BORDERS.normal} ${BRUTAL_SHADOWS.small} transition-all ${TRANSITIONS.fast} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-bold`}
          aria-label="Exporter le document"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </Tooltip>

      {/* Dropdown menu - Brutal style with thick borders */}
      <div
        ref={menuRef}
        className={`absolute right-0 top-full mt-2 bg-white ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_SHADOWS.large} overflow-hidden z-50`}
        style={{ visibility: 'hidden', minWidth: '160px' }}
      >
        <div>
          {options.map((option, index) => {
            const isNotLast = index < options.length - 1;

            return (
              <button
                key={index}
                ref={(el) => {
                  itemsRef.current[index] = el;
                }}
                onClick={() => handleOptionClick(option)}
                className={`w-full px-4 py-3 text-left text-sm font-bold flex items-center gap-3 text-white relative group transition-all ${TRANSITIONS.fast} ${isNotLast ? `${BRUTAL_BORDERS.thin} border-b-black` : ''
                  } hover:translate-x-[2px] hover:translate-y-[2px]`}
                style={{
                  backgroundColor: option.bgColor,
                }}
              >
                {/* Hover effect - press-down visual */}
                <span className={`absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity ${TRANSITIONS.fast}`} />
                <span className="flex-1 relative z-10">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
