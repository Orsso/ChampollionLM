import { useState } from 'react';
import { useProjectsWithPolling } from '../hooks/useProjectsWithPolling';
import { ProjectList } from '../components/project/ProjectList';
import { CreateProjectModal } from '../components/project/CreateProjectModal';
import { BrutalPageHeader } from '../components/ui/layout';
import { BRUTAL_BORDERS, BRUTAL_SHADOWS, BRUTAL_RADIUS, TRANSITIONS } from '../constants/styles';

export function Dashboard() {
  const { projects, isLoading } = useProjectsWithPolling();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
          <input
            type="search"
            placeholder="Rechercher un projet..."
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`w-full md:w-96 px-4 py-3 bg-white ${BRUTAL_BORDERS.normal} ${isSearchFocused ? 'border-orange-500' : 'border-black'} ${BRUTAL_RADIUS.normal} text-black placeholder-gray-400 font-medium focus:outline-none ${isSearchFocused ? BRUTAL_SHADOWS.orange : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'} transition-all ${TRANSITIONS.fast}`}
          />
        </div>

        {/* Project list (already brutal from Phase 4) */}
        <ProjectList projects={projects} isLoading={isLoading} />
      </div>

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}

