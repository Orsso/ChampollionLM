import { useNavigate } from 'react-router-dom';
import type { Project } from '../../types';
import { Badge, Spinner, ShinyText } from '../ui/feedback';
import { ConfirmDeleteButton } from '../ui/buttons';
import { useDeleteProject } from '../../hooks/useProjects';
import { useConfirmDelete } from '../../hooks';
import { formatDate } from '../../utils/formatters';
import {
  BRUTAL_BORDERS,
  BRUTAL_RADIUS,
  BRUTAL_CARD_VARIANTS,
  TRANSITIONS
} from '../../constants/styles';

/**
 * Props for the ProjectList component.
 */
interface ProjectListProps {
  projects: Project[] | undefined;
  isLoading: boolean;
}

/**
 * Displays a list of user projects with status badges and delete actions.
 * Navigates to project detail on click, supports two-step delete confirmation.
 */
export function ProjectList({ projects, isLoading }: ProjectListProps) {
  const navigate = useNavigate();
  const { deleteProject } = useDeleteProject();
  const { isConfirmingId, handleDelete } = useConfirmDelete<number>();

  const getStatusBadge = (project: Project) => {
    const documentStatus = project.document_status?.status;
    if (documentStatus === 'pending' || documentStatus === 'in_progress') {
      return (
        <Badge color="amber">
          <ShinyText size="sm">Generation de document en cours</ShinyText>
        </Badge>
      );
    }

    const processingStatus = project.processing_status?.status;
    const isProcessing = project.status === 'processing' ||
      processingStatus === 'pending' ||
      processingStatus === 'in_progress';

    if (isProcessing) {
      return (
        <Badge color="amber">
          <ShinyText size="sm">Traitement en cours</ShinyText>
        </Badge>
      );
    }

    // Show "Pret" badge only temporarily (within 10 seconds of status update)
    if (project.status === 'ready' && project.status_updated_at) {
      const statusTime = new Date(project.status_updated_at).getTime();
      const now = Date.now();
      const isRecent = (now - statusTime) < 10000; // 10 seconds
      
      if (isRecent) {
        return <Badge color="green">Pret</Badge>;
      }
      return null; // No badge for older "ready" status
    }

    if (project.status === 'draft') {
      return <Badge color="gray">Brouillon</Badge>;
    }

    return null;
  };

  const handleDeleteClick = (projectId: number) => {
    handleDelete(async () => {
      await deleteProject(projectId);
    }, projectId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spinner color="orange" size="lg" />
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-800 text-xl font-bold">Aucun projet pour l'instant</p>
        <p className="text-slate-600 mt-2">
          Utilisez le bouton dans la barre de navigation pour creer votre premier projet
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {projects.map((project) => (
        <div
          key={project.id}
          onClick={() => navigate(`/projects/${project.id}`)}
          className={`
            ${BRUTAL_CARD_VARIANTS.default}
            ${BRUTAL_RADIUS.normal}
            p-6
            cursor-pointer
            transition-all ${TRANSITIONS.fast}
            hover:translate-x-[2px] hover:translate-y-[2px]
            hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            active:translate-x-[4px] active:translate-y-[4px]
            active:shadow-none
          `}
        >
          <div className="flex items-center gap-6">
            <div className={`
              flex-shrink-0 w-16 h-16 flex items-center justify-center
              bg-orange-500 ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.subtle}
              text-4xl
            `}>
              📁
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-black text-black mb-2 truncate">
                {project.title}
              </h3>

              {(() => {
                const sourcesCount = project.sources_count ?? project.sources?.length ?? 0;
                const documentsCount = project.documents_count ?? project.documents?.length ?? 0;
                const statusBadge = getStatusBadge(project);
                return (
                  <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
                    <span className="text-black">
                      {sourcesCount} source{sourcesCount > 1 ? 's' : ''}
                    </span>
                    <span className="text-black">
                      {documentsCount} document{documentsCount > 1 ? 's' : ''}
                    </span>
                    <span className="text-slate-600">
                      {formatDate(project.status_updated_at)}
                    </span>
                    {statusBadge && <div>{statusBadge}</div>}
                  </div>
                );
              })()}
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <ConfirmDeleteButton
                isConfirming={isConfirmingId(project.id)}
                onDelete={() => handleDeleteClick(project.id)}
                ariaLabel={isConfirmingId(project.id) ? `Confirmer la suppression de ${project.title}` : `Supprimer ${project.title}`}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

