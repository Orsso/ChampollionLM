import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectsWithPolling } from '../hooks/useProjectsWithPolling';
import { ProjectList } from '../components/project/ProjectList';
import { CreateProjectModal } from '../components/project/CreateProjectModal';
import { PageHeader } from '../components/ui/layout';
import { StyledInput } from '../components/ui/forms';

export function Dashboard() {
  const { t } = useTranslation();
  const { projects, isLoading } = useProjectsWithPolling();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase().trim();
    return projects.filter(project =>
      project.title?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <PageHeader
          title={t('dashboard.title')}
          subtitle={t('dashboard.subtitle')}
          variant="colored"
        />

        {/* Search bar */}
        <div className="mb-6">
          <StyledInput
            type="search"
            placeholder={`${t('common.search')}...`}
            className="md:w-96"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Project list */}
        <ProjectList projects={filteredProjects} isLoading={isLoading} />
      </div>

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
