import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioVisualizer } from '../ui/media/AudioVisualizer';
import { ProgressBar } from '../ui/feedback';
import { StyledInput } from '../ui/forms';
import { Button } from '../ui/buttons';
import { Modal } from '../ui/layout';
import { useRecordingAnimations } from '../../hooks/useRecordingAnimations';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useAuth } from '../../hooks';
import { uploadAudioSource, importYouTubeSource } from '../../hooks/useSources';
import { formatDuration } from '../../utils/formatters';
import { MicrophoneIcon, LinkIcon, FileIcon } from '../ui/icons';
import {
    BORDERS,
    SHADOWS,
    RADIUS,
    TRANSITIONS
} from '../../constants/styles';

type ImportMode = 'audio' | 'link' | 'file';
type AudioMode = 'idle' | 'recording';

const ANIM = {
    ease: 'power2.inOut' as const,
    dur: 0.5,
    gap: 24,
};

interface SourceImportZoneProps {
    projectId: string | number;
    onMutate?: () => void;
}

export function SourceImportZone({ projectId, onMutate }: SourceImportZoneProps) {
    const [importMode, setImportMode] = useState<ImportMode>('audio');
    const [audioMode, setAudioMode] = useState<AudioMode>('idle');
    const [uploadProgress, setUploadProgress] = useState(0);

    // YouTube URL state
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [youtubeLoading, setYoutubeLoading] = useState(false);
    const [youtubeError, setYoutubeError] = useState<string | null>(null);
    const [apiKeyWarning, setApiKeyWarning] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

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

            // Show warning if no API key and no demo access (source saved but processing will fail)
            if (!user?.has_api_key && !user?.is_demo_user) {
                setApiKeyWarning(true);
            }

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
                setActiveAudioMode('idle');
            } catch {
                setActiveAudioMode('idle');
            }
        },
        onError: () => setActiveAudioMode('idle')
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

    const setActiveAudioMode = useCallback((nextMode: AudioMode) => {
        if (nextMode === audioMode) return;
        if (nextMode === 'idle' && isRecording) return;

        if (autoCloseTimerRef.current) {
            clearTimeout(autoCloseTimerRef.current);
            autoCloseTimerRef.current = null;
        }

        if (nextMode === 'idle') {
            toIdle();
        } else if (nextMode === 'recording') {
            toRecording();
        }

        setAudioMode(nextMode);
    }, [audioMode, isRecording, toIdle, toRecording]);

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
        if (audioMode === 'recording' && !isRecording) {
            autoCloseTimerRef.current = window.setTimeout(() => {
                if (!isRecording) {
                    setActiveAudioMode('idle');
                }
            }, 3000);
        }

        return () => {
            if (autoCloseTimerRef.current) {
                clearTimeout(autoCloseTimerRef.current);
                autoCloseTimerRef.current = null;
            }
        };
    }, [audioMode, isRecording, setActiveAudioMode]);

    const handleRecordClick = () => {
        if (audioMode === 'idle') {
            setActiveAudioMode('recording');
        }
    };

    const handleYouTubeImport = async () => {
        if (!youtubeUrl.trim()) return;

        setYoutubeLoading(true);
        setYoutubeError(null);

        try {
            await importYouTubeSource(projectId, youtubeUrl.trim());
            setYoutubeUrl('');
            onMutate?.();
        } catch (error) {
            setYoutubeError(error instanceof Error ? error.message : 'Échec de l\'import');
        } finally {
            setYoutubeLoading(false);
        }
    };

    const isYouTubeUrlValid = (url: string): boolean => {
        if (!url.trim()) return false;
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/,
            /(?:https?:\/\/)?youtu\.be\/[a-zA-Z0-9_-]{11}/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/[a-zA-Z0-9_-]{11}/,
        ];
        return patterns.some(pattern => pattern.test(url));
    };

    const tabs = [
        { id: 'audio' as const, label: 'Audio', icon: MicrophoneIcon },
        { id: 'link' as const, label: 'Lien', icon: LinkIcon },
        { id: 'file' as const, label: 'Fichier', icon: FileIcon, disabled: true },
    ];

    return (
        <div className={`
      ${BORDERS.thick}
      border-black
      ${RADIUS.normal}
      ${SHADOWS.medium}
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

            {/* Mode tabs */}
            <div className="flex gap-2 mb-4">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = importMode === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => !tab.disabled && setImportMode(tab.id)}
                            disabled={tab.disabled}
                            className={`
                flex items-center gap-2 px-4 py-2
                ${BORDERS.normal}
                border-black
                ${RADIUS.subtle}
                font-bold text-sm
                transition-all ${TRANSITIONS.fast}
                ${isActive
                                    ? 'bg-orange-500 text-white shadow-none translate-x-[2px] translate-y-[2px]'
                                    : `bg-white text-black ${SHADOWS.small} hover:bg-orange-50 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none`
                                }
                ${tab.disabled ? 'opacity-40 cursor-not-allowed hover:translate-x-0 hover:translate-y-0 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}
              `}
                            title={tab.disabled ? 'Bientôt disponible' : undefined}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Audio mode content */}
            {importMode === 'audio' && (
                <div className="space-y-4">
                    <div className="relative">
                        <div className="flex gap-4 items-start">
                            <button
                                ref={recordBtnRef}
                                onClick={handleRecordClick}
                                disabled={audioMode !== 'idle'}
                                className={`
                  flex-1 flex items-center justify-center gap-3 px-6 py-4
                  bg-orange-500
                  ${BORDERS.normal}
                  border-black
                  ${RADIUS.subtle}
                  ${SHADOWS.small}
                  text-white font-bold
                  transition-all ${TRANSITIONS.fast}
                  hover:translate-x-[2px] hover:translate-y-[2px]
                  hover:shadow-none
                  disabled:opacity-50 disabled:cursor-not-allowed
                  disabled:hover:translate-x-0 disabled:hover:translate-y-0
                `}
                            >
                                <MicrophoneIcon size={20} />
                                Enregistrer
                            </button>

                            <button
                                ref={importBtnRef}
                                onClick={handleImportClick}
                                disabled={isRecording || uploadProgress > 0}
                                className={`
                  flex-1 flex items-center justify-center gap-3 px-6 py-4
                  bg-white
                  ${BORDERS.normal}
                  border-black
                  ${RADIUS.subtle}
                  ${SHADOWS.small}
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
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
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
                            {audioMode === 'recording' && (
                                <div className="space-y-4">
                                    <AudioVisualizer
                                        audioData={audioData}
                                        isRecording={isRecording}
                                        micGain={micGain}
                                    />

                                    <div className="flex items-center justify-center gap-4">
                                        <button
                                            onClick={isRecording ? stopRecording : startRecording}
                                            className={`relative w-20 h-20 flex items-center justify-center transition-all ${TRANSITIONS.normal} ${BORDERS.thick} border-black ${isRecording
                                                ? `bg-red-500 hover:bg-red-600 ${SHADOWS.red} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgb(239,68,68)]`
                                                : `bg-orange-500 hover:bg-orange-600 ${SHADOWS.orange} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgb(249,115,22)]`
                                                }`}
                                            aria-label={isRecording ? 'Arrêter l\'enregistrement' : 'Commencer l\'enregistrement'}
                                        >
                                            {isRecording ? (
                                                <div className="w-6 h-6 bg-white border-2 border-black" />
                                            ) : (
                                                <MicrophoneIcon size={32} className="text-white" />
                                            )}
                                        </button>

                                        {isRecording && (
                                            <div className={`
                        bg-black
                        ${BORDERS.normal}
                        border-black
                        ${RADIUS.normal}
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
            )}

            {/* Link mode content (YouTube) */}
            {importMode === 'link' && (
                <div className="space-y-4">
                    <div className="flex gap-3 items-center">
                        <StyledInput
                            type="url"
                            value={youtubeUrl}
                            onChange={(e) => {
                                setYoutubeUrl(e.target.value);
                                setYoutubeError(null);
                            }}
                            placeholder="https://youtube.com/watch?v=..."
                            className="flex-1"
                        />
                        <button
                            onClick={handleYouTubeImport}
                            disabled={youtubeLoading || !isYouTubeUrlValid(youtubeUrl)}
                            className={`
                flex items-center gap-2 px-6 py-3
                bg-orange-500
                ${BORDERS.normal}
                border-black
                ${RADIUS.subtle}
                ${SHADOWS.small}
                text-white font-bold
                transition-all ${TRANSITIONS.fast}
                hover:translate-x-[2px] hover:translate-y-[2px]
                hover:shadow-none
                disabled:opacity-50 disabled:cursor-not-allowed
                disabled:hover:translate-x-0 disabled:hover:translate-y-0
              `}
                        >
                            {youtubeLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                'Importer'
                            )}
                        </button>
                    </div>

                    {youtubeError && (
                        <div className={`
              px-4 py-3
              bg-red-100
              ${BORDERS.normal}
              border-red-500
              ${RADIUS.subtle}
              text-red-700 font-medium text-sm
            `}>
                            {youtubeError}
                        </div>
                    )}

                    <p className="text-sm text-gray-600">
                        Collez un lien YouTube pour importer automatiquement la transcription de la vidéo.
                        La vidéo doit avoir des sous-titres activés.
                    </p>
                </div>
            )}

            {/* File mode content (coming soon) */}
            {importMode === 'file' && (
                <div className={`
          p-8 text-center
          ${BORDERS.normal}
          border-dashed
          border-gray-300
          ${RADIUS.normal}
          bg-gray-50
        `}>
                    <FileIcon size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-400 font-medium">
                        PDF & PowerPoint — bientôt disponible
                    </p>
                </div>
            )}

            {uploadProgress > 0 && (
                <div className="mt-4">
                    <ProgressBar
                        value={uploadProgress}
                        className=""
                        color="orange"
                    />
                </div>
            )}

            {/* API Key Warning Modal - shows after upload if no API key */}
            <Modal
                isOpen={apiKeyWarning}
                onClose={() => setApiKeyWarning(false)}
                title="Clé API requise"
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    <p className="text-slate-700 font-medium">
                        Votre source a été ajoutée, mais le traitement échouera sans clé API Mistral.
                    </p>
                    <p className="text-sm text-slate-500">
                        Configurez votre clé API dans les paramètres, puis utilisez le bouton "Réessayer" sur la source.
                    </p>
                    <div className="flex gap-3 justify-end pt-2">
                        <Button
                            variant="secondary"
                            onClick={() => setApiKeyWarning(false)}
                        >
                            Compris
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                setApiKeyWarning(false);
                                navigate('/settings');
                            }}
                        >
                            Aller aux paramètres
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
