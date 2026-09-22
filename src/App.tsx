import React, { useState } from 'react';
import { ProductionProvider, useProduction } from './context/ProductionContext';
import { Header } from './components/Header';
import { PulseWidget } from './components/PulseWidget';
import { CalendarView } from './components/CalendarView';
import { ContentLayersView } from './components/ContentLayersView';
import { TasksView } from './components/TasksView';
import { PublisherView } from './components/PublisherView';
import { CallsView } from './components/CallsView';
import { BottomTabBar, MainTabType } from './components/BottomTabBar';
import { TaskDetailModal } from './components/TaskDetailModal';
import { ScriptEditorModal } from './components/ScriptEditorModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { EmptyProjectsOnboarding } from './components/EmptyProjectsOnboarding';
import { ProjectSetupModal } from './components/ProjectSetupModal';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('plan');
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

  const { 
    tasks, 
    calls,
    currentExpertId, 
    projects,
    currentProject,
    completeProjectSetup
  } = useProduction();

  // Normalize active tab for bottom bar
  const activeMainTab: MainTabType = 
    currentTab === 'calls' ? 'calls' :
    currentTab === 'tasks' ? 'tasks' :
    (currentTab === 'content' || currentTab === 'pipeline') ? 'content' :
    (currentTab === 'publish' || currentTab === 'publisher') ? 'publish' : 'plan';

  // Badge counts
  const expertTasks = tasks.filter(t => t.expertId === currentExpertId && !t.isArchived && !t.rejected);
  const expertCalls = calls.filter(c => c.expertId === currentExpertId);
  const contentCount = expertTasks.filter(t => t.kind !== 'non_content').length;
  const nonContentCount = tasks.filter(
    t => t.kind === 'non_content' && t.expertId === currentExpertId && (t.nonContentStatus === 'todo' || !t.nonContentStatus)
  ).length;
  const publishCount = expertTasks.filter(t => 
    t.kind !== 'non_content' &&
    (t.type === 'reels' || t.type === 'carousel' || t.type === 'stories') &&
    ((t.editingStatus === 'green' && t.placement === 'unassigned') || t.placement === 'trial')
  ).length;

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-black flex flex-col font-sans">
      {/* Header with Project Selector */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenCreateTask={() => setIsCreateTaskModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 space-y-5 pb-24">
        {projects.length === 0 ? (
          <EmptyProjectsOnboarding />
        ) : currentProject && !currentProject.isSetupComplete ? (
          <ProjectSetupModal 
            project={currentProject}
            onComplete={(members) => completeProjectSetup(currentProject.id, members)}
          />
        ) : (
          <>
            {/* SCREEN 1: План & Календарь */}
            {(currentTab === 'plan' || currentTab === 'calendar') && (
              <div className="space-y-4">
                <PulseWidget />
                <CalendarView 
                  onNavigateToContent={(taskId) => {
                    setCurrentTab('content');
                  }}
                />
              </div>
            )}

            {/* SCREEN 2: Контент (Послойный конвейер) */}
            {(currentTab === 'content' || currentTab === 'pipeline') && (
              <ContentLayersView />
            )}

            {/* SCREEN 3: Задачи (Вне контента: организационные, технические и др.) */}
            {currentTab === 'tasks' && (
              <TasksView onOpenCreateTask={() => setIsCreateTaskModalOpen(true)} />
            )}

            {/* SCREEN 4: Публикация & 48ч тесты */}
            {(currentTab === 'publish' || currentTab === 'publisher') && (
              <PublisherView />
            )}

            {/* SCREEN 5: Созвоны */}
            {currentTab === 'calls' && <CallsView />}
          </>
        )}
      </main>

      {/* Fixed Bottom TabBar */}
      {projects.length > 0 && currentProject?.isSetupComplete && (
        <BottomTabBar
          activeTab={activeMainTab}
          onTabChange={(tab) => setCurrentTab(tab)}
          badgeCounts={{
            content: contentCount > 0 ? contentCount : undefined,
            tasks: nonContentCount > 0 ? nonContentCount : undefined,
            publish: publishCount > 0 ? publishCount : undefined,
            calls: expertCalls.length > 0 ? expertCalls.length : undefined
          }}
        />
      )}

      {/* Modals */}
      <TaskDetailModal />
      <ScriptEditorModal />
      <CreateTaskModal 
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ProductionProvider>
      <AppContent />
    </ProductionProvider>
  );
}
