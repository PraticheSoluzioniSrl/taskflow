'use client';

import { useState, useEffect } from 'react';
import { useTaskStore } from '@/lib/store';
import { Task } from '@/types';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ListView from '@/components/ListView';
import CalendarView from '@/components/CalendarView';
import KanbanView from '@/components/KanbanView';
import TaskModal from '@/components/TaskModal';
import { cn } from '@/lib/utils';

export default function Home() {
  const { viewMode, sidebarOpen, projects, filters } = useTaskStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddTask = (date?: string) => {
    setEditingTask(null);
    setDefaultDate(date);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDefaultDate(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setDefaultDate(undefined);
  };

  // Get current project name for header
  const currentProject = projects.find((p) => p.id === filters.projectId);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => useTaskStore.getState().toggleSidebar()}
        />
      )}

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 flex flex-col min-h-screen transition-all duration-300',
          sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'
        )}
      >
        <Header onAddTask={() => handleAddTask()} />

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">
              {filters.showImportantOnly
                ? 'Task Importanti'
                : currentProject
                ? currentProject.name
                : viewMode === 'calendar'
                ? 'Calendario'
                : viewMode === 'kanban'
                ? 'Board Kanban'
                : 'Tutti i Task'}
            </h1>
            {currentProject && (
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentProject.color }}
                />
                <span className="text-sm text-slate-400">Progetto</span>
              </div>
            )}
          </div>

          {/* Views */}
          {viewMode === 'list' && <ListView onEditTask={handleEditTask} />}
          {viewMode === 'calendar' && (
            <CalendarView
              onEditTask={handleEditTask}
              onAddTask={handleAddTask}
            />
          )}
          {viewMode === 'kanban' && (
            <KanbanView
              onEditTask={handleEditTask}
              onAddTask={() => handleAddTask()}
            />
          )}
        </div>
      </main>

      {/* Task Modal */}
      <TaskModal
        task={editingTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        defaultDate={defaultDate}
      />
    </div>
  );
}
