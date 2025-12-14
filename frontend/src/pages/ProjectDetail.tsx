import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProject } from '../hooks/useProjects';
import { Spinner } from '../components/ui/feedback';
import { SourcesPanel } from '../components/project/SourcesPanel';
import { StudioPanel } from '../components/project/StudioPanel';
import { ProjectChatPanel } from '../components/project/ProjectChatPanel';
import { Button } from '../components/ui/buttons/Button';
import { BORDERS, SHADOWS, RADIUS } from '../constants/styles';

type TabType = 'recording' | 'chat' | 'notes';

export function ProjectDetail() {
  const { t } = useTranslation();
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
        <p className="text-gray-600 font-medium">{t('errors.notFound')}</p>
      </div>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'recording', label: t('project.sources.title') },
    { id: 'chat', label: t('project.chat.title') },
    { id: 'notes', label: t('project.studio.title') },
  ];

  const isChatMode = activeTab === 'chat';

  // Shared tab buttons component
  const TabButtons = () => (
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          variant="secondary"
          active={activeTab === tab.id}
          className="uppercase tracking-wide"
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );

  return (
    <div className={`${isChatMode ? 'h-[calc(100vh-96px)] flex flex-col overflow-hidden' : 'h-[calc(100vh-96px)] flex-1 overflow-y-auto'}`}>
      <div className={`${isChatMode ? 'flex flex-col h-full overflow-hidden' : 'max-w-7xl mx-auto w-full pb-12'}`}>
        {/* Unified Header: Back + Title | Centered Tabs | Spacer */}
        <div className={`flex items-center justify-between px-4 py-3 ${isChatMode ? 'flex-shrink-0' : 'mb-8'}`}>
          {/* Left: Back button + Project title */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="secondary"
              size="sm"
              className="bg-white text-orange-500 hover:bg-orange-50"
            >
              <span className="text-lg">←</span>
              <span className="hidden sm:inline text-sm">{t('common.back')}</span>
            </Button>
            <div className={`px-4 py-2 bg-orange-50 ${BORDERS.normal} border-black ${SHADOWS.medium} ${RADIUS.subtle}`}>
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
