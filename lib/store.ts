import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Task, Project, Tag, ViewMode, FilterState, TaskStatus, Subtask } from '@/types';

interface TaskStore {
  // Data
  tasks: Task[];
  projects: Project[];
  tags: Tag[];
  currentUserId: string | null; // ID dell'utente corrente
  
  // UI State
  viewMode: ViewMode;
  selectedDate: string | null;
  filters: FilterState;
  sidebarOpen: boolean;
  
  // User Actions
  setCurrentUserId: (userId: string | null) => void;
  
  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  toggleTaskImportant: (id: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
  reorderTasks: (tasks: Task[]) => void;
  
  // Subtask Actions
  addSubtask: (taskId: string, title: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  toggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
  
  // Project Actions
  addProject: (name: string, color: string, userId: string) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Tag Actions
  addTag: (name: string, color: string, userId: string) => Tag;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  
  // UI Actions
  setViewMode: (mode: ViewMode) => void;
  setSelectedDate: (date: string | null) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  toggleSidebar: () => void;
  
  // Computed - filtrano per userId corrente
  getFilteredTasks: () => Task[];
  getTasksByDate: (date: string) => Task[];
  getTasksByProject: (projectId: string) => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getImportantTasks: () => Task[];
  getOverdueTasks: () => Task[];
  getUserProjects: () => Project[];
  getUserTags: () => Tag[];
}

const defaultFilters: FilterState = {
  projectId: undefined,
  tags: [],
  status: undefined,
  showCompleted: true,
  showImportantOnly: false,
  searchQuery: '',
};

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      // Initial State
      tasks: [],
      projects: [],
      tags: [],
      currentUserId: null,
      viewMode: 'list',
      selectedDate: null,
      filters: defaultFilters,
      sidebarOpen: true,

      // User Actions
      setCurrentUserId: (userId) => set({ currentUserId: userId }),

      // Task Actions
      addTask: (taskData) => {
        const now = new Date().toISOString();
        const tasks = get().tasks;
        const newTask: Task = {
          ...taskData,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
          order: tasks.length,
        };
        set({ tasks: [...tasks, newTask] });
        return newTask;
      },

      updateTask: (id, updates) => {
        set({
          tasks: get().tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task
          ),
        });
      },

      deleteTask: (id) => {
        set({ tasks: get().tasks.filter((task) => task.id !== id) });
      },

      toggleTaskComplete: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (task) {
          // Se è importante e non completato, non può essere nascosto
          const newCompleted = !task.completed;
          set({
            tasks: get().tasks.map((t) =>
              t.id === id
                ? {
                    ...t,
                    completed: newCompleted,
                    status: newCompleted ? 'done' : t.status === 'done' ? 'todo' : t.status,
                    updatedAt: new Date().toISOString(),
                  }
                : t
            ),
          });
        }
      },

      toggleTaskImportant: (id) => {
        set({
          tasks: get().tasks.map((task) =>
            task.id === id
              ? { ...task, important: !task.important, updatedAt: new Date().toISOString() }
              : task
          ),
        });
      },

      moveTask: (taskId, newStatus) => {
        set({
          tasks: get().tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: newStatus,
                  completed: newStatus === 'done',
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        });
      },

      reorderTasks: (tasks) => {
        set({ tasks });
      },

      // Subtask Actions
      addSubtask: (taskId, title) => {
        const newSubtask: Subtask = {
          id: uuidv4(),
          title,
          completed: false,
        };
        set({
          tasks: get().tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: [...task.subtasks, newSubtask],
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        });
      },

      updateSubtask: (taskId, subtaskId, updates) => {
        set({
          tasks: get().tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.map((st) =>
                    st.id === subtaskId ? { ...st, ...updates } : st
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        });
      },

      deleteSubtask: (taskId, subtaskId) => {
        set({
          tasks: get().tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.filter((st) => st.id !== subtaskId),
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        });
      },

      toggleSubtaskComplete: (taskId, subtaskId) => {
        set({
          tasks: get().tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.map((st) =>
                    st.id === subtaskId ? { ...st, completed: !st.completed } : st
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        });
      },

      // Project Actions
      addProject: (name, color, userId) => {
        const newProject: Project = {
          id: uuidv4(),
          userId,
          name,
          color,
          createdAt: new Date().toISOString(),
        };
        set({ projects: [...get().projects, newProject] });
        return newProject;
      },

      updateProject: (id, updates) => {
        set({
          projects: get().projects.map((project) =>
            project.id === id ? { ...project, ...updates } : project
          ),
        });
      },

      deleteProject: (id) => {
        set({
          projects: get().projects.filter((project) => project.id !== id),
          tasks: get().tasks.map((task) =>
            task.projectId === id ? { ...task, projectId: undefined } : task
          ),
        });
      },

      // Tag Actions
      addTag: (name, color, userId) => {
        const newTag: Tag = {
          id: uuidv4(),
          userId,
          name,
          color,
        };
        set({ tags: [...get().tags, newTag] });
        return newTag;
      },

      updateTag: (id, updates) => {
        set({
          tags: get().tags.map((tag) =>
            tag.id === id ? { ...tag, ...updates } : tag
          ),
        });
      },

      deleteTag: (id) => {
        set({
          tags: get().tags.filter((tag) => tag.id !== id),
          tasks: get().tasks.map((task) => ({
            ...task,
            tags: task.tags.filter((tagId) => tagId !== id),
          })),
        });
      },

      // UI Actions
      setViewMode: (mode) => set({ viewMode: mode }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setFilters: (filters) =>
        set({ filters: { ...get().filters, ...filters } }),
      resetFilters: () => set({ filters: defaultFilters }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

      // Computed Getters - filtrano per userId corrente
      getFilteredTasks: () => {
        const { tasks, filters, currentUserId } = get();
        return tasks.filter((task) => {
          // Filtro per userId
          if (currentUserId && task.userId !== currentUserId) {
            return false;
          }
          // Task importanti non completati sono sempre visibili
          if (task.important && !task.completed) {
            // Ma applichiamo comunque altri filtri se specificati
          }

          // Filtro completati
          if (!filters.showCompleted && task.completed && !task.important) {
            return false;
          }

          // Filtro solo importanti
          if (filters.showImportantOnly && !task.important) {
            return false;
          }

          // Filtro progetto
          if (filters.projectId && task.projectId !== filters.projectId) {
            return false;
          }

          // Filtro tag
          if (filters.tags.length > 0) {
            const hasAllTags = filters.tags.every((tagId) =>
              task.tags.includes(tagId)
            );
            if (!hasAllTags) return false;
          }

          // Filtro status
          if (filters.status && task.status !== filters.status) {
            return false;
          }

          // Filtro ricerca
          if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            const matchesTitle = task.title.toLowerCase().includes(query);
            const matchesDescription = task.description?.toLowerCase().includes(query);
            if (!matchesTitle && !matchesDescription) return false;
          }

          return true;
        });
      },

      getTasksByDate: (date) => {
        const { tasks, currentUserId } = get();
        return tasks.filter((task) => {
          if (currentUserId && task.userId !== currentUserId) return false;
          return task.dueDate === date;
        });
      },

      getTasksByProject: (projectId) => {
        const { tasks, currentUserId } = get();
        return tasks.filter((task) => {
          if (currentUserId && task.userId !== currentUserId) return false;
          return task.projectId === projectId;
        });
      },

      getTasksByStatus: (status) => {
        const { tasks, currentUserId } = get();
        return tasks.filter((task) => {
          if (currentUserId && task.userId !== currentUserId) return false;
          return task.status === status;
        });
      },

      getImportantTasks: () => {
        const { tasks, currentUserId } = get();
        return tasks.filter((task) => {
          if (currentUserId && task.userId !== currentUserId) return false;
          return task.important && !task.completed;
        });
      },

      getOverdueTasks: () => {
        const { tasks, currentUserId } = get();
        const today = new Date().toISOString().split('T')[0];
        return tasks.filter((task) => {
          if (currentUserId && task.userId !== currentUserId) return false;
          return task.dueDate && task.dueDate < today && !task.completed;
        });
      },

      getUserProjects: () => {
        const { projects, currentUserId } = get();
        if (!currentUserId) return [];
        return projects.filter((project) => project.userId === currentUserId);
      },

      getUserTags: () => {
        const { tags, currentUserId } = get();
        if (!currentUserId) return [];
        return tags.filter((tag) => tag.userId === currentUserId);
      },
    }),
    {
      name: 'taskflow-storage',
      partialize: (state) => ({
        tasks: state.tasks,
        projects: state.projects,
        tags: state.tags,
        viewMode: state.viewMode,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
