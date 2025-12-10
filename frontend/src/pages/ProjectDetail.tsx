import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import { Spinner } from '../components/ui/feedback';
import { SourcesPanel } from '../components/project/SourcesPanel';
import { StudioPanel } from '../components/project/StudioPanel';
import { ProjectChatPanel } from '../components/project/ProjectChatPanel';
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
      }, 3000);
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

  const isChatMode = activeTab === 'chat';

  // Shared tab buttons component
  const TabButtons = () => (
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 text-xs sm:text-sm uppercase tracking-wide font-bold ${BRUTAL_RADIUS.normal} ${activeTab === tab.id
            ? `${BRUTAL_BUTTON_VARIANTS.primary} ${BRUTAL_SHADOWS.medium}`
            : `${BRUTAL_BUTTON_VARIANTS.secondary} ${BRUTAL_SHADOWS.medium}`
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`${isChatMode ? 'h-[calc(100vh-160px)] flex flex-col overflow-hidden' : 'flex-1'}`}>
      <div className={`${isChatMode ? 'flex flex-col h-full overflow-hidden' : 'max-w-7xl mx-auto w-full'}`}>
        {/* Unified Header: Back + Title | Centered Tabs | Spacer */}
        <div className={`flex items-center justify-between px-4 py-3 ${isChatMode ? 'flex-shrink-0' : 'mb-8'}`}>
          {/* Left: Back button + Project title */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => navigate('/dashboard')}
              className={`inline-flex items-center gap-2 px-3 py-2 bg-white text-orange-500 ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_SHADOWS.small} font-bold transition-all ${TRANSITIONS.fast} hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-orange-50 ${BRUTAL_RADIUS.subtle}`}
            >
              <span className="text-lg">←</span>
              <span className="hidden sm:inline text-sm">Retour</span>
            </button>
            <div className={`px-4 py-2 bg-orange-50 ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_SHADOWS.medium} ${BRUTAL_RADIUS.subtle}`}>
              <h1 className="font-bold text-base sm:text-lg text-black truncate max-w-[180px] sm:max-w-xs tracking-tight">
                {project.title}
              </h1>
            </div>
          </div>

          {/* Center: Tabs */}
          <div className="flex-1 flex justify-center">
            <TabButtons />
          </div>

          {/* Right: Spacer for balance */}
          <div className="w-[200px] sm:w-[280px] flex-shrink-0" />
        </div>

        {/* Tab Content */}
        <div className={`${isChatMode ? 'flex-1 overflow-hidden px-4 pb-4' : ''}`}>
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
