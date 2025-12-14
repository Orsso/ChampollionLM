import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Project } from '../../types';
import { Badge, Spinner, ShinyText } from '../ui/feedback';
import { ConfirmDeleteButton } from '../ui/buttons';
import { useDeleteProject } from '../../hooks/useProjects';
import { useConfirmDelete } from '../../hooks';
import { formatDate } from '../../utils/formatters';
import { Card } from '../ui/cards';
import {
  BORDERS,
  RADIUS
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { deleteProject } = useDeleteProject();
  const { isConfirmingId, handleDelete } = useConfirmDelete<number>();

  const getStatusBadge = (project: Project) => {
    const documentStatus = project.document_status?.status;
    if (documentStatus === 'pending' || documentStatus === 'in_progress') {
      return (
        <Badge color="amber">
          <ShinyText size="sm">{t('projects.status.documentGeneration')}</ShinyText>
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
          <ShinyText size="sm">{t('projects.status.processing')}</ShinyText>
        </Badge>
      );
    }

    // Show "Ready" badge only temporarily (within 10 seconds of status update)
    if (project.status === 'ready' && project.status_updated_at) {
      const statusTime = new Date(project.status_updated_at).getTime();
      const now = Date.now();
      const isRecent = (now - statusTime) < 10000; // 10 seconds

      if (isRecent) {
        return <Badge color="green">{t('projects.status.ready')}</Badge>;
      }
      return null; // No badge for older "ready" status
    }

    if (project.status === 'draft') {
      return <Badge color="gray">{t('projects.status.draft')}</Badge>;
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
        <p className="text-slate-800 text-xl font-bold">{t('projects.noProjects')}</p>
        <p className="text-slate-600 mt-2">
          {t('projects.noProjectsHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {projects.map((project) => (
        <Card
          key={project.id}
          onClick={() => navigate(`/projects/${project.id}`)}
          className={`p-6`}
          hoverEffect={true}
        >
          <div className="flex items-center gap-6">
            <div className={`
              flex-shrink-0 w-16 h-16 flex items-center justify-center
              bg-orange-500 ${BORDERS.normal} border-black ${RADIUS.subtle}
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
                      {sourcesCount} {sourcesCount > 1 ? t('projects.sourcesPlural') : t('projects.sources')}
                    </span>
                    <span className="text-black">
                      {documentsCount} {documentsCount > 1 ? t('projects.documentsPlural') : t('projects.documents')}
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
                ariaLabel={isConfirmingId(project.id) ? t('projects.deleteConfirm', { title: project.title }) : t('projects.deleteAction', { title: project.title })}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
