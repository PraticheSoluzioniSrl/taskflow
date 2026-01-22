// File: lib/store.ts
// Store modificato per usare database invece di localStorage

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Task, Project, Tag, ViewMode, FilterState, TaskStatus, Subtask } from '@/types';

interface TaskStore {
  // Data
  tasks: Task[];
  projects: Project[];
  tags: Tag[];
  currentUserId: string | null;
  
  // UI State
  viewMode: ViewMode;
  selectedDate: string | null;
  filters: FilterState;
  sidebarOpen: boolean;
  
  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
  
  // User Actions
  setCurrentUserId: (userId: string | null) => void;
  
  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'version' | 'lastModified'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  toggleTaskImportant: (id: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  reorderTasks: (tasks: Task[]) => Promise<void>;
  
  // Subtask Actions
  addSubtask: (taskId: string, subtask: Omit<Subtask, 'id'>) => Promise<void>;
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  toggleSubtaskComplete: (taskId: string, subtaskId: string) => Promise<void>;
  
  // Project Actions
  addProject: (name: string, color: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Tag Actions
  addTag: (name: string, color: string, userId: string) => Promise<void>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  
  // UI Actions
  setViewMode: (mode: ViewMode) => void;
  setSelectedDate: (date: string | null) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  toggleSidebar: () => void;
  
  // Computed - filtriamo per userId corrente
  getFilteredTasks: () => Task[];
  getTasksByDate: (date: string) => Task[];
  getTasksByProject: (projectId: string) => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getImportantTasks: () => Task[];
  getOverdueTasks: () => Task[];
  getUserProjects: () => Project[];
  getUserTags: () => Tag[];
  
  // Sync actions
  loadUserData: () => Promise<void>;
  syncTasks: () => Promise<void>;
}

const defaultFilters: FilterState = {
  projectId: undefined,
  tags: [],
  status: undefined,
  searchQuery: '',
  showCompleted: true,
  showImportantOnly: false,
  showOverdueOnly: false,
};

export const useTaskStore = create<TaskStore>((set, get) => ({
  // Initial state
  tasks: [],
  projects: [],
  tags: [],
  currentUserId: null,
  viewMode: 'kanban',
  selectedDate: null,
  filters: defaultFilters,
  sidebarOpen: true,
  isLoading: false,
  isSyncing: false,
  
  // User Actions
  setCurrentUserId: (userId) => {
    set({ currentUserId: userId });
    if (userId) {
      get().loadUserData();
    }
  },
  
  // Load all user data from API
  loadUserData: async () => {
    set({ isLoading: true });
    try {
      // Carica tasks, projects e tags in parallelo
      const [tasksRes, projectsRes, tagsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects'),
        fetch('/api/tags'),
      ]);
      
      if (tasksRes.ok && projectsRes.ok && tagsRes.ok) {
        const tasksData = await tasksRes.json();
        const projectsData = await projectsRes.json();
        const tagsData = await tagsRes.json();
        
        set({
          tasks: tasksData.tasks || [],
          projects: projectsData.projects || [],
          tags: tagsData.tags || [],
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Sync tasks from API
  syncTasks: async () => {
    set({ isSyncing: true });
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        set({ tasks: data.tasks || [] });
      }
    } catch (error) {
      console.error('Error syncing tasks:', error);
    } finally {
      set({ isSyncing: false });
    }
  },
  
  // Task Actions
  addTask: async (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: get().tasks.length,
      version: 1,
      lastModified: Date.now(),
    };
    
    // Ottimistic update
    set((state) => ({ tasks: [...state.tasks, newTask] }));
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      
      if (!response.ok) {
        // Rollback on error
        set((state) => ({
          tasks: state.tasks.filter(t => t.id !== newTask.id)
        }));
        console.error('Failed to create task');
      }
    } catch (error) {
      // Rollback on error
      set((state) => ({
        tasks: state.tasks.filter(t => t.id !== newTask.id)
      }));
      console.error('Error creating task:', error);
    }
  },
  
  updateTask: async (id, updates) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    
    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: task.version + 1,
    };
    
    // Ottimistic update
    set((state) => ({
      tasks: state.tasks.map(t => t.id === id ? updatedTask : t)
    }));
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      });
      
      if (!response.ok) {
        // Rollback on error
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? task : t)
        }));
        console.error('Failed to update task');
      }
    } catch (error) {
      // Rollback on error
      set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? task : t)
      }));
      console.error('Error updating task:', error);
    }
  },
  
  deleteTask: async (id) => {
    const tasks = get().tasks;
    
    // Ottimistic update
    set((state) => ({
      tasks: state.tasks.filter(t => t.id !== id)
    }));
    
    try {
      const response = await fetch(`/api/tasks?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // Rollback on error
        set({ tasks });
        console.error('Failed to delete task');
      }
    } catch (error) {
      // Rollback on error
      set({ tasks });
      console.error('Error deleting task:', error);
    }
  },
  
  toggleTaskComplete: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    
    await get().updateTask(id, { 
      completed: !task.completed,
      status: !task.completed ? 'fatto' : task.status === 'fatto' ? 'in corso' : task.status,
    });
  },
  
  toggleTaskImportant: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    
    await get().updateTask(id, { important: !task.important });
  },
  
  moveTask: async (taskId, newStatus) => {
    await get().updateTask(taskId, { status: newStatus });
  },
  
  reorderTasks: async (tasks) => {
    const updatedTasks = tasks.map((task, index) => ({
      ...task,
      order: index,
      updatedAt: new Date().toISOString(),
    }));
    
    set({ tasks: updatedTasks });
    
    // Sync all tasks
    try {
      await Promise.all(
        updatedTasks.map(task =>
          fetch('/api/tasks', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task),
          })
        )
      );
    } catch (error) {
      console.error('Error reordering tasks:', error);
    }
  },
  
  // Subtask Actions
  addSubtask: async (taskId, subtaskData) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newSubtask: Subtask = {
      ...subtaskData,
      id: uuidv4(),
    };
    
    const updatedSubtasks = [...(task.subtasks || []), newSubtask];
    await get().updateTask(taskId, { subtasks: updatedSubtasks });
  },
  
  updateSubtask: async (taskId, subtaskId, updates) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    
    const updatedSubtasks = task.subtasks.map(s =>
      s.id === subtaskId ? { ...s, ...updates } : s
    );
    
    await get().updateTask(taskId, { subtasks: updatedSubtasks });
  },
  
  deleteSubtask: async (taskId, subtaskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    
    const updatedSubtasks = task.subtasks.filter(s => s.id !== subtaskId);
    await get().updateTask(taskId, { subtasks: updatedSubtasks });
  },
  
  toggleSubtaskComplete: async (taskId, subtaskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;
    
    await get().updateSubtask(taskId, subtaskId, { completed: !subtask.completed });
  },
  
  // Project Actions
  addProject: async (name, color) => {
    const newProject: Project = {
      id: uuidv4(),
      name,
      color,
      version: 1,
      ultimo_modificato: new Date().toISOString(),
    };
    
    // Ottimistic update
    set((state) => ({ projects: [...state.projects, newProject] }));
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      
      if (!response.ok) {
        set((state) => ({
          projects: state.projects.filter(p => p.id !== newProject.id)
        }));
        console.error('Failed to create project');
      }
    } catch (error) {
      set((state) => ({
        projects: state.projects.filter(p => p.id !== newProject.id)
      }));
      console.error('Error creating project:', error);
    }
  },
  
  updateProject: async (id, updates) => {
    const project = get().projects.find(p => p.id === id);
    if (!project) return;
    
    const updatedProject = {
      ...project,
      ...updates,
      version: project.version + 1,
      ultimo_modificato: new Date().toISOString(),
    };
    
    set((state) => ({
      projects: state.projects.map(p => p.id === id ? updatedProject : p)
    }));
    
    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject),
      });
      
      if (!response.ok) {
        set((state) => ({
          projects: state.projects.map(p => p.id === id ? project : p)
        }));
        console.error('Failed to update project');
      }
    } catch (error) {
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? project : p)
      }));
      console.error('Error updating project:', error);
    }
  },
  
  deleteProject: async (id) => {
    const projects = get().projects;
    
    set((state) => ({
      projects: state.projects.filter(p => p.id !== id)
    }));
    
    try {
      const response = await fetch(`/api/projects?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        set({ projects });
        console.error('Failed to delete project');
      }
    } catch (error) {
      set({ projects });
      console.error('Error deleting project:', error);
    }
  },
  
  // Tag Actions
  addTag: async (name, color, userId) => {
    const newTag: Tag = {
      id: uuidv4(),
      name,
      color,
      userId,
      version: 1,
      ultimo_modificato: new Date().toISOString(),
    };
    
    set((state) => ({ tags: [...state.tags, newTag] }));
    
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTag),
      });
      
      if (!response.ok) {
        set((state) => ({
          tags: state.tags.filter(t => t.id !== newTag.id)
        }));
        console.error('Failed to create tag');
      }
    } catch (error) {
      set((state) => ({
        tags: state.tags.filter(t => t.id !== newTag.id)
      }));
      console.error('Error creating tag:', error);
    }
  },
  
  updateTag: async (id, updates) => {
    const tag = get().tags.find(t => t.id === id);
    if (!tag) return;
    
    const updatedTag = {
      ...tag,
      ...updates,
      version: tag.version + 1,
      ultimo_modificato: new Date().toISOString(),
    };
    
    set((state) => ({
      tags: state.tags.map(t => t.id === id ? updatedTag : t)
    }));
    
    try {
      const response = await fetch('/api/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTag),
      });
      
      if (!response.ok) {
        set((state) => ({
          tags: state.tags.map(t => t.id === id ? tag : t)
        }));
        console.error('Failed to update tag');
      }
    } catch (error) {
      set((state) => ({
        tags: state.tags.map(t => t.id === id ? tag : t)
      }));
      console.error('Error updating tag:', error);
    }
  },
  
  deleteTag: async (id) => {
    const tags = get().tags;
    
    set((state) => ({
      tags: state.tags.filter(t => t.id !== id)
    }));
    
    try {
      const response = await fetch(`/api/tags?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        set({ tags });
        console.error('Failed to delete tag');
      }
    } catch (error) {
      set({ tags });
      console.error('Error deleting tag:', error);
    }
  },
  
  // UI Actions
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  resetFilters: () => set({ filters: defaultFilters }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  // Computed
  getFilteredTasks: () => {
    const { tasks, filters } = get();
    
    return tasks.filter(task => {
      if (filters.projectId && task.projectId !== filters.projectId) return false;
      if (!filters.showCompleted && task.completed) return false;
      if (filters.showImportantOnly && !task.important) return false;
      if (filters.showOverdueOnly) {
        const oggi = new Date().toISOString().split('T')[0];
        if (!task.date || task.date >= oggi || task.completed) return false;
      }
      if (filters.status && task.status !== filters.status) return false;
      if (filters.tags && filters.tags.length > 0) {
        if (!task.tag || !filters.tags.some(t => task.tag?.includes(t))) return false;
      }
      return true;
    });
  },
  
  getTasksByDate: (date) => {
    return get().tasks.filter(task => task.date === date);
  },
  
  getTasksByProject: (projectId) => {
    return get().tasks.filter(task => task.projectId === projectId);
  },
  
  getTasksByStatus: (status) => {
    return get().tasks.filter(task => task.status === status);
  },
  
  getImportantTasks: () => {
    return get().tasks.filter(task => task.important && !task.completed);
  },
  
  getOverdueTasks: () => {
    const oggi = new Date().toISOString().split('T')[0];
    return get().tasks.filter(task => 
      task.date && task.date < oggi && !task.completed
    );
  },
  
  getUserProjects: () => {
    return get().projects;
  },
  
  getUserTags: () => {
    return get().tags;
  },
}));
