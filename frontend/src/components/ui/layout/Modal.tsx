import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { CARD_VARIANTS, BORDERS, RADIUS, TRANSITIONS } from '../../../constants/styles';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-md', 'max-w-3xl'
}

export function Modal({ isOpen, onClose, title, headerRight, children, footer, maxWidth = 'max-w-5xl' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overlayRef.current || !modalRef.current) return;

    if (isOpen) {
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.2, ease: 'power2.out' });
      gsap.fromTo(modalRef.current, { opacity: 0, scale: 0.95, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in' });
      gsap.to(modalRef.current, { opacity: 0, scale: 0.95, y: 20, duration: 0.2, ease: 'power2.in' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 opacity-0 px-4 pt-20" onClick={handleOverlayClick}>
      <div ref={modalRef} className={`relative w-full ${maxWidth} max-h-[calc(95vh-5rem)] ${CARD_VARIANTS.dark} ${RADIUS.normal} overflow-hidden opacity-0`}>
        <div className={`flex items-center justify-between p-6 ${BORDERS.normal} border-b-black bg-orange-50`}>
          <div className="flex items-center gap-3">
            {typeof title === 'string' ? (
              <h2 className="text-lg font-bold text-black">{title}</h2>
            ) : (
              title
            )}
          </div>
          <div className="flex items-center gap-2">
            {headerRight}
            <button
              onClick={onClose}
              className={`p-2 ${RADIUS.normal} text-black hover:text-orange-600 hover:bg-orange-100 ${BORDERS.thin} border-transparent hover:border-black transition-all ${TRANSITIONS.fast}`}
              aria-label="Fermer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-12rem)] bg-white">{children}</div>
        {footer && <div className={`p-4 ${BORDERS.normal} border-t-black bg-orange-50`}>{footer}</div>}
      </div>
    </div>
  );
}
