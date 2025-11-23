import { ConfirmDeleteButton } from '../ui/buttons';
import { formatDateTime } from '../../utils/formatters';
import type { Document } from '../../types';
import {
    BRUTAL_CARD_VARIANTS,
    BRUTAL_RADIUS,
    TRANSITIONS
} from '../../constants/styles';

interface DocumentCardProps {
    document: Document;
    projectTitle?: string;
    isConfirmingDelete: boolean;
    onClick: () => void;
    onDelete: () => void;
}

/**
 * Simple document card for list display (similar to SourceCard)
 */
export function DocumentCard({
    document,
    projectTitle,
    isConfirmingDelete,
    onClick,
    onDelete
}: DocumentCardProps) {
    const documentIcon = (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22h11A2.5 2.5 0 0 0 20 19.5v-15A2.5 2.5 0 0 0 17.5 2h-11A2.5 2.5 0 0 0 4 4.5z" />
            <path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h6" />
        </svg>
    );

    return (
        <div
            onClick={onClick}
            className={`
        ${BRUTAL_CARD_VARIANTS.default}
        ${BRUTAL_RADIUS.subtle}
        p-4
        cursor-pointer
        transition-all ${TRANSITIONS.fast}
        hover:translate-x-[2px] hover:translate-y-[2px]
        hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
      `}
        >
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0 text-orange-500">
                    {documentIcon}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-black font-bold truncate">
                        {document.title || projectTitle || 'Document sans titre'}
                    </h3>
                    <div className="text-slate-600 text-sm mt-1 font-medium">
                        {formatDateTime(document.created_at)}
                    </div>
                </div>

                <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <ConfirmDeleteButton
                        isConfirming={isConfirmingDelete}
                        onDelete={onDelete}
                        ariaLabel={isConfirmingDelete ? `Confirmer la suppression` : `Supprimer le document`}
                    />
                </div>
            </div>
        </div>
    );
}
