import { useRef, useState, useCallback, useEffect } from 'react';
import { useAudioPlayer } from '../../../hooks/useAudioPlayer';
import { Card } from '../cards/Card';
import { TRANSITIONS, BORDERS, SHADOWS } from '../../../constants/styles';

interface AudioPlayerProps {
  src: string;
  duration?: number; // Duration in seconds from the backend
  className?: string;
}

/**
 * AudioPlayer Component
 *
 * Features:
 * - Thick borders and hard shadows
 * - Styled seek bar with thick borders
 * - Square/bold buttons with press-down effect
 * - Bold typography for time display
 * - Saturated orange color scheme
 */
export function AudioPlayer({ src, duration, className = '' }: AudioPlayerProps) {
  const { state, controls } = useAudioPlayer(src, duration);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Format time in MM:SS
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  // Handle seek calculation from mouse position
  const calculateSeekTime = useCallback((clientX: number) => {
    if (!progressBarRef.current || state.duration === 0) return null;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    return percentage * state.duration;
  }, [state.duration]);

  // Handle seek on progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const newTime = calculateSeekTime(e.clientX);
    if (newTime !== null) {
      controls.seek(newTime);
    }
  };

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const newTime = calculateSeekTime(e.clientX);
    if (newTime !== null) {
      controls.seek(newTime);
    }
  };

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newTime = calculateSeekTime(e.clientX);
      if (newTime !== null) {
        controls.seek(newTime);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, calculateSeekTime, controls]);

  // Don't show loading state if we have initial duration - show full player
  // Only show minimal loading if no duration is available

  // Show error with styled formatting
  if (state.error) {
    return (
      <div className={`flex items-center gap-3 p-4 bg-red-100 ${BORDERS.normal} border-red-600 ${SHADOWS.red} ${className}`}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-600 flex-shrink-0"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="text-red-600 text-sm font-bold">{state.error}</span>
      </div>
    );
  }

  return (
    <Card className={`relative flex items-center gap-4 p-4 ${className}`}>
      {/* Loading indicator when metadata is loading but duration is known */}
      {state.isLoading && state.duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-orange-300 border-b-2 border-black">
          <div className="h-full w-1/3 bg-orange-500 animate-pulse"></div>
        </div>
      )}
      {/* Play/Pause Button - Square style */}
      <button
        onClick={controls.toggle}
        disabled={state.isLoading && state.duration === 0}
        className={`flex-shrink-0 w-12 h-12 flex items-center justify-center bg-orange-500 hover:bg-orange-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white ${BORDERS.normal} border-black ${SHADOWS.small} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all ${TRANSITIONS.fast} focus:outline-none`}
        aria-label={state.isPlaying ? 'Pause' : 'Play'}
      >
        {state.isLoading && state.duration === 0 ? (
          // Loading spinner
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
        ) : state.isPlaying ? (
          // Pause icon
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          // Play icon
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5.14v14.72c0 .86.93 1.39 1.67.95l11.14-6.36a1.125 1.125 0 0 0 0-1.9L9.67 4.19A1.125 1.125 0 0 0 8 5.14z" />
          </svg>
        )}
      </button>

      {/* Progress and Time Info */}
      <div className="flex-1 space-y-2">
        {/* Time Display - Bold typography */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-900 font-mono font-bold">
            {formatTime(state.currentTime)}
          </span>
          <span className="text-slate-600 font-mono font-bold">
            {formatTime(state.duration)}
          </span>
        </div>

        {/* Progress Bar - Styled with thick borders */}
        <div
          ref={progressBarRef}
          onClick={handleProgressClick}
          onMouseDown={handleMouseDown}
          className={`relative h-3 bg-slate-200 ${BORDERS.thin} border-black cursor-pointer group`}
          role="slider"
          aria-label="Progress bar"
          aria-valuemin={0}
          aria-valuemax={state.duration}
          aria-valuenow={state.currentTime}
        >
          {/* Progress Fill - Saturated orange, no gradients */}
          <div
            className="absolute top-0 left-0 h-full bg-orange-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />

          {/* Hover Effect - Darker orange overlay */}
          <div
            className={`absolute top-0 left-0 h-full bg-orange-600/50 opacity-0 group-hover:opacity-100 transition-opacity ${TRANSITIONS.fast}`}
            style={{ width: `${progress}%` }}
          />

          {/* Progress Handle - Square/bold style */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 ${BORDERS.thin} border-black opacity-0 group-hover:opacity-100 transition-opacity ${TRANSITIONS.fast} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
            style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>
      </div>

      {/* Volume Control - Button style */}
      <div className="flex-shrink-0 hidden md:block">
        <button
          onClick={() => {
            controls.setVolume(state.volume > 0 ? 0 : 1);
          }}
          className={`w-10 h-10 flex items-center justify-center ${BORDERS.thin} border-black bg-white hover:bg-slate-100 text-slate-900 transition-colors ${TRANSITIONS.fast}`}
          aria-label={state.volume > 0 ? 'Mute' : 'Unmute'}
        >
          {state.volume > 0 ? (
            // Volume on icon
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          ) : (
            // Volume off icon
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>
      </div>
    </Card>
  );
}
