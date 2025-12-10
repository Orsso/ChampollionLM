/**
 * TextType Component
 * Typing animation effect with GSAP cursor blink
 * One-shot animation (no deletion/loop) for title reveals
 */

import { useEffect, useRef, useState, type ElementType, createElement } from 'react';
import { gsap } from 'gsap';
import './TextType.css';

interface TextTypeProps extends React.HTMLAttributes<HTMLElement> {
    /** The text to type out */
    text: string;
    /** HTML element to render as */
    as?: ElementType;
    /** Typing speed in milliseconds per character */
    typingSpeed?: number;
    /** Initial delay before typing starts */
    initialDelay?: number;
    /** Show the cursor */
    showCursor?: boolean;
    /** Cursor character */
    cursorCharacter?: string | React.ReactNode;
    /** Cursor blink duration in seconds */
    cursorBlinkDuration?: number;
    /** Additional class for the cursor */
    cursorClassName?: string;
    /** Callback when typing is complete */
    onComplete?: () => void;
}

export function TextType({
    text,
    as: Component = 'span',
    typingSpeed = 40,
    initialDelay = 0,
    showCursor = true,
    cursorCharacter = '|',
    cursorBlinkDuration = 0.5,
    cursorClassName = '',
    onComplete,
    className = '',
    ...props
}: TextTypeProps) {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const cursorRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLElement>(null);

    // Cursor blink animation
    useEffect(() => {
        if (showCursor && cursorRef.current) {
            gsap.set(cursorRef.current, { opacity: 1 });
            const blink = gsap.to(cursorRef.current, {
                opacity: 0,
                duration: cursorBlinkDuration,
                repeat: -1,
                yoyo: true,
                ease: 'power2.inOut'
            });
            return () => { blink.kill(); };
        }
    }, [showCursor, cursorBlinkDuration]);

    // Typing animation
    useEffect(() => {
        let currentIndex = 0;
        let timeout: ReturnType<typeof setTimeout>;

        const typeNextChar = () => {
            if (currentIndex < text.length) {
                setDisplayedText(text.slice(0, currentIndex + 1));
                currentIndex++;
                timeout = setTimeout(typeNextChar, typingSpeed);
            } else {
                setIsComplete(true);
                onComplete?.();
            }
        };

        // Start typing after initial delay
        timeout = setTimeout(typeNextChar, initialDelay);

        return () => clearTimeout(timeout);
    }, [text, typingSpeed, initialDelay, onComplete]);

    // Hide cursor after typing is complete (with delay)
    useEffect(() => {
        if (isComplete && cursorRef.current) {
            const hideCursor = gsap.to(cursorRef.current, {
                opacity: 0,
                duration: 0.3,
                delay: 1,
                ease: 'power2.out'
            });
            return () => { hideCursor.kill(); };
        }
    }, [isComplete]);

    return createElement(
        Component,
        {
            ref: containerRef,
            className: `text-type ${className}`,
            ...props
        },
        <>
            <span className="text-type__content">{displayedText}</span>
            {showCursor && (
                <span
                    ref={cursorRef}
                    className={`text-type__cursor ${cursorClassName}`}
                >
                    {cursorCharacter}
                </span>
            )}
        </>
    );
}

export default TextType;
