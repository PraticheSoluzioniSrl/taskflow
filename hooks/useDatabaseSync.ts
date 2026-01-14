'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTaskStore } from '@/lib/store';
import { Task, Project, Tag } from '@/types';

export function useDatabaseSync() {
  const { data: session, status } = useSession();
  const {
    tasks,
    projects,
    tags,
    setCurrentUserId,
    addTask: storeAddTask,
    updateTask: storeUpdateTask,
    deleteTask: storeDeleteTask,
    addProject: storeAddProject,
    updateProject: storeUpdateProject,
    deleteProject: storeDeleteProject,
    addTag: storeAddTag,
    updateTag: storeUpdateTag,
    deleteTag: storeDeleteTag,
  } = useTaskStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carica i dati dal database quando l'utente si logga
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      loadFromDatabase();
    }
  }, [status, session]);

  const loadFromDatabase = async () => {
    if (!session?.user?.email) return;

    setIsLoading(true);
    setIsSyncing(true);
    setError(null);

    try {
      const userId = session.user.email;
      setCurrentUserId(userId);

      // Carica tasks, projects e tags dal database
      const [tasksRes, projectsRes, tagsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects'),
        fetch('/api/tags'),
      ]);

      if (!tasksRes.ok || !projectsRes.ok || !tagsRes.ok) {
        throw new Error('Failed to load data from database');
      }

      const [tasksData, projectsData, tagsData] = await Promise.all([
        tasksRes.json(),
        projectsRes.json(),
        tagsRes.json(),
      ]);

      // Aggiorna lo store con i dati dal database
      // Nota: per ora sovrascriviamo i dati locali con quelli del database
      // In futuro possiamo implementare una logica di merge più sofisticata
      useTaskStore.setState({
        tasks: tasksData || [],
        projects: projectsData || [],
        tags: tagsData || [],
      });
    } catch (err) {
      console.error('Error loading from database:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      // In caso di errore, continuiamo con i dati locali
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  // Funzioni wrapper che sincronizzano con il database
  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    const newTask = storeAddTask(task);

    // Sincronizza con il database
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });

      if (!response.ok) {
        throw new Error('Failed to sync task to database');
      }

      const syncedTask = await response.json();
      // Aggiorna lo store con l'ID dal database
      storeUpdateTask(newTask.id, { id: syncedTask.id });
    } catch (err) {
      console.error('Error syncing task to database:', err);
      // Continuiamo con il task locale anche se la sincronizzazione fallisce
    }

    return newTask;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    storeUpdateTask(id, updates);

    // Sincronizza con il database
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to sync task update to database');
      }
    } catch (err) {
      console.error('Error syncing task update to database:', err);
    }
  };

  const deleteTask = async (id: string) => {
    storeDeleteTask(id);

    // Sincronizza con il database
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to sync task deletion to database');
      }
    } catch (err) {
      console.error('Error syncing task deletion to database:', err);
      // Ripristina il task se la cancellazione fallisce
      // (in produzione potresti voler gestire questo diversamente)
    }
  };

  const addProject = async (name: string, color: string, userId: string) => {
    const newProject = storeAddProject(name, color, userId);

    // Sincronizza con il database
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync project to database');
      }

      const syncedProject = await response.json();
      storeUpdateProject(newProject.id, { id: syncedProject.id });
    } catch (err) {
      console.error('Error syncing project to database:', err);
    }

    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    storeUpdateProject(id, updates);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to sync project update to database');
      }
    } catch (err) {
      console.error('Error syncing project update to database:', err);
    }
  };

  const deleteProject = async (id: string) => {
    storeDeleteProject(id);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to sync project deletion to database');
      }
    } catch (err) {
      console.error('Error syncing project deletion to database:', err);
    }
  };

  const addTag = async (name: string, color: string, userId: string) => {
    const newTag = storeAddTag(name, color, userId);

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync tag to database');
      }

      const syncedTag = await response.json();
      storeUpdateTag(newTag.id, { id: syncedTag.id });
    } catch (err) {
      console.error('Error syncing tag to database:', err);
    }

    return newTag;
  };

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    storeUpdateTag(id, updates);

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to sync tag update to database');
      }
    } catch (err) {
      console.error('Error syncing tag update to database:', err);
    }
  };

  const deleteTag = async (id: string) => {
    storeDeleteTag(id);

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to sync tag deletion to database');
      }
    } catch (err) {
      console.error('Error syncing tag deletion to database:', err);
    }
  };

  const moveTask = async (taskId: string, newStatus: Task['status']) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    storeUpdateTask(taskId, { status: newStatus });
    
    // Sincronizza con il database
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync task move to database');
      }
    } catch (err) {
      console.error('Error syncing task move to database:', err);
    }
  };

  const toggleTaskImportant = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newImportant = !task.important;
    storeUpdateTask(taskId, { important: newImportant });

    // Sincronizza con il database
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ important: newImportant }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync task important toggle to database');
      }
    } catch (err) {
      console.error('Error syncing task important toggle to database:', err);
    }
  };

  // Polling periodico per sincronizzare i dati ogni 30 secondi
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      const interval = setInterval(() => {
        loadFromDatabase();
      }, 30000); // 30 secondi

      return () => clearInterval(interval);
    }
  }, [status, session]);

  return {
    isLoading,
    isSyncing,
    error,
    loadFromDatabase,
    // Esporta le funzioni sincronizzate
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    toggleTaskImportant,
    addProject,
    updateProject,
    deleteProject,
    addTag,
    updateTag,
    deleteTag,
  };
}
