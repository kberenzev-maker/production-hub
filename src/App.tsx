import React, { useState, useEffect } from 'react';
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
import { TelegramAuthGate } from './components/TelegramAuthGate';
import { AccessDeniedScreen } from './components/AccessDeniedScreen';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('plan');
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

  // Initialize Telegram WebApp (ready, expand, theme)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      try {
        tg.ready();
        tg.expand();
        if (tg.setHeaderColor) tg.setHeaderColor('#F2F2F7');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#F2F2F7');
      } catch (e) {
        console.warn('Telegram WebApp init error:', e);
      }
    }
  }, []);

  // Telegram WebApp Authentication Gate & Dev Mode
  const isTelegram = typeof window !== 'undefined' && Boolean(
    ((window as any).Telegram?.WebApp?.initData && (window as any).Telegram?.WebApp?.initData.length > 0) ||
    (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id
  );

  const [isDevUnlocked, setIsDevUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('dev') === 'true' || params.get('dev') === '1') {
        return true;
      }
      return localStorage.getItem('ph_dev_access') === 'true';
    } catch {
      return false;
    }
  });

  const { 
    tasks, 
    calls,
    currentExpertId, 
    projects,
    currentProject,
    completeProjectSetup
  } = useProduction();

  // If outside Telegram and dev mode is not unlocked, show TelegramAuthGate
  if (!isTelegram && !isDevUnlocked) {
    return <TelegramAuthGate onDevUnlock={() => setIsDevUnlocked(true)} />;
  }

  // Check if current Telegram user is an authorized member of this project
  const tgUser = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp?.initDataUnsafe?.user : null;
  const isAuthorizedMember = !tgUser || isDevUnlocked || !currentProject || !currentProject.isSetupComplete || (
    currentProject.members && currentProject.members.some(m => 
      (tgUser.id && m.telegramUserId === tgUser.id) ||
      (tgUser.username && m.username?.toLowerCase() === `@${tgUser.username.toLowerCase()}`) ||
      (tgUser.username && m.username?.toLowerCase() === tgUser.username.toLowerCase()) ||
      (m.isCreator && !m.telegramUserId)
    )
  );

  if (currentProject && currentProject.isSetupComplete && !isAuthorizedMember) {
    return <AccessDeniedScreen projectName={currentProject.title} />;
  }

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
