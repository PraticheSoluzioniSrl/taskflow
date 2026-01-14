'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTaskStore } from '@/lib/store';
import { useDatabaseSync } from '@/hooks/useDatabaseSync';
import { PROJECT_COLORS } from '@/types';
import {
  LayoutList,
  Calendar,
  Kanban,
  Star,
  FolderOpen,
  Tag,
  Plus,
  ChevronDown,
  ChevronRight,
  Settings,
  Menu,
  X,
  AlertCircle,
  CheckCircle2,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GoogleCalendarSync from './GoogleCalendarSync';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { data: session } = useSession();
  const {
    viewMode,
    setViewMode,
    projects,
    tags,
    filters,
    setFilters,
    tasks,
    sidebarOpen,
    toggleSidebar,
    setCurrentUserId,
    getUserProjects,
    getUserTags,
  } = useTaskStore();
  const { addProject: syncAddProject, addTag: syncAddTag } = useDatabaseSync();

  // Set current user ID when session is available
  useEffect(() => {
    if (session?.user?.email) {
      setCurrentUserId(session.user.email);
    }
  }, [session, setCurrentUserId]);

  // Get filtered projects and tags for current user
  const userProjects = getUserProjects();
  const userTags = getUserTags();

  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PROJECT_COLORS[0]);

  const importantCount = tasks.filter((t) => t.important && !t.completed).length;
  const overdueCount = tasks.filter((t) => {
    if (!t.dueDate || t.completed) return false;
    return new Date(t.dueDate) < new Date(new Date().toDateString());
  }).length;

  const handleAddProject = async () => {
    if (newProjectName.trim() && session?.user?.email) {
      await syncAddProject(newProjectName.trim(), newProjectColor, session.user.email);
      setNewProjectName('');
      setShowAddProject(false);
    }
  };

  const handleAddTag = async () => {
    if (newTagName.trim() && session?.user?.email) {
      await syncAddTag(newTagName.trim(), newTagColor, session.user.email);
      setNewTagName('');
      setShowAddTag(false);
    }
  };

  return (
    <aside
      className={cn(
        'fixed lg:sticky inset-y-0 left-0 z-40',
        'w-64 sm:w-72 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/50',
        'flex flex-col transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">TaskFlow</span>
        </div>
        <button
          onClick={onClose || toggleSidebar}
          className="lg:hidden btn-icon"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Views */}
        <div className="space-y-1">
          <button
            onClick={() => {
              setFilters({ projectId: undefined });
              setViewMode('list');
            }}
            className={cn(
              'sidebar-link w-full',
              viewMode === 'list' && !filters.projectId && 'sidebar-link-active'
            )}
          >
            <Home className="w-5 h-5" />
            <span>Tutti i Task</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'sidebar-link w-full',
              viewMode === 'list' && filters.projectId && 'sidebar-link-active'
            )}
          >
            <LayoutList className="w-5 h-5" />
            <span>Vista Lista</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              'sidebar-link w-full',
              viewMode === 'calendar' && 'sidebar-link-active'
            )}
          >
            <Calendar className="w-5 h-5" />
            <span>Calendario</span>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              'sidebar-link w-full',
              viewMode === 'kanban' && 'sidebar-link-active'
            )}
          >
            <Kanban className="w-5 h-5" />
            <span>Kanban</span>
          </button>
        </div>

        {/* Quick Filters */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Filtri Rapidi
          </p>
          <button
            onClick={() => setFilters({ showImportantOnly: !filters.showImportantOnly })}
            className={cn(
              'sidebar-link w-full justify-between',
              filters.showImportantOnly && 'sidebar-link-active'
            )}
          >
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-400" />
              <span>Importanti</span>
            </div>
            {importantCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                {importantCount}
              </span>
            )}
          </button>
          {overdueCount > 0 && (
            <button
              onClick={() => {/* TODO: filter overdue */}}
              className="sidebar-link w-full justify-between text-red-400"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <span>In Ritardo</span>
              </div>
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">
                {overdueCount}
              </span>
            </button>
          )}
        </div>

        {/* Projects */}
        <div className="space-y-1">
          <button
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="flex items-center justify-between w-full px-3 py-2 text-slate-400 hover:text-white"
          >
            <div className="flex items-center gap-2">
              {projectsExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <FolderOpen className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Progetti
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAddProject(true);
              }}
              className="p-1 hover:bg-slate-800 rounded"
            >
              <Plus className="w-4 h-4" />
            </button>
          </button>

          {projectsExpanded && (
            <div className="ml-4 space-y-1">
              {userProjects.map((project) => {
                const count = tasks.filter((t) => t.projectId === project.id && !t.completed).length;
                return (
                  <button
                    key={project.id}
                    onClick={() => setFilters({ projectId: project.id })}
                    className={cn(
                      'sidebar-link w-full justify-between',
                      filters.projectId === project.id && 'sidebar-link-active'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="truncate">{project.name}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-xs text-slate-500">{count}</span>
                    )}
                  </button>
                );
              })}

              {showAddProject && (
                <div className="p-3 bg-slate-900/60 rounded-lg space-y-3">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Nome progetto"
                    className="input-base text-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
                  />
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewProjectColor(color)}
                        className={cn(
                          'w-6 h-6 rounded-full transition-transform',
                          newProjectColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddProject} className="btn-primary text-sm flex-1">
                      Aggiungi
                    </button>
                    <button
                      onClick={() => setShowAddProject(false)}
                      className="btn-ghost text-sm"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              )}

              {userProjects.length === 0 && !showAddProject && (
                <p className="px-3 py-2 text-sm text-slate-500">
                  Nessun progetto
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-1">
          <button
            onClick={() => setTagsExpanded(!tagsExpanded)}
            className="flex items-center justify-between w-full px-3 py-2 text-slate-400 hover:text-white"
          >
            <div className="flex items-center gap-2">
              {tagsExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Tag className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Tag
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAddTag(true);
              }}
              className="p-1 hover:bg-slate-800 rounded"
            >
              <Plus className="w-4 h-4" />
            </button>
          </button>

          {tagsExpanded && (
            <div className="ml-4 space-y-1">
              {userTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    const newTags = filters.tags.includes(tag.id)
                      ? filters.tags.filter((t) => t !== tag.id)
                      : [...filters.tags, tag.id];
                    setFilters({ tags: newTags });
                  }}
                  className={cn(
                    'sidebar-link w-full',
                    filters.tags.includes(tag.id) && 'sidebar-link-active'
                  )}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="truncate">{tag.name}</span>
                </button>
              ))}

              {showAddTag && (
                <div className="p-3 bg-slate-900/60 rounded-lg space-y-3">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Nome tag"
                    className="input-base text-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        className={cn(
                          'w-6 h-6 rounded-full transition-transform',
                          newTagColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddTag} className="btn-primary text-sm flex-1">
                      Aggiungi
                    </button>
                    <button
                      onClick={() => setShowAddTag(false)}
                      className="btn-ghost text-sm"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              )}

              {userTags.length === 0 && !showAddTag && (
                <p className="px-3 py-2 text-sm text-slate-500">
                  Nessun tag
                </p>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800/50 space-y-3">
        <GoogleCalendarSync />
        <Link href="/settings" className="sidebar-link w-full">
          <Settings className="w-5 h-5" />
          <span>Impostazioni</span>
        </Link>
      </div>
    </aside>
  );
}
