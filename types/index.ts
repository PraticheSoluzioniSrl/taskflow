export interface Task {
  id: string;
  userId: string; // ID dell'utente proprietario del task
  title: string;
  description?: string;
  completed: boolean;
  important: boolean; // Se true, non scompare finché non completato
  dueDate?: string;
  dueTime?: string;
  reminder?: string; // ISO datetime per il promemoria
  projectId?: string;
  tags: string[];
  subtasks: Subtask[];
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  googleCalendarEventId?: string;
  order: number;
  version: number;
  lastModified: number;
  syncStatus?: 'synced' | 'pending' | 'conflict';
  calendarEventId?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  reminder?: string; // ISO datetime per promemoria indipendente
}

export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'done';

export interface Project {
  id: string;
  userId: string; // ID dell'utente proprietario del progetto
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
  version: number;
  lastModified: number;
  syncStatus?: 'synced' | 'pending' | 'conflict';
}

export interface Tag {
  id: string;
  userId: string; // ID dell'utente proprietario del tag
  name: string;
  color: string;
  version: number;
  lastModified: number;
  syncStatus?: 'synced' | 'pending' | 'conflict';
}

export type ViewMode = 'list' | 'calendar' | 'kanban';

export interface FilterState {
  projectId?: string;
  tags: string[];
  status?: TaskStatus;
  showCompleted: boolean;
  showImportantOnly: boolean;
  showOverdueOnly: boolean;
  searchQuery: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  taskId?: string;
}

// Colori predefiniti per progetti e tag
export const PROJECT_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
  '#22c55e', // green
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#a855f7', // purple
  '#14b8a6', // teal
  '#eab308', // yellow
];

export const TAG_COLORS = [
  '#60a5fa', // light blue
  '#a78bfa', // light violet
  '#f472b6', // light pink
  '#fb923c', // light orange
  '#4ade80', // light green
  '#22d3ee', // light cyan
  '#fbbf24', // amber
  '#e879f9', // fuchsia
  '#2dd4bf', // teal
  '#f87171', // red
];

export const KANBAN_COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: '#64748b' },
  { id: 'todo', title: 'Da Fare', color: '#3b82f6' },
  { id: 'in-progress', title: 'In Corso', color: '#f59e0b' },
  { id: 'done', title: 'Completato', color: '#22c55e' },
];

export interface PendingChange {
  type: 'task' | 'project' | 'tag';
  action: 'create' | 'update' | 'delete';
  id: string;
  data?: any;
  timestamp: number;
  retryCount: number;
}

export interface SyncConflict {
  itemType: 'task' | 'project' | 'tag';
  itemId: string;
  localVersion: any;
  remoteVersion: any;
  timestamp: number;
}
