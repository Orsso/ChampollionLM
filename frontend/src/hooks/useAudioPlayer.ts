import { useState, useRef, useEffect, useCallback } from 'react';

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  error: string | null;
}

export interface AudioPlayerControls {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
}

export function useAudioPlayer(src: string | undefined, initialDuration?: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: initialDuration || 0,
    volume: 1,
    isLoading: initialDuration ? false : true, // If we have duration, no loading
    error: null,
  });

  // Initialize audio element
  useEffect(() => {
    if (!src) return;

    const audio = new Audio(src);
    audio.preload = 'metadata'; // Force loading metadata
    audioRef.current = audio;

    // Event handlers
    const handleLoadedMetadata = () => {
      // Don't overwrite duration if already provided and valid
      setState((prev) => ({
        ...prev,
        duration: audio.duration && isFinite(audio.duration) ? audio.duration : prev.duration,
        isLoading: false,
      }));
    };

    const handleDurationChange = () => {
      // Update duration only if it's valid
      if (audio.duration && isFinite(audio.duration)) {
        setState((prev) => ({
          ...prev,
          duration: audio.duration,
        }));
      }
    };

    const handleTimeUpdate = () => {
      setState((prev) => ({
        ...prev,
        currentTime: audio.currentTime,
      }));
    };

    const handlePlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
    };

    const handleEnded = () => {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
      }));
      audio.currentTime = 0;
    };

    let retried = false;
    const handleError = () => {
      // Try a single silent retry in case the blob URL wasn't ready yet
      if (!retried && audio.readyState === 0) {
        retried = true;
        setTimeout(() => {
          try {
            audio.load();
          } catch {
            // Ignore load errors on retry
          }
        }, 300);
        return;
      }
      setState((prev) => ({
        ...prev,
        error: 'Error loading audio',
        isLoading: false,
      }));
    };

    const handleLoadStart = () => {
      setState((prev) => ({ ...prev, isLoading: true }));
    };

    const handleCanPlay = () => {
      setState((prev) => ({ ...prev, isLoading: false }));
    };

    // Attach listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    // Force load to trigger metadata
    audio.load();

    // Cleanup
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
      audioRef.current = null;
    };
  }, [src]);

  // Controls
  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.error('Error playing audio:', err);
        setState((prev) => ({
          ...prev,
          error: 'Unable to play audio',
        }));
      });
      setState((prev) => ({ ...prev, isPlaying: true, error: null }));
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const toggle = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState((prev) => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
      setState((prev) => ({ ...prev, volume: clampedVolume }));
    }
  }, []);

  const controls: AudioPlayerControls = {
    play,
    pause,
    toggle,
    seek,
    setVolume,
  };

  return { state, controls };
}
