'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTaskStore } from '@/lib/store';

export function useCalendarSync() {
  const { data: session } = useSession();
  const { tasks, updateTask } = useTaskStore();

  useEffect(() => {
    if (!session?.user) return;

    const syncInterval = setInterval(async () => {
      try {
        console.log('[Calendar Sync] Fetching events...');
        
        const response = await fetch('/api/calendar/fetch');
        
        if (!response.ok) return;

        const data = await response.json();
        
        if (!data.success || !data.events) return;

        for (const event of data.events) {
          const taskflowId = event.extendedProperties?.private?.taskflowId;
          
          if (!taskflowId) continue;
          
          const task = tasks.find(t => t.id === taskflowId);
          
          if (!task) continue;
          
          if (event.status === 'cancelled') continue;
          
          const eventStart = new Date(event.start?.dateTime || event.start?.date);
          const taskDate = task.dueDate ? new Date(task.dueDate) : null;
          
          if (taskDate && eventStart.getTime() !== taskDate.getTime()) {
            await updateTask(task.id, {
              ...task,
              dueDate: eventStart.toISOString(),
            });
          }
          
          if (event.summary && event.summary !== task.title) {
            await updateTask(task.id, {
              ...task,
              title: event.summary,
            });
          }
        }
        
        console.log('[Calendar Sync] Completed');
        
      } catch (error) {
        console.error('[Calendar Sync] Error:', error);
      }
    }, 5 * 60 * 1000);

    (async () => {
      try {
        const response = await fetch('/api/calendar/fetch');
        if (response.ok) {
          const data = await response.json();
          console.log('[Calendar Sync] Initial sync:', data.events?.length || 0, 'events');
        }
      } catch (error) {
        console.error('[Calendar Sync] Initial error:', error);
      }
    })();

    return () => clearInterval(syncInterval);
  }, [session, tasks, updateTask]);
}