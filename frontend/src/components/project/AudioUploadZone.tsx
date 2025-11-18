import { useRef, useState, useEffect, useCallback } from 'react';
import { AudioVisualizer } from '../ui/media/AudioVisualizer';
import { ProgressBar } from '../ui/feedback';
import { useRecordingAnimations } from '../../hooks/useRecordingAnimations';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { uploadAudioSource } from '../../hooks/useSources';
import { formatDuration } from '../../utils/formatters';
import {
  BRUTAL_BORDERS,
  BRUTAL_SHADOWS,
  BRUTAL_RADIUS,
  TRANSITIONS
} from '../../constants/styles';

type Mode = 'idle' | 'recording' | 'importing';

const ANIM = {
  ease: 'power2.inOut' as const,
  dur: 0.5,
  gap: 24,
};

interface AudioUploadZoneProps {
  projectId: string | number;
  onMutate?: () => void;
}

export function AudioUploadZone({ projectId, onMutate }: AudioUploadZoneProps) {
  const [mode, setMode] = useState<Mode>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  const recordBtnRef = useRef<HTMLButtonElement>(null!);
  const importBtnRef = useRef<HTMLButtonElement>(null!);
  const recordContainerRef = useRef<HTMLDivElement>(null!);
  const spacerRef = useRef<HTMLDivElement>(null!);
  const importGhostRef = useRef<HTMLDivElement>(null!);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const autoCloseTimerRef = useRef<number | null>(null);

  const { setupRefs, toRecording, toIdle } = useRecordingAnimations(ANIM);

  const handleUploadInternal = async (file: File) => {
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      await uploadAudioSource(projectId, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      onMutate?.();

      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      console.error("Upload failed", error);
    }
  };

  const {
    isRecording,
    recordingTime,
    audioData,
    micGain,
    startRecording,
    stopRecording
  } = useAudioRecorder({
    onRecordingComplete: async (file) => {
      try {
        await handleUploadInternal(file);
        setActiveMode('idle');
      } catch {
        setActiveMode('idle');
      }
    },
    onError: () => setActiveMode('idle')
  });

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      await handleUploadInternal(file);
    } catch {
      // Error handled in handleUploadInternal
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const setActiveMode = useCallback((nextMode: Mode) => {
    if (nextMode === mode) return;
    if (nextMode === 'importing' && isRecording) return;

    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }

    if (nextMode === 'idle') {
      toIdle();
    } else if (nextMode === 'recording') {
      toRecording();
    } else if (nextMode === 'importing') {
      handleImportClick();
    }

    setMode(nextMode);
  }, [mode, isRecording, toIdle, toRecording]);

  useEffect(() => {
    setupRefs({
      recordBtn: recordBtnRef,
      importBtn: importBtnRef,
      container: recordContainerRef,
      spacer: spacerRef,
      ghost: importGhostRef,
    });
  }, [setupRefs]);

  useEffect(() => {
    if (mode === 'recording' && !isRecording) {
      // Check if we just entered recording mode but haven't started? 
      // Or if we stopped recording and are waiting to close?
      // Actually, if isRecording is false, we should probably not be in 'recording' mode for long unless we are initializing.
      // But here we want to auto-close if user doesn't start or if it stopped.
      
      // NOTE: startRecording is async, so there might be a delay.
      // But we call startRecording inside the onClick handler usually.
      // Wait, the previous code called startRecording inside startRecording function which was called by button.
      
      // With the hook, we call startRecording().
    }
    
    // Legacy auto-close logic
    if (mode === 'recording' && !isRecording) {
       // If we are in recording mode UI but not actually recording (e.g. finished or not started)
       // We might want to wait a bit then close.
       // But `startRecording` sets `isRecording` to true quickly?
       // Let's keep the timeout for now.
       autoCloseTimerRef.current = window.setTimeout(() => {
        if (!isRecording) {
          setActiveMode('idle');
        }
      }, 3000);
    }

    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
    };
  }, [mode, isRecording, setActiveMode]);

  const handleRecordClick = () => {
    if (mode === 'idle') {
        setActiveMode('recording');
        // We don't start recording immediately?
        // The original code: onClick={() => setActiveMode('recording')}
        // Then the "Record" button (red one) inside the expanded area triggers startRecording.
    }
  };

  return (
    <div className={`
      ${BRUTAL_BORDERS.thick}
      border-black
      ${BRUTAL_RADIUS.normal}
      ${BRUTAL_SHADOWS.medium}
      bg-orange-100
      p-6
    `}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.m4a,.webm"
        onChange={handleFileSelect}
        className="hidden"
      />

      <h2 className="text-xl font-black text-black mb-4">Ajouter des sources</h2>

      <div className="space-y-4">
        <div className="relative">
          <div className="flex gap-4 items-start">
            <button
              ref={recordBtnRef}
              onClick={handleRecordClick}
              disabled={mode !== 'idle'}
              className={`
                flex-1 flex items-center justify-center gap-3 px-6 py-4
                bg-orange-500
                ${BRUTAL_BORDERS.normal}
                border-black
                ${BRUTAL_RADIUS.subtle}
                ${BRUTAL_SHADOWS.small}
                text-white font-bold
                transition-all ${TRANSITIONS.fast}
                hover:translate-x-[2px] hover:translate-y-[2px]
                hover:shadow-none
                disabled:opacity-50 disabled:cursor-not-allowed
                disabled:hover:translate-x-0 disabled:hover:translate-y-0
              `}
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
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              Enregistrer
            </button>

            <button
              ref={importBtnRef}
              onClick={handleImportClick}
              disabled={isRecording || uploadProgress > 0}
              className={`
                flex-1 flex items-center justify-center gap-3 px-6 py-4
                bg-white
                ${BRUTAL_BORDERS.normal}
                border-black
                ${BRUTAL_RADIUS.subtle}
                ${BRUTAL_SHADOWS.small}
                text-black font-bold
                transition-all ${TRANSITIONS.fast}
                hover:translate-x-[2px] hover:translate-y-[2px]
                hover:shadow-none
                disabled:opacity-50 disabled:cursor-not-allowed
                disabled:hover:translate-x-0 disabled:hover:translate-y-0
              `}
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Importer
            </button>

            <div ref={importGhostRef} style={{ display: 'none', width: 0, height: 0 }} aria-hidden="true" />
          </div>

          <div
            ref={recordContainerRef}
            className="absolute top-0 left-0 right-0 opacity-0 pointer-events-none"
            style={{ transform: 'scale(0.95)' }}
          >
            {mode === 'recording' && (
              <div className="space-y-4">
                {/* Waveform visualization */}
                <AudioVisualizer 
                  audioData={audioData}
                  isRecording={isRecording}
                  micGain={micGain}
                />

                {/* Controls: Record button + Timer */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`relative w-20 h-20 flex items-center justify-center transition-all ${TRANSITIONS.normal} ${BRUTAL_BORDERS.thick} border-black ${
                      isRecording
                        ? `bg-red-500 hover:bg-red-600 ${BRUTAL_SHADOWS.red} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgb(239,68,68)]`
                        : `bg-orange-500 hover:bg-orange-600 ${BRUTAL_SHADOWS.orange} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgb(249,115,22)]`
                    }`}
                    aria-label={isRecording ? 'Arrêter l\'enregistrement' : 'Commencer l\'enregistrement'}
                  >
                    {isRecording ? (
                      <div className="w-6 h-6 bg-white border-2 border-black" />
                    ) : (
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white"
                      >
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <line x1="12" y1="19" x2="12" y2="23"/>
                        <line x1="8" y1="23" x2="16" y2="23"/>
                      </svg>
                    )}
                  </button>

                  {isRecording && (
                    <div className={`
                      bg-black
                      ${BRUTAL_BORDERS.normal}
                      border-black
                      ${BRUTAL_RADIUS.normal}
                      px-6 py-3
                    `}>
                      <span className="text-white font-mono text-xl font-bold">
                        {formatDuration(recordingTime)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div ref={spacerRef} style={{ height: 0 }} aria-hidden="true" />
      </div>

      {uploadProgress > 0 && (
        <div className="mt-4">
          <ProgressBar
            value={uploadProgress}
            className=""
            color="orange"
          />
        </div>
      )}
    </div>
  );
}
