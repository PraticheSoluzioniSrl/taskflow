'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTaskStore } from '@/lib/store';
import { Task, Project, Tag, PendingChange, SyncConflict } from '@/types';

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
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const syncInProgress = useRef(false);
  const lastSyncTimestamp = useRef<number>(0);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email && !hasLoadedOnce) {
      loadFromDatabase(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.email]);

  const mergeItems = <T extends Task | Project | Tag>(
    localItems: T[],
    remoteItems: T[],
    itemType: 'task' | 'project' | 'tag'
  ): { merged: T[]; conflicts: SyncConflict[] } => {
    const mergedMap = new Map<string, T>();
    const detectedConflicts: SyncConflict[] = [];

    localItems.forEach(item => {
      mergedMap.set(item.id, item);
    });

    remoteItems.forEach(remoteItem => {
      const localItem = mergedMap.get(remoteItem.id);

      if (!localItem) {
        mergedMap.set(remoteItem.id, remoteItem);
      } else {
        const localVersion = (localItem as any).version || 1;
        const remoteVersion = (remoteItem as any).version || 1;
        const localLastModified = (localItem as any).lastModified || 0;
        const remoteLastModified = (remoteItem as any).lastModified || 0;

        if (localVersion > remoteVersion) {
          // Mantieni locale
        } else if (localVersion < remoteVersion) {
          mergedMap.set(remoteItem.id, remoteItem);
        } else {
          if (localLastModified > remoteLastModified) {
            // Mantieni locale
          } else if (localLastModified < remoteLastModified) {
            mergedMap.set(remoteItem.id, remoteItem);
          } else {
            // Conflitto - stessa versione e stesso timestamp
            detectedConflicts.push({
              itemType,
              itemId: remoteItem.id,
              localVersion: localItem,
              remoteVersion: remoteItem,
              timestamp: Date.now(),
            });
            mergedMap.set(remoteItem.id, remoteItem);
          }
        }
      }
    });

    return {
      merged: Array.from(mergedMap.values()),
      conflicts: detectedConflicts,
    };
  };

  const loadFromDatabase = async (isInitialLoad = false) => {
    if (!session?.user?.email || syncInProgress.current) return;
    
    // Evita chiamate troppo frequenti (minimo 30 secondi tra chiamate non iniziali)
    if (!isInitialLoad) {
      const timeSinceLastSync = Date.now() - lastSyncTimestamp.current;
      if (timeSinceLastSync < 30000) {
        return; // Troppo presto dall'ultima sincronizzazione
      }
    }
    
    syncInProgress.current = true;

    if (isInitialLoad) {
      setIsLoading(true);
      setIsSyncing(true);
    }
    setError(null);

    try {
      const userId = session.user.email;
      setCurrentUserId(userId);

      if (pendingChanges.length > 0 && !isInitialLoad) {
        await syncPendingChanges();
      }

      const fetchWithTimeout = (url: string, timeout: number) => {
        return Promise.race([
          fetch(url),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
          ),
        ]);
      };

      const timeout = isInitialLoad ? 15000 : 30000;
      const [tasksRes, projectsRes, tagsRes] = await Promise.all([
        fetchWithTimeout('/api/tasks', timeout),
        fetchWithTimeout('/api/projects', timeout),
        fetchWithTimeout('/api/tags', timeout),
      ]);

      if (!tasksRes.ok || !projectsRes.ok || !tagsRes.ok) {
        throw new Error('Failed to load data from database');
      }

      const [tasksData, projectsData, tagsData] = await Promise.all([
        tasksRes.json(),
        projectsRes.json(),
        tagsRes.json(),
      ]);

      const tasksMerge = mergeItems(tasks, tasksData || [], 'task');
      const projectsMerge = mergeItems(projects, projectsData || [], 'project');
      const tagsMerge = mergeItems(tags, tagsData || [], 'tag');

      useTaskStore.setState({
        tasks: tasksMerge.merged,
        projects: projectsMerge.merged,
        tags: tagsMerge.merged,
      });

      const allConflicts = [
        ...tasksMerge.conflicts,
        ...projectsMerge.conflicts,
        ...tagsMerge.conflicts,
      ];
      
      if (allConflicts.length > 0) {
        setConflicts(prev => [...prev, ...allConflicts]);
      }

      setHasLoadedOnce(true);
      lastSyncTimestamp.current = Date.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Sync] Loaded ${tasksData?.length || 0} tasks, ${projectsData?.length || 0} projects, ${tagsData?.length || 0} tags`);
      }
    } catch (err) {
      console.error('Error loading from database:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      
      if (isInitialLoad) {
        setHasLoadedOnce(true);
      }
    } finally {
      syncInProgress.current = false;
      if (isInitialLoad) {
        setIsLoading(false);
        setIsSyncing(false);
      }
    }
  };

  const syncPendingChanges = async () => {
    if (pendingChanges.length === 0 || !session?.user?.email) return;

    const changesToSync = [...pendingChanges];
    const successfulChanges: string[] = [];

    for (const change of changesToSync) {
      try {
        let endpoint = '';
        let method = '';
        let body: any = null;

        switch (change.type) {
          case 'task':
            endpoint = change.action === 'delete' 
              ? `/api/tasks/${change.id}` 
              : change.action === 'create'
              ? '/api/tasks'
              : `/api/tasks/${change.id}`;
            method = change.action === 'delete' ? 'DELETE' : change.action === 'create' ? 'POST' : 'PUT';
            body = change.action !== 'delete' ? change.data : null;
            break;
          case 'project':
            endpoint = change.action === 'delete'
              ? `/api/projects/${change.id}`
              : change.action === 'create'
              ? '/api/projects'
              : `/api/projects/${change.id}`;
            method = change.action === 'delete' ? 'DELETE' : change.action === 'create' ? 'POST' : 'PUT';
            body = change.action !== 'delete' ? change.data : null;
            break;
          case 'tag':
            endpoint = change.action === 'delete'
              ? `/api/tags/${change.id}`
              : change.action === 'create'
              ? '/api/tags'
              : `/api/tags/${change.id}`;
            method = change.action === 'delete' ? 'DELETE' : change.action === 'create' ? 'POST' : 'PUT';
            body = change.action !== 'delete' ? change.data : null;
            break;
        }

        const response = await fetch(endpoint, {
          method,
          headers: body ? { 'Content-Type': 'application/json' } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (response.ok) {
          successfulChanges.push(`${change.id}_${change.timestamp}`);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (err) {
        const updatedChange = { ...change, retryCount: change.retryCount + 1 };
        
        if (updatedChange.retryCount < 3) {
          setPendingChanges(prev => 
            prev.map(c => 
              c.id === change.id && c.timestamp === change.timestamp 
                ? updatedChange 
                : c
            )
          );
        } else {
          // Rimuovi dopo 3 tentativi falliti
          successfulChanges.push(`${change.id}_${change.timestamp}`);
        }
      }
    }

    if (successfulChanges.length > 0) {
      setPendingChanges(prev =>
        prev.filter(c => !successfulChanges.includes(`${c.id}_${c.timestamp}`))
      );
    }
  };

  const addPendingChange = useCallback((change: Omit<PendingChange, 'timestamp' | 'retryCount'>) => {
    setPendingChanges(prev => [
      ...prev,
      {
        ...change,
        timestamp: Date.now(),
        retryCount: 0,
      },
    ]);
  }, []);

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'version' | 'lastModified'>) => {
    const now = Date.now();
    const newTask: Task = {
      ...storeAddTask(task),
      version: 1,
      lastModified: now,
      syncStatus: 'pending',
    };

    const { tasks } = useTaskStore.getState();
    useTaskStore.setState({
      tasks: [...tasks.filter(t => t.id !== newTask.id), newTask],
    });

    addPendingChange({
      type: 'task',
      action: 'create',
      id: newTask.id,
      data: task,
    });

    // Non chiamare syncPendingChanges immediatamente - lascia che il debounce lo gestisca
    // syncPendingChanges().catch(console.error);

    return newTask;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const now = Date.now();
    
    storeUpdateTask(id, {
      ...updates,
      version: (task.version || 1) + 1,
      lastModified: now,
      syncStatus: 'pending',
    });

    addPendingChange({
      type: 'task',
      action: 'update',
      id,
      data: updates,
    });

    // Non chiamare syncPendingChanges immediatamente - lascia che il debounce lo gestisca
    // syncPendingChanges().catch(console.error);
  };

  const deleteTask = async (id: string) => {
    storeDeleteTask(id);

    addPendingChange({
      type: 'task',
      action: 'delete',
      id,
    });

    // Non chiamare syncPendingChanges immediatamente - lascia che il debounce lo gestisca
    // syncPendingChanges().catch(console.error);
  };

  const addProject = async (name: string, color: string, userId: string) => {
    const newProject = storeAddProject(name, color, userId);

    addPendingChange({
      type: 'project',
      action: 'create',
      id: newProject.id,
      data: { name, color, userId },
    });

    // Non chiamare syncPendingChanges immediatamente - lascia che il debounce lo gestisca
    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    storeUpdateProject(id, updates);

    addPendingChange({
      type: 'project',
      action: 'update',
      id,
      data: updates,
    });

    // Non chiamare syncPendingChanges immediatamente - lascia che il debounce lo gestisca
  };

  const deleteProject = async (id: string) => {
    storeDeleteProject(id);

    addPendingChange({
      type: 'project',
      action: 'delete',
      id,
    });

    syncPendingChanges().catch(console.error);
  };

  const addTag = async (name: string, color: string, userId: string) => {
    const newTag = storeAddTag(name, color, userId);

    addPendingChange({
      type: 'tag',
      action: 'create',
      id: newTag.id,
      data: { name, color, userId },
    });

    // Non chiamare syncPendingChanges immediatamente - lascia che il debounce lo gestisca
    return newTag;
  };

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    storeUpdateTag(id, updates);

    addPendingChange({
      type: 'tag',
      action: 'update',
      id,
      data: updates,
    });

    syncPendingChanges().catch(console.error);
  };

  const deleteTag = async (id: string) => {
    storeDeleteTag(id);

    addPendingChange({
      type: 'tag',
      action: 'delete',
      id,
    });

    // Non chiamare syncPendingChanges immediatamente - lascia che il debounce lo gestisca
  };

  const moveTask = async (taskId: string, newStatus: Task['status']) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    await updateTask(taskId, { status: newStatus });
  };

  const toggleTaskImportant = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    await updateTask(taskId, { important: !task.important });
  };

  const resolveConflict = useCallback((
    conflictId: string,
    resolution: 'local' | 'remote'
  ) => {
    setConflicts(prev => {
      const conflict = prev.find(c => c.itemId === conflictId);
      if (!conflict) return prev;

      const chosenVersion = resolution === 'local' 
        ? conflict.localVersion 
        : conflict.remoteVersion;

      if (conflict.itemType === 'task') {
        storeUpdateTask(conflictId, chosenVersion);
      } else if (conflict.itemType === 'project') {
        storeUpdateProject(conflictId, chosenVersion);
      } else if (conflict.itemType === 'tag') {
        storeUpdateTag(conflictId, chosenVersion);
      }

      return prev.filter(c => c.itemId !== conflictId);
    });
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email && hasLoadedOnce) {
      // Polling ridotto a 45 secondi per ridurre l'uso di risorse
      // Solo quando non ci sono modifiche pendenti
      const interval = setInterval(() => {
        if (pendingChanges.length === 0) {
          // Evita chiamate se è passato meno di 30 secondi dall'ultima sincronizzazione
          const timeSinceLastSync = Date.now() - lastSyncTimestamp.current;
          if (timeSinceLastSync >= 30000) {
            loadFromDatabase(false);
          }
        }
      }, 45000); // 45 secondi invece di 15

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.email, hasLoadedOnce, pendingChanges.length]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email && pendingChanges.length > 0) {
      // Debounce aumentato a 5 secondi per raggruppare più modifiche insieme
      const timeout = setTimeout(() => {
        syncPendingChanges();
      }, 5000); // 5 secondi invece di 2 per ridurre chiamate API

      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.email, pendingChanges.length]);

  return {
    isLoading,
    isSyncing,
    error,
    conflicts,
    pendingChanges: pendingChanges.length,
    loadFromDatabase,
    resolveConflict,
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
