import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getTasksByUserId, createTask } from '@/lib/db';

/**
 * GET /api/tasks
 * Scarica tutti i task dell'utente dal database
 */
export async function GET() {
  try {
    const session = await getAuthSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non autenticato' }, 
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const tasks = await getTasksByUserId(userId);

    return NextResponse.json(tasks);

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Crea un nuovo task
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non autenticato' }, 
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const body = await request.json();

    const task = await createTask({
      ...body,
      userId,
    });

    return NextResponse.json(task, { status: 201 });

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Errore durante la creazione del task' }, 
      { status: 500 }
    );
  }
}

