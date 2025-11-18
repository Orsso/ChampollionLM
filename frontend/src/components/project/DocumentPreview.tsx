import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { Badge, ShinyText } from '../ui/feedback';
import { ExportMenu, type ExportOption, MarkdownViewer } from '../ui/media';
import { Modal } from '../ui/layout';
import { IconButton, ConfirmDeleteButton, Button } from '../ui/buttons';
import { PlusIcon, CheckIcon, DocumentIcon, EditIcon } from '../ui/icons';
import { createSource } from '../../hooks/useSources';
import { API_BASE_URL, getToken } from '../../lib/api';
import type { Document } from '../../types';
import {
  BRUTAL_BORDERS,
  BRUTAL_SHADOWS,
  BRUTAL_RADIUS,
  BRUTAL_CARD_VARIANTS,
  TRANSITIONS
} from '../../constants/styles';

interface DocumentPreviewProps {
  projectId: string | number;
  projectTitle?: string;
  document?: Document;
  isGenerating: boolean;
  isLaunching: boolean;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  onMutate?: () => void;
  confirmingDelete: boolean;
  onConfirmDeleteChange: (confirming: boolean) => void;
}

export function DocumentPreview({
  projectId,
  projectTitle,
  document: generatedDocument,
  isGenerating,
  isLaunching,
  onDelete,
  onRename,
  onMutate,
  confirmingDelete,
  onConfirmDeleteChange
}: DocumentPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [addedToSource, setAddedToSource] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [confirmingDeleteModal, setConfirmingDeleteModal] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (confirmingDelete) {
      const timer = setTimeout(() => onConfirmDeleteChange(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmingDelete, onConfirmDeleteChange]);

  useEffect(() => {
    if (confirmingDeleteModal) {
      const timer = setTimeout(() => setConfirmingDeleteModal(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmingDeleteModal]);

  const handleCopyMarkdown = async () => {
    if (generatedDocument?.markdown) {
      try {
        await navigator.clipboard.writeText(generatedDocument.markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silent fail
      }
    }
  };

  const handleAddToSource = async () => {
    if (!generatedDocument?.markdown || !projectId) return;
    try {
      await createSource(projectId, {
        type: 'document',
        title: generatedDocument?.title || 'Document sans titre',
        content: generatedDocument.markdown,
      });
      onMutate?.();
      setAddedToSource(true);
      setTimeout(() => setAddedToSource(false), 2000);
    } catch {
      // Silent fail
    }
  };

  const handleExportPDF = async () => {
    if (!generatedDocument?.markdown) return;
    try {
      const token = getToken();
      if (!token) throw new Error('Non authentifie');
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/documents/export/pdf`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Erreur inconnue' }));
        throw new Error(err.detail || "Erreur lors de l'export PDF");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${projectTitle || 'cours'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Silent fail
    }
  };

  const handleExportHTML = () => {
    if (!generatedDocument?.markdown) return;
    try {
      const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Document - ${projectTitle || 'Cours'}</title></head><body><pre>${generatedDocument.markdown}</pre></body></html>`;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      saveAs(blob, `document-${projectTitle || 'cours'}.html`);
    } catch {
      // Silent fail
    }
  };

  const handleExportTXT = () => {
    if (!generatedDocument?.markdown) return;
    try {
      const blob = new Blob([generatedDocument.markdown], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${projectTitle || 'cours'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silent fail
    }
  };

  const handleDeleteConfirm = () => {
    if (confirmingDelete) {
      onDelete();
      onConfirmDeleteChange(false);
    } else {
      onConfirmDeleteChange(true);
    }
  };

  const handleDeleteConfirmModal = () => {
    if (confirmingDeleteModal) {
      onDelete();
      setConfirmingDeleteModal(false);
      setDocModalOpen(false);
    } else {
      setConfirmingDeleteModal(true);
    }
  };

  const exportOptions: ExportOption[] = [
    { label: 'PDF', onClick: handleExportPDF, bgColor: '#eab308' },
    { label: 'HTML', onClick: handleExportHTML, bgColor: '#f97316' },
    { label: 'TXT', onClick: handleExportTXT, bgColor: '#fb923c' },
  ];

  if (!generatedDocument?.markdown && !isGenerating) {
    return null;
  }

  return (
    <div className={`
      ${BRUTAL_BORDERS.thick}
      border-black
      ${BRUTAL_RADIUS.normal}
      ${BRUTAL_SHADOWS.medium}
      bg-white
      p-6
    `}>
      <h2 className="text-xl font-black text-black mb-4">Document genere</h2>

      <div
        onClick={() => !isGenerating && setDocModalOpen(true)}
        className={`
          ${BRUTAL_CARD_VARIANTS.default}
          ${BRUTAL_RADIUS.subtle}
          p-5
          ${!isGenerating ? 'cursor-pointer' : ''}
          transition-all ${TRANSITIONS.fast}
          ${!isGenerating ? 'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`
              inline-flex h-10 w-10 items-center justify-center
              ${BRUTAL_BORDERS.normal}
              border-black
              ${BRUTAL_RADIUS.subtle}
              bg-orange-500 text-white
            `}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22h11A2.5 2.5 0 0 0 20 19.5v-15A2.5 2.5 0 0 0 17.5 2h-11A2.5 2.5 0 0 0 4 4.5z"/>
                <path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h6"/>
              </svg>
            </span>
            <div>
              <p className="text-black font-bold">{generatedDocument?.title || projectTitle || 'Cours'}</p>
              <p className="text-slate-600 text-sm font-medium">
                {generatedDocument?.created_at
                  ? new Date(generatedDocument.created_at).toLocaleString()
                  : 'Generation en cours...'}
              </p>
            </div>
          </div>

          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {(isLaunching || isGenerating) ? (
              <Badge color="amber">
                <ShinyText size="xs">Generation...</ShinyText>
              </Badge>
            ) : (
              <>
                <button
                  onClick={handleAddToSource}
                  className={`
                    p-2
                    ${BRUTAL_BORDERS.normal}
                    border-black
                    ${BRUTAL_RADIUS.subtle}
                    ${BRUTAL_SHADOWS.small}
                    ${addedToSource ? 'bg-green-500' : 'bg-orange-500'}
                    text-white
                    transition-all ${TRANSITIONS.fast}
                    hover:translate-x-[2px] hover:translate-y-[2px]
                    hover:shadow-none
                  `}
                  title={addedToSource ? 'Ajoute !' : 'Ajouter comme source'}
                >
                  {addedToSource ? <CheckIcon /> : <PlusIcon />}
                </button>
                <div onClick={(e) => e.stopPropagation()}>
                  <ExportMenu options={exportOptions} />
                </div>
                <ConfirmDeleteButton
                  isConfirming={confirmingDelete}
                  onDelete={handleDeleteConfirm}
                  ariaLabel={confirmingDelete ? `Confirmer la suppression de ${generatedDocument?.title || projectTitle || 'document'}` : `Supprimer ${generatedDocument?.title || projectTitle || 'document'}`}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        maxWidth="w-[95vw] max-w-[110rem]"
        title={(
          <div className="flex items-center gap-2">
            <span className={`
              inline-flex h-10 w-10 items-center justify-center
              ${BRUTAL_BORDERS.normal}
              border-black
              ${BRUTAL_RADIUS.subtle}
              bg-orange-500 text-white
            `}>
              <DocumentIcon />
            </span>
            <span className="text-lg font-black text-orange-500">{generatedDocument?.title || 'Cours'}</span>
            <IconButton
              onClick={() => {
                setRenameOpen(true);
                setRenameValue(generatedDocument?.title || 'Cours');
              }}
              tooltip="Renommer le document"
              icon={<EditIcon />}
              size="sm"
              className="!h-7 !w-7"
            />
          </div>
        )}
        headerRight={(
          <div className="flex items-center gap-2">
            <IconButton
              onClick={handleAddToSource}
              tooltip={addedToSource ? 'Ajoute !' : 'Ajouter comme source'}
              icon={addedToSource ? <CheckIcon /> : <PlusIcon />}
              variant="primary"
            />
            <IconButton
              onClick={handleCopyMarkdown}
              tooltip={copied ? 'Copie !' : 'Copier le markdown'}
              icon={copied ? <CheckIcon /> : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              )}
            />
            <ExportMenu options={exportOptions} />
            <ConfirmDeleteButton
              isConfirming={confirmingDeleteModal}
              onDelete={handleDeleteConfirmModal}
              ariaLabel={confirmingDeleteModal ? `Confirmer la suppression de ${generatedDocument?.title || projectTitle || 'document'}` : `Supprimer ${generatedDocument?.title || projectTitle || 'document'}`}
            />
          </div>
        )}
      >
        <MarkdownViewer markdown={generatedDocument?.markdown || ''} />
      </Modal>

      {renameOpen && (
        <Modal isOpen={renameOpen} onClose={() => setRenameOpen(false)} title="Renommer le document" maxWidth="max-w-md">
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-800">Titre</label>
            <input
              className={`
                w-full px-4 py-3
                bg-white
                ${BRUTAL_BORDERS.normal}
                border-black
                ${BRUTAL_RADIUS.subtle}
                font-bold text-black
                focus:outline-none
                focus:ring-4 focus:ring-orange-500/30
                transition-all ${TRANSITIONS.fast}
              `}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setRenameOpen(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const t = renameValue.trim();
                  if (t) {
                    onRename(t);
                    setRenameOpen(false);
                  }
                }}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
