import { useState } from 'react';
import { Badge, ShinyText } from '../ui/feedback';
import { Modal } from '../ui/layout';
import { AnimatedInput } from '../ui/forms';
import { useTokenEstimate } from '../../hooks/useTokens';
import { formatDateTime } from '../../utils/formatters';
import type { Source } from '../../types';
import {
  BRUTAL_BORDERS,
  BRUTAL_SHADOWS,
  BRUTAL_RADIUS,
  TRANSITIONS
} from '../../constants/styles';

interface GenerationControlsProps {
  projectId: string | number;
  projectTitle?: string;
  readySources: Source[];
  isGenerating: boolean;
  isLaunching: boolean;
  hasAnyProcessedContent: boolean;
  onGenerate: (sourceIds: number[], title?: string) => Promise<void>;
}

export function GenerationControls({
  projectId,
  projectTitle,
  readySources,
  isGenerating,
  isLaunching,
  hasAnyProcessedContent,
  onGenerate
}: GenerationControlsProps) {
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>([]);
  const [docTitle, setDocTitle] = useState('');

  // Use selectedSourceIds directly for estimation to match "empty selection = empty bar"
  const { estimation } = useTokenEstimate(projectId, { sourceIds: selectedSourceIds });

  const tileDisabled = !hasAnyProcessedContent || isLaunching || isGenerating;

  const handleGenerateClick = () => {
    if (tileDisabled) return;
    setSelectModalOpen(true);
  };

  const handleLaunchGeneration = async () => {
    const sourceIds = selectedSourceIds.length > 0
      ? selectedSourceIds
      : readySources.map(s => s.id);

    let title = docTitle && docTitle.trim().length > 0 ? docTitle.trim() : undefined;
    if (!title && projectTitle) {
      title = `${projectTitle}:Cours1`;
    }

    await onGenerate(sourceIds, title);
    setSelectModalOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          onClick={handleGenerateClick}
          className={`
            relative group overflow-hidden
            ${BRUTAL_BORDERS.thick}
            border-black
            ${BRUTAL_RADIUS.normal}
            ${BRUTAL_SHADOWS.medium}
            transition-all ${TRANSITIONS.fast}
            ${tileDisabled
              ? 'opacity-60 cursor-not-allowed bg-slate-300'
              : 'cursor-pointer bg-orange-500 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none'
            }
          `}
        >
          <div className="p-4 text-left">
            <div className="flex flex-col justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`
                  inline-flex h-10 w-10 items-center justify-center
                  ${BRUTAL_BORDERS.normal}
                  border-black
                  ${BRUTAL_RADIUS.subtle}
                  ${tileDisabled ? 'bg-slate-400 text-slate-600' : 'bg-white text-orange-500'}
                `}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22h11A2.5 2.5 0 0 0 20 19.5v-15A2.5 2.5 0 0 0 17.5 2h-11A2.5 2.5 0 0 0 4 4.5z" />
                    <path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h6" />
                  </svg>
                </span>
                <div>
                  <p className={`font-black text-lg ${tileDisabled ? 'text-slate-600' : 'text-white'}`}>
                    Cours
                  </p>
                  <p className={`text-xs font-bold ${tileDisabled ? 'text-slate-500' : 'text-white/90'}`}>
                    Document structure
                  </p>
                </div>
              </div>

              {isGenerating && (
                <div className="flex items-center gap-2 text-xs">
                  <Badge color="amber">
                    <ShinyText size="xs">En cours</ShinyText>
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {!tileDisabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectModalOpen(true);
              }}
              className={`
                absolute top-3 right-3 p-2
                ${BRUTAL_BORDERS.normal}
                border-black
                ${BRUTAL_RADIUS.subtle}
                ${BRUTAL_SHADOWS.small}
                bg-white
                text-black
                transition-all ${TRANSITIONS.fast}
                hover:translate-x-[1px] hover:translate-y-[1px]
                hover:shadow-none
              `}
              title="Configurer les sources"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          )}
        </div>

        <div
          className={`
            relative overflow-hidden
            ${BRUTAL_BORDERS.thick}
            border-black
            ${BRUTAL_RADIUS.normal}
            ${BRUTAL_SHADOWS.medium}
            opacity-60 cursor-not-allowed bg-slate-300
          `}
        >
          <div className="p-4">
            <div className="flex flex-col justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`
                  inline-flex h-10 w-10 items-center justify-center
                  ${BRUTAL_BORDERS.normal}
                  border-black
                  ${BRUTAL_RADIUS.subtle}
                  bg-slate-400 text-slate-600
                `}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </span>
                <div>
                  <p className="text-slate-600 font-black text-lg">Resume</p>
                  <p className="text-slate-500 text-xs font-bold">Synthese concise</p>
                </div>
              </div>
              <span className={`
                inline-flex items-center gap-1.5 px-2 py-1
                ${BRUTAL_BORDERS.thin}
                border-black
                ${BRUTAL_RADIUS.subtle}
                bg-slate-400 text-slate-600 font-bold text-xs
              `}>
                Bientot disponible
              </span>
            </div>
          </div>
        </div>

        <div
          className={`
            relative overflow-hidden
            ${BRUTAL_BORDERS.thick}
            border-black
            ${BRUTAL_RADIUS.normal}
            ${BRUTAL_SHADOWS.medium}
            opacity-60 cursor-not-allowed bg-slate-300
          `}
        >
          <div className="p-4">
            <div className="flex flex-col justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`
                  inline-flex h-10 w-10 items-center justify-center
                  ${BRUTAL_BORDERS.normal}
                  border-black
                  ${BRUTAL_RADIUS.subtle}
                  bg-slate-400 text-slate-600
                `}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </span>
                <div>
                  <p className="text-slate-600 font-black text-lg">Todo</p>
                  <p className="text-slate-500 text-xs font-bold">Liste de taches</p>
                </div>
              </div>
              <span className={`
                inline-flex items-center gap-1.5 px-2 py-1
                ${BRUTAL_BORDERS.thin}
                border-black
                ${BRUTAL_RADIUS.subtle}
                bg-slate-400 text-slate-600 font-bold text-xs
              `}>
                Bientot disponible
              </span>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={selectModalOpen}
        onClose={() => setSelectModalOpen(false)}
        title="Generer un cours"
        maxWidth="max-w-xl"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setSelectModalOpen(false)}
              className={`
                px-6 py-3
                bg-white
                ${BRUTAL_BORDERS.normal}
                border-black
                ${BRUTAL_RADIUS.subtle}
                ${BRUTAL_SHADOWS.medium}
                font-bold text-black
                transition-all ${TRANSITIONS.fast}
                hover:translate-x-[2px] hover:translate-y-[2px]
                hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              `}
            >
              Annuler
            </button>
            <button
              onClick={handleLaunchGeneration}
              className={`
                px-6 py-3
                bg-orange-500
                ${BRUTAL_BORDERS.normal}
                border-black
                ${BRUTAL_RADIUS.subtle}
                ${BRUTAL_SHADOWS.medium}
                font-bold text-white
                transition-all ${TRANSITIONS.fast}
                hover:translate-x-[2px] hover:translate-y-[2px]
                hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              `}
            >
              Lancer
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <AnimatedInput
              label="Titre du document"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              darkMode={false}
            />
            <p className="text-xs text-slate-600 mt-2 font-medium">
              Laissez vide pour utiliser le format par defaut: {projectTitle ? `${projectTitle}:Cours1` : 'Cours'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Selectionnez les sources a inclure</label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {readySources.length > 0 ? (
                readySources.map(source => {
                  const idNum = source.id;
                  const checked = selectedSourceIds.includes(idNum);
                  const isAudio = source.type === 'audio';

                  const sourceIcon = isAudio ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  );

                  return (
                    <label
                      key={source.id}
                      className={`
                        flex items-center gap-3 p-3
                        ${BRUTAL_BORDERS.normal}
                        border-black
                        ${BRUTAL_RADIUS.subtle}
                        cursor-pointer
                        transition-all ${TRANSITIONS.fast}
                        ${checked
                          ? `bg-orange-100 ${BRUTAL_SHADOWS.small}`
                          : 'bg-white hover:bg-slate-50'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-orange-500 rounded border-2 border-black"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSourceIds(prev => Array.from(new Set([...prev, idNum])));
                          } else {
                            setSelectedSourceIds(prev => prev.filter(x => x !== idNum));
                          }
                        }}
                      />
                      <div className="flex-shrink-0 text-black">
                        {sourceIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-black truncate">{source.title || source.filename}</p>
                          <span className={`
                            inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold
                            ${BRUTAL_BORDERS.thin}
                            border-black
                            ${BRUTAL_RADIUS.subtle}
                            ${isAudio ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'}
                          `}>
                            {isAudio ? 'AUDIO' : 'DOC'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 truncate font-medium mt-0.5">
                          {isAudio && source.filename ? source.filename : `Ajoute le ${formatDateTime(source.created_at)}`}
                        </p>
                      </div>
                    </label>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-600">
                  <p className="text-sm font-bold">Aucune source disponible</p>
                  <p className="text-xs mt-1">Ajoutez des enregistrements ou des documents pour commencer</p>
                </div>
              )}
            </div>
          </div>

          {/* Token Usage Bar */}
          <div className="pt-2 border-t-2 border-black/10">
            <div className="space-y-2">
              <div className={`flex items-center justify-between text-xs font-bold text-slate-800`}>
                <span>Utilisation des tokens (Estimation)</span>
                {estimation ? (
                  <span>{Math.round(estimation.context_percentage)}% de 200k (~{estimation.formatted_count})</span>
                ) : (
                  <span>0% de 200k</span>
                )}
              </div>
              <div className={`
                  w-full h-3
                  ${BRUTAL_BORDERS.thin}
                  border-black
                  ${BRUTAL_RADIUS.subtle}
                  bg-slate-100
                  overflow-hidden
                `}>
                <div
                  className={`h-full bg-orange-500 transition-all ${TRANSITIONS.normal}`}
                  style={{ width: estimation ? `${Math.min(estimation.context_percentage, 100)}%` : '0%' }}
                />
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                L'estimation est basee sur les sources selectionnees.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
