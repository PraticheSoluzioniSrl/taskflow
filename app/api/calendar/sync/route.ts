import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { syncTaskToCalendar, deleteCalendarEvent } from '@/lib/googleCalendar';
import { updateTask } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task, action } = body;

    if (action === 'delete' && task.googleCalendarEventId) {
      await deleteCalendarEvent(task.googleCalendarEventId);
      // Rimuovi l'ID dell'evento dal task
      await updateTask(task.id, { googleCalendarEventId: undefined }, session.user.email);
      return NextResponse.json({ success: true });
    }

    if (!task.dueDate) {
      return NextResponse.json({ success: true, eventId: null });
    }

    const eventId = await syncTaskToCalendar(task);
    
    if (eventId) {
      // Aggiorna il task con l'ID dell'evento
      await updateTask(task.id, { googleCalendarEventId: eventId }, session.user.email);
    }

    return NextResponse.json({ success: true, eventId });
  } catch (error) {
    console.error('Error syncing to calendar:', error);
    return NextResponse.json(
      { error: 'Failed to sync to calendar' },
      { status: 500 }
    );
  }
}
