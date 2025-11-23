import { useState } from 'react';
import { saveAs } from 'file-saver';
import { Modal } from '../layout';
import { MarkdownViewer } from './MarkdownViewer';
import { IconButton, ConfirmDeleteButton } from '../buttons';
import { PlusIcon, CheckIcon, DocumentIcon, EditIcon } from '../icons';
import { ExportMenu, type ExportOption } from './ExportMenu';
import { BRUTAL_BORDERS, BRUTAL_RADIUS } from '../../../constants/styles';
import { API_BASE_URL, getToken } from '../../../lib/api';
import { createSource } from '../../../hooks/useSources';
import type { Document } from '../../../types';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  projectId: string | number;
  projectTitle?: string;
  onRename?: (documentId: number, newTitle: string) => Promise<void>;
  onDelete?: (documentId: number) => void;
  isConfirmingDelete?: boolean;
  onMutate?: () => void;
}

export function DocumentModal({
  isOpen,
  onClose,
  document,
  projectId,
  projectTitle,
  onRename,
  onDelete,
  isConfirmingDelete = false,
  onMutate
}: DocumentModalProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [copied, setCopied] = useState(false);
  const [addedToSource, setAddedToSource] = useState(false);

  const handleRenameClick = () => {
    setRenameValue(document.title || '');
    setRenameOpen(true);
  };

  const handleRenameSubmit = async () => {
    const title = renameValue.trim();
    if (!title || !onRename) return;
    try {
      await onRename(document.id, title);
      setRenameOpen(false);
    } catch (err) {
      console.error('Rename failed', err);
    }
  };

  const handleCopyMarkdown = async () => {
    if (document?.markdown) {
      try {
        await navigator.clipboard.writeText(document.markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silent fail
      }
    }
  };

  const handleAddToSource = async () => {
    if (!document?.markdown || !projectId) return;
    try {
      await createSource(projectId, {
        type: 'document',
        title: document?.title || 'Document sans titre',
        content: document.markdown,
      });
      onMutate?.();
      setAddedToSource(true);
      setTimeout(() => setAddedToSource(false), 2000);
    } catch {
      // Silent fail
    }
  };

  const handleExportPDF = async () => {
    if (!document?.markdown) return;
    try {
      const token = getToken();
      if (!token) throw new Error('Non authentifie');
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/documents/${document.id}/export/pdf`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      saveAs(blob, `${document.title || 'document'}.pdf`);
    } catch {
      // Silent fail
    }
  };

  const handleExportHTML = () => {
    if (!document?.markdown) return;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${document.title || 'Document'}</title>
</head>
<body>
  <pre>${document.markdown}</pre>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    saveAs(blob, `${document.title || 'document'}.html`);
  };

  const handleExportTXT = () => {
    if (!document?.markdown) return;
    const blob = new Blob([document.markdown], { type: 'text/plain' });
    saveAs(blob, `${document.title || 'document'}.txt`);
  };

  const exportOptions: ExportOption[] = [
    { label: 'PDF', onClick: handleExportPDF, bgColor: '#eab308' },
    { label: 'HTML', onClick: handleExportHTML, bgColor: '#f97316' },
    { label: 'TXT', onClick: handleExportTXT, bgColor: '#fb923c' },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
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
            <span className="text-lg font-black text-orange-500">{document?.title || 'Cours'}</span>
            <IconButton
              onClick={handleRenameClick}
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
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            />
            <ExportMenu options={exportOptions} />
            {onDelete && (
              <ConfirmDeleteButton
                isConfirming={isConfirmingDelete}
                onDelete={() => onDelete(document.id)}
                ariaLabel={isConfirmingDelete ? `Confirmer la suppression de ${document?.title || projectTitle || 'document'}` : `Supprimer ${document?.title || projectTitle || 'document'}`}
              />
            )}
          </div>
        )}
      >
        <MarkdownViewer markdown={document?.markdown || ''} />
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
                placeholder:text-slate-400
                focus:outline-none
                focus:ring-4 focus:ring-orange-500/30
              `}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
              placeholder="Nouveau titre"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRenameOpen(false)}
                className={`
                  px-4 py-2
                  ${BRUTAL_BORDERS.normal}
                  border-black
                  ${BRUTAL_RADIUS.subtle}
                  bg-white text-black font-bold
                `}
              >
                Annuler
              </button>
              <button
                onClick={handleRenameSubmit}
                className={`
                  px-4 py-2
                  ${BRUTAL_BORDERS.normal}
                  border-black
                  ${BRUTAL_RADIUS.subtle}
                  bg-orange-500 text-white font-bold
                `}
              >
                Renommer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
