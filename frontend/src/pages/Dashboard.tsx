import { useState, useMemo } from 'react';
import { useProjectsWithPolling } from '../hooks/useProjectsWithPolling';
import { ProjectList } from '../components/project/ProjectList';
import { CreateProjectModal } from '../components/project/CreateProjectModal';
import { BrutalPageHeader } from '../components/ui/layout';
import { BrutalInput } from '../components/ui/forms';

export function Dashboard() {
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
        {/* Page header with brutal styling */}
        <BrutalPageHeader
          title="Projets"
          subtitle="Gérez tous vos projets Champollion"
          variant="colored"
        />

        {/* Search bar with brutal styling */}
        <div className="mb-6">
          <BrutalInput
            type="search"
            placeholder="Rechercher un projet..."
            className="md:w-96"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Project list (already brutal from Phase 4) */}
        <ProjectList projects={filteredProjects} isLoading={isLoading} />
      </div>

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
