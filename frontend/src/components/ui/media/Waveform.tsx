import { useRef, useEffect, useState } from 'react';

/**
 * Waveform Component
 *
 * Audio waveform visualization with bold, vertical bars.
 * Matches the visual identity from the homepage with dynamic bar animations.
 *
 * Features:
 * - Vertical bars aligned at the bottom (flex items-end)
 * - Saturated orange bars (bg-orange-500)
 * - Real-time scrolling animation (time flows left to right)
 * - Amplitude variations based on audio gain
 *
 * @example
 * ```tsx
 * <Waveform
 *   audioData={audioDataArray}
 *   isActive={true}
 *   gain={1.5}
 * />
 * ```
 */

export interface WaveformProps {
  audioData?: Uint8Array | Float32Array | number[];
  isActive?: boolean;
  gain?: number;
  className?: string;
}

const NUM_BARS = 48; // Number of vertical bars to display
const MIN_HEIGHT = 10; // Minimum height percentage
const MAX_HEIGHT = 100; // Maximum height percentage
const UPDATE_INTERVAL = 100; // Update frequency in ms (10 FPS for slower scrolling)

export function Waveform({
  audioData,
  isActive = false,
  gain = 1,
  className = '',
}: WaveformProps) {
  // Buffer to store the temporal history of amplitudes (scrolling waveform)
  const bufferRef = useRef<number[]>(Array(NUM_BARS).fill(MIN_HEIGHT));
  const [barHeights, setBarHeights] = useState<number[]>(
    Array(NUM_BARS).fill(MIN_HEIGHT)
  );
  const animationFrameRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);

  useEffect(() => {
    const gainClamped = Math.max(0, Math.min(gain, 4));

    const updateBars = (timestamp: number) => {
      // Throttle updates to UPDATE_INTERVAL
      if (timestamp - lastUpdateTimeRef.current < UPDATE_INTERVAL) {
        if (isActive) {
          animationFrameRef.current = requestAnimationFrame(updateBars);
        }
        return;
      }
      lastUpdateTimeRef.current = timestamp;

      // Calculate current amplitude
      let currentAmplitude: number;

      if (audioData && audioData.length > 0) {
        // Calculate average amplitude from current audio data
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
          sum += audioData[i];
        }
        const avg = sum / audioData.length;
        
        // Normalize to 0-255 range and apply STRONG gain multiplier for visible variations
        const normalized = (avg / 255) * 100 * gainClamped * 2.5;
        currentAmplitude = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, normalized));
      } else if (isActive) {
        // Animated idle state - random amplitude with smooth variation
        const time = Date.now() / 300;
        const wave = Math.sin(time) * 25 + Math.sin(time * 1.3) * 15;
        const noise = Math.random() * 20;
        const height = 35 + wave + noise;
        // Apply stronger gain multiplier for more visible variations
        currentAmplitude = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, height * gainClamped * 1.5));
      } else {
        // Inactive - minimal height
        currentAmplitude = MIN_HEIGHT;
      }

      // Shift buffer: remove first element (oldest), add new amplitude at end (newest)
      // This creates the scrolling effect: time flows from left (old) to right (new)
      const newBuffer = [...bufferRef.current.slice(1), currentAmplitude];
      bufferRef.current = newBuffer;
      setBarHeights(newBuffer);

      // Continue animation if active
      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(updateBars);
      }
    };

    // Start animation
    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(updateBars);
    } else {
      // When becoming inactive, reset buffer to MIN_HEIGHT
      bufferRef.current = Array(NUM_BARS).fill(MIN_HEIGHT);
      setBarHeights(Array(NUM_BARS).fill(MIN_HEIGHT));
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioData, isActive, gain]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Waveform bars container - matches homepage style */}
      <div className="absolute inset-0 flex items-center justify-center px-8">
        <div className="flex items-end gap-1 h-24 justify-center w-full max-w-2xl">
          {barHeights.map((height, i) => (
            <div
              key={i}
              className="bg-orange-500 w-1.5 rounded-sm"
              style={{
                height: `${height}%`,
                minHeight: `${MIN_HEIGHT}%`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
