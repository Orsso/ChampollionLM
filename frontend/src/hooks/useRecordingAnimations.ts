import { useRef } from 'react';
import { gsap } from 'gsap';

export interface AnimConfig {
  ease: string;
  dur: number; // base duration in seconds
  gap: number; // vertical gap under the container
}

export interface AnimRefs {
  recordBtn: React.RefObject<HTMLButtonElement>;
  importBtn: React.RefObject<HTMLButtonElement>;
  container: React.RefObject<HTMLDivElement>;
  spacer: React.RefObject<HTMLDivElement>;
  ghost: React.RefObject<HTMLDivElement>;
}

export function useRecordingAnimations(config: AnimConfig) {
  const refs = useRef<AnimRefs | null>(null);
  const importHomeRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 });
  const isRecordWidthLocked = useRef<boolean>(false);

  const setupRefs = (r: AnimRefs) => {
    refs.current = r;
  };

  const killAll = () => {
    const r = refs.current;
    if (!r) return;
    const list: (HTMLElement | null | undefined)[] = [
      r.recordBtn.current,
      r.importBtn.current,
      r.container.current,
      r.spacer.current,
      r.ghost.current,
    ];
    list.forEach((el) => el && gsap.killTweensOf(el));
  };

  const lockRecordWidth = () => {
    const r = refs.current;
    if (!r?.recordBtn.current) return;
    const rect = r.recordBtn.current.getBoundingClientRect();
    gsap.set(r.recordBtn.current, { width: rect.width, flex: '0 0 auto' });
    isRecordWidthLocked.current = true;
  };

  const unlockRecordWidth = () => {
    const r = refs.current;
    if (!r?.recordBtn.current) return;
    gsap.set(r.recordBtn.current, { width: 'auto', flex: '' });
    isRecordWidthLocked.current = false;
  };

  const showGhostForImport = () => {
    const r = refs.current;
    if (!r?.importBtn.current || !r.ghost.current) return;
    const br = r.importBtn.current.getBoundingClientRect();
    Object.assign(r.ghost.current.style, {
      display: 'block',
      width: `${br.width}px`,
      height: `${br.height}px`,
    });
  };

  const hideGhost = () => {
    const r = refs.current;
    if (!r?.ghost.current) return;
    Object.assign(r.ghost.current.style, {
      display: 'none',
      width: '0px',
      height: '0px',
    });
  };

  const toRecording = () => {
    const r = refs.current;
    if (!r || !r.recordBtn.current || !r.importBtn.current || !r.container.current) return;

    killAll();

    // Fade out record button a bit to emphasize container
    gsap.to(r.recordBtn.current, {
      opacity: 0,
      scale: 0.95,
      duration: config.dur * 0.5,
      ease: 'power2.in',
    });

    // Bring container into view
    gsap.to(r.container.current, {
      opacity: 1,
      scale: 1,
      duration: config.dur * 0.8,
      delay: config.dur * 0.2,
      ease: config.ease,
      onStart: () => {
        if (r.container.current) {
          r.container.current.style.pointerEvents = 'auto';
        }
        // Lock record width to avoid flex reflow
        lockRecordWidth();
        // Save import home position
        const parent = r.importBtn.current?.parentElement?.getBoundingClientRect();
        const br = r.importBtn.current?.getBoundingClientRect();
        if (parent && br) {
          importHomeRef.current = { left: br.left - parent.left, top: br.top - parent.top };
        }
      },
    });

    // Switch import to absolute, starting from its current visual position
    requestAnimationFrame(() => {
      const parentRect = r.importBtn.current?.parentElement?.getBoundingClientRect();
      const br = r.importBtn.current?.getBoundingClientRect();
      if (!parentRect || !br || !r.importBtn.current || !r.container.current) return;

      const startLeft = br.left - parentRect.left;
      const startTop = br.top - parentRect.top;

      gsap.set(r.importBtn.current, {
        position: 'absolute',
        left: startLeft,
        top: startTop,
        width: br.width,
        height: br.height,
        xPercent: 0,
        zIndex: 10,
      });
      showGhostForImport();

      const targetY = r.container.current.offsetHeight + config.gap;

      gsap.to(r.importBtn.current, {
        top: targetY,
        left: '50%',
        xPercent: -50,
        duration: config.dur * 0.8,
        ease: config.ease,
      });

      if (r.spacer.current) {
        gsap.to(r.spacer.current, {
          height: targetY,
          duration: config.dur * 0.8,
          ease: config.ease,
        });
      }
    });
  };

  const toIdle = () => {
    const r = refs.current;
    if (!r || !r.importBtn.current) return;

    killAll();

    // Softly hide container
    if (r.container.current) {
      gsap.to(r.container.current, {
        opacity: 0,
        scale: 0.98,
        y: 10,
        duration: config.dur * 0.6,
        ease: 'power2.in',
        onComplete: () => {
          if (r.container.current) {
            r.container.current.style.pointerEvents = 'none';
          }
          gsap.set(r.container.current, { y: 0 });
        },
      });
    }

    // Fade record button back in
    if (r.recordBtn.current) {
      gsap.to(r.recordBtn.current, {
        opacity: 1,
        scale: 1,
        duration: config.dur * 0.6,
        ease: config.ease,
      });
    }

    // Dock import back to its home position, then restore flow
    const home = importHomeRef.current;
    gsap.to(r.importBtn.current, {
      top: home.top,
      left: home.left,
      xPercent: 0,
      duration: config.dur * 0.8,
      ease: config.ease,
      onComplete: () => {
        if (r.importBtn.current) {
          gsap.set(r.importBtn.current, {
            position: 'relative',
            top: 'auto',
            left: 'auto',
            width: 'auto',
            height: 'auto',
            zIndex: 'auto',
          });
        }
        // Collapse spacer only after docking to avoid vertical race conditions
        if (r.spacer.current) {
          gsap.to(r.spacer.current, {
            height: 0,
            duration: config.dur * 0.6,
            ease: config.ease,
          });
        }
        hideGhost();
        if (isRecordWidthLocked.current) unlockRecordWidth();
      },
    });
  };

  return { setupRefs, toRecording, toIdle };
}
