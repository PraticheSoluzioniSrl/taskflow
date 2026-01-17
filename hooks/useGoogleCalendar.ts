'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession, signIn as nextAuthSignIn } from 'next-auth/react';
import { Task } from '@/types';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  extendedProperties?: {
    private?: {
      taskId?: string;
    };
  };
}

export function useGoogleCalendar() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const isAuthenticated = status === 'authenticated' && !!session?.user;

  const signIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await nextAuthSignIn('google', { 
        callbackUrl: window.location.href,
        scope: 'openid email profile https://www.googleapis.com/auth/calendar'
      });
    } catch (err) {
      console.error('Error signing in with Google:', err);
      setError('Errore durante l\'autenticazione con Google');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLastSync(null);
  }, []);

  const taskToCalendarEvent = (task: Task): Partial<GoogleCalendarEvent> => {
    const startDateTime = task.dueDate && task.dueTime
      ? `${task.dueDate}T${task.dueTime}:00`
      : task.dueDate
      ? `${task.dueDate}T09:00:00`
      : undefined;

    const endDateTime = task.dueDate && task.dueTime
      ? (() => {
          const [hours, minutes] = task.dueTime.split(':').map(Number);
          const endMinutes = minutes + 30;
          return `${task.dueDate}T${String(hours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
        })()
      : task.dueDate
      ? `${task.dueDate}T10:00:00`
      : undefined;

    return {
      summary: task.title,
      description: task.description || '',
      start: startDateTime ? { dateTime: startDateTime } : undefined,
      end: endDateTime ? { dateTime: endDateTime } : undefined,
      extendedProperties: {
        private: {
          taskId: task.id,
        },
      },
    };
  };

  const syncTaskToCalendar = useCallback(async (task: Task): Promise<string | null> => {
    if (!isAuthenticated || !task.dueDate) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const calendarEvent = taskToCalendarEvent(task);

      const method = task.calendarEventId ? 'PUT' : 'POST';
      const endpoint = task.calendarEventId
        ? `/api/calendar/events/${task.calendarEventId}`
        : '/api/calendar/events';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...calendarEvent,
          taskId: task.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync task to calendar');
      }

      const data = await response.json();
      setLastSync(new Date());

      return data.eventId;
    } catch (err) {
      console.error('Error syncing task to calendar:', err);
      setError(err instanceof Error ? err.message : 'Errore sincronizzazione');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const syncAllTasksToCalendar = useCallback(async (tasks: Task[]): Promise<number> => {
    if (!isAuthenticated) return 0;

    let syncedCount = 0;
    const tasksWithDueDate = tasks.filter(t => t.dueDate && !t.completed);

    for (const task of tasksWithDueDate) {
      const eventId = await syncTaskToCalendar(task);
      if (eventId) {
        syncedCount++;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return syncedCount;
  }, [isAuthenticated, syncTaskToCalendar]);

  const fetchCalendarEvents = useCallback(async (
    startDate: string,
    endDate: string
  ): Promise<GoogleCalendarEvent[]> => {
    if (!isAuthenticated) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/calendar/events?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch events');
      }

      const data = await response.json();
      setLastSync(new Date());
      
      return data.events || [];
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError(err instanceof Error ? err.message : 'Errore recupero eventi');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const deleteCalendarEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }

      setLastSync(new Date());

      return true;
    } catch (err) {
      console.error('Error deleting calendar event:', err);
      setError(err instanceof Error ? err.message : 'Errore eliminazione');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const importEventsAsTasks = useCallback(async (
    startDate: string,
    endDate: string,
    onTaskCreated?: (task: Partial<Task>) => void
  ): Promise<number> => {
    if (!isAuthenticated) return 0;

    const events = await fetchCalendarEvents(startDate, endDate);
    let importedCount = 0;

    for (const event of events) {
      if (event.extendedProperties?.private?.taskId) {
        continue;
      }

      const taskData: Partial<Task> = {
        title: event.summary,
        description: event.description || '',
        dueDate: event.start.dateTime?.split('T')[0] || event.start.date,
        dueTime: event.start.dateTime?.split('T')[1]?.substring(0, 5),
        calendarEventId: event.id,
        status: 'todo',
        important: false,
        completed: false,
        tags: [],
      };

      if (onTaskCreated) {
        onTaskCreated(taskData);
        importedCount++;
      }
    }

    return importedCount;
  }, [isAuthenticated, fetchCalendarEvents]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Auto-sync disabilitato per ridurre l'uso di risorse
    // Gli eventi vengono sincronizzati solo quando necessario (creazione/modifica task)
    // Se necessario, puoi abilitare con un intervallo più lungo:
    // const autoSyncInterval = setInterval(() => {
    //   const now = new Date();
    //   const startDate = now.toISOString().split('T')[0];
    //   const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    //     .toISOString()
    //     .split('T')[0];
    //   fetchCalendarEvents(startDate, endDate).catch(console.error);
    // }, 30 * 60 * 1000); // 30 minuti invece di 5

    // return () => clearInterval(autoSyncInterval);
  }, [isAuthenticated, fetchCalendarEvents]);

  return {
    isAuthenticated,
    isLoading,
    error,
    lastSync,
    signIn,
    signOut,
    syncTaskToCalendar,
    syncAllTasksToCalendar,
    fetchCalendarEvents,
    deleteCalendarEvent,
    importEventsAsTasks,
  };
}

export default useGoogleCalendar;
