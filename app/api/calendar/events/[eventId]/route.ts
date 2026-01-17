import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { google } from 'googleapis';

export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { eventId } = params;
    const body = await request.json();
    const { summary, description, start, end, taskId } = body;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: (session as any).accessToken,
      refresh_token: (session as any).refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const existingEvent = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    const updatedEvent = {
      ...existingEvent.data,
      summary: summary || existingEvent.data.summary,
      description: description !== undefined ? description : existingEvent.data.description,
      start: start || existingEvent.data.start,
      end: end || existingEvent.data.end,
      extendedProperties: taskId ? { private: { taskId } } : existingEvent.data.extendedProperties,
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: updatedEvent,
    });

    return NextResponse.json({
      eventId: response.data.id,
      event: response.data,
    });
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    
    if (error.code === 401) {
      return NextResponse.json({ error: 'Token scaduto' }, { status: 401 });
    }
    
    if (error.code === 404) {
      return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Errore aggiornamento evento' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { eventId } = params;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: (session as any).accessToken,
      refresh_token: (session as any).refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });

    return NextResponse.json({
      success: true,
      message: 'Evento eliminato con successo',
    });
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    
    if (error.code === 401) {
      return NextResponse.json({ error: 'Token scaduto' }, { status: 401 });
    }
    
    if (error.code === 404) {
      return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 });
    }
    
    if (error.code === 410) {
      return NextResponse.json({
        success: true,
        message: 'Evento già eliminato',
      });
    }
    
    return NextResponse.json({ error: 'Errore eliminazione evento' }, { status: 500 });
  }
}
