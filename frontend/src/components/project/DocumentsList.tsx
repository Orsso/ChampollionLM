import { useMemo } from 'react';
import { Badge, ShinyText } from '../ui/feedback';
import { DocumentCard } from './DocumentCard';
import { deleteDocument } from '../../lib/api';
import { useConfirmDelete } from '../../hooks';
import type { Document } from '../../types';
import { Card } from '../ui/cards';
import {
    BORDERS,
    SHADOWS,
    RADIUS
} from '../../constants/styles';

interface DocumentsListProps {
    projectId: string | number;
    projectTitle?: string;
    documents: Document[];
    isGenerating: boolean;
    generatingDocTitle?: string;
    onMutate?: () => void;
    onDocumentClick: (doc: Document) => void;
}

export function DocumentsList({
    projectId,
    projectTitle,
    documents,
    isGenerating,
    generatingDocTitle,
    onMutate,
    onDocumentClick
}: DocumentsListProps) {
    const { confirmingId, handleDelete } = useConfirmDelete<number>();

    const handleDeleteClick = async (documentId: number) => {
        handleDelete(async () => {
            await deleteDocument(Number(projectId), documentId);
            onMutate?.();
        }, documentId);
    };

    // Sort documents by created_at descending (newest first)
    const sortedDocuments = useMemo(() => {
        if (!documents) return [];
        return [...documents].sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
        });
    }, [documents]);

    if (documents.length === 0 && !isGenerating) {
        return null;
    }

    return (
        <div className={`
      ${BORDERS.thick}
      border-black
      ${RADIUS.normal}
      ${SHADOWS.medium}
      bg-white
      p-6
    `}>
            <h2 className="text-xl font-black text-black mb-4">Documents générés</h2>

            <div className="space-y-3">
                {/* Show generating placeholder as a card */}
                {isGenerating && (
                    <Card className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 text-orange-500">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22h11A2.5 2.5 0 0 0 20 19.5v-15A2.5 2.5 0 0 0 17.5 2h-11A2.5 2.5 0 0 0 4 4.5z" />
                                    <path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h6" />
                                </svg>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-black font-bold truncate">
                                    {generatingDocTitle || projectTitle || 'Document'}
                                </h3>
                                <div className="text-slate-600 text-sm mt-1 font-medium">
                                    En cours de génération...
                                </div>
                            </div>

                            <div className="flex-shrink-0">
                                <Badge color="amber">
                                    <ShinyText size="sm">Génération...</ShinyText>
                                </Badge>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Show all documents */}
                {sortedDocuments.map((doc) => (
                    <DocumentCard
                        key={doc.id}
                        document={doc}
                        projectTitle={projectTitle}
                        isConfirmingDelete={confirmingId === doc.id}
                        onClick={() => onDocumentClick(doc)}
                        onDelete={() => handleDeleteClick(doc.id)}
                    />
                ))}
            </div>
        </div>
    );
}
