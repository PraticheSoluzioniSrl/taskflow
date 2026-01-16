import { Task } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from './authOptions';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

// Ottieni l'access token dalla sessione
async function getAccessToken(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken;
    
    if (!accessToken) {
      console.error('[Google Calendar] No access token available in session');
      console.error('[Google Calendar] Session:', session ? 'exists' : 'null');
      return null;
    }
    
    return accessToken;
  } catch (error) {
    console.error('[Google Calendar] Error getting access token:', error);
    return null;
  }
}

// Crea o aggiorna un evento su Google Calendar
export async function syncTaskToCalendar(task: Task): Promise<string | null> {
  if (!task.dueDate) return null;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error('No access token available');
    return null;
  }

  try {
    // Costruisci la data/ora
    const startDateTime = task.dueTime
      ? `${task.dueDate}T${task.dueTime}:00`
      : `${task.dueDate}T09:00:00`;
    
    const endDateTime = task.dueTime
      ? `${task.dueDate}T${task.dueTime}:00`
      : `${task.dueDate}T10:00:00`;

    const event: GoogleCalendarEvent = {
      summary: task.title,
      description: task.description || '',
      start: {
        dateTime: startDateTime,
        timeZone: 'Europe/Rome',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Europe/Rome',
      },
      reminders: {
        useDefault: false,
        overrides: task.reminder
          ? [
              {
                method: 'popup',
                minutes: 15, // 15 minuti prima
              },
            ]
          : [],
      },
    };

    let eventId: string | undefined = task.googleCalendarEventId;

    if (eventId) {
      // Aggiorna evento esistente
      const response = await fetch(
        `${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Google Calendar] Error updating calendar event:', response.status, error);
        // Se l'evento non esiste più, creane uno nuovo
        if (response.status === 404) {
          console.log('[Google Calendar] Event not found, creating new one');
          eventId = undefined;
        } else if (response.status === 401) {
          console.error('[Google Calendar] Unauthorized - access token may be expired');
          return null;
        } else {
          return null;
        }
      } else {
        console.log(`[Google Calendar] Successfully updated event ${eventId} for task ${task.id}`);
      }
    }

    if (!eventId) {
      // Crea nuovo evento
      const response = await fetch(
        `${CALENDAR_API_BASE}/calendars/primary/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Google Calendar] Error creating calendar event:', response.status, error);
        if (response.status === 401) {
          console.error('[Google Calendar] Unauthorized - access token may be expired');
        }
        return null;
      }

      const createdEvent = await response.json();
      console.log(`[Google Calendar] Successfully created event ${createdEvent.id} for task ${task.id}`);
      return createdEvent.id;
    }

    return eventId;
  } catch (error) {
    console.error('Error syncing task to calendar:', error);
    return null;
  }
}

// Elimina un evento da Google Calendar
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  if (!eventId) return false;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error('No access token available');
    return false;
  }

  try {
    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
}
