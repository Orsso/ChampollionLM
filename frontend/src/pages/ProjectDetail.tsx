import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import { Spinner } from '../components/ui/feedback';
import { SourcesPanel } from '../components/project/SourcesPanel';
import { StudioPanel } from '../components/project/StudioPanel';
import { ProjectChatPanel } from '../components/project/ProjectChatPanel';
import { BrutalPageHeader } from '../components/ui/layout';
import { BRUTAL_BORDERS, BRUTAL_SHADOWS, BRUTAL_RADIUS, BRUTAL_BUTTON_VARIANTS, TRANSITIONS } from '../constants/styles';

type TabType = 'recording' | 'chat' | 'notes';

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { project, isLoading, mutate } = useProject(projectId);
  const [activeTab, setActiveTab] = useState<TabType>('recording');

  // Poll for updates when processing or generating document
  useEffect(() => {
    if (!project) return;

    const isProcessing = project.status === 'processing' ||
      project.processing_status?.status === 'pending' ||
      project.processing_status?.status === 'in_progress';

    const isGeneratingDocument = project.document_status?.status === 'pending' ||
      project.document_status?.status === 'in_progress';

    if (isProcessing || isGeneratingDocument) {
      const interval = setInterval(() => {
        mutate();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [project, mutate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner color="orange" size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 font-medium">Projet non trouvé</p>
      </div>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'recording', label: 'Sources' },
    { id: 'chat', label: 'Chat' },
    { id: 'notes', label: 'Studio' },
  ];

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header and Back button aligned */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-white text-orange-500 ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_SHADOWS.small} font-bold transition-all ${TRANSITIONS.fast} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-orange-50`}
          >
            <span className="text-xl">←</span>
            <span className="hidden sm:inline">Retour aux projets</span>
            <span className="sm:hidden">Retour</span>
          </button>

          <div className="flex-grow">
            <BrutalPageHeader
              title={project.title}
              subtitle={project.description}
              variant="colored"
              compact
              className="!mb-0 !mx-0 w-full"
            />
          </div>
        </div>

        {/* Brutal tabs with global button style */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm uppercase tracking-wide whitespace-nowrap ${BRUTAL_RADIUS.normal} ${activeTab === tab.id
                  ? `${BRUTAL_BUTTON_VARIANTS.primary} ${BRUTAL_SHADOWS.medium} active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`
                  : `${BRUTAL_BUTTON_VARIANTS.secondary} ${BRUTAL_SHADOWS.medium} active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content with brutal container */}
        <div>
          {activeTab === 'recording' && (
            <SourcesPanel
              projectId={project.id}
              sources={project.sources || []}
              processingStatus={project.processing_status}
              onMutate={mutate}
            />
          )}
          {activeTab === 'chat' && (
            <ProjectChatPanel
              projectId={project.id}
              sources={project.sources || []}
            />
          )}
          {activeTab === 'notes' && (
            <StudioPanel projectId={project.id} onMutate={mutate} />
          )}
        </div>
      </div>
    </div>
  );
}

