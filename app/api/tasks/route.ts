import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/db';

/**
 * GET /api/tasks/sync
 * Scarica tutti i task dell'utente dal database
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non autenticato' }, 
        { status: 401 }
      );
    }

    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        tasks: {
          include: {
            project: true,
            tags: true,
            subtasks: true,
          },
        },
        projects: true,
        tags: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      tasks: user.tasks,
      projects: user.projects,
      tags: user.tags,
      lastSync: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks/sync
 * Sincronizza task dal client al server
 * 
 * Body: {
 *   tasks: Task[],
 *   projects?: Project[],
 *   tags?: Tag[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non autenticato' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tasks, projects, tags } = body;

    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' }, 
        { status: 404 }
      );
    }

    // Sincronizza progetti (se forniti)
    if (projects && Array.isArray(projects)) {
      for (const project of projects) {
        await prisma.project.upsert({
          where: { id: project.id },
          update: {
            name: project.name,
            color: project.color,
          },
          create: {
            id: project.id,
            name: project.name,
            color: project.color,
            userId: user.id,
          },
        });
      }
    }

    // Sincronizza tag (se forniti)
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        await prisma.tag.upsert({
          where: { id: tag.id },
          update: {
            name: tag.name,
          },
          create: {
            id: tag.id,
            name: tag.name,
            userId: user.id,
          },
        });
      }
    }

    // Sincronizza task
    if (tasks && Array.isArray(tasks)) {
      for (const task of tasks) {
        // Prepara i dati del task
        const taskData: any = {
          title: task.title,
          description: task.description,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          priority: task.priority,
          status: task.status,
          important: task.important,
          completed: task.completed,
          completedAt: task.completedAt ? new Date(task.completedAt) : null,
        };

        // Collega progetto se presente
        if (task.projectId) {
          taskData.projectId = task.projectId;
        }

        // Upsert task
        await prisma.task.upsert({
          where: { id: task.id },
          update: taskData,
          create: {
            id: task.id,
            ...taskData,
            userId: user.id,
          },
        });

        // Sincronizza tag del task
        if (task.tags && Array.isArray(task.tags)) {
          // Rimuovi vecchi collegamenti
          await prisma.task.update({
            where: { id: task.id },
            data: {
              tags: {
                set: [], // Rimuovi tutti i tag
              },
            },
          });

          // Aggiungi nuovi collegamenti
          await prisma.task.update({
            where: { id: task.id },
            data: {
              tags: {
                connect: task.tags.map((tag: any) => ({ id: tag.id })),
              },
            },
          });
        }

        // Sincronizza subtask
        if (task.subtasks && Array.isArray(task.subtasks)) {
          for (const subtask of task.subtasks) {
            await prisma.subtask.upsert({
              where: { id: subtask.id },
              update: {
                title: subtask.title,
                completed: subtask.completed,
              },
              create: {
                id: subtask.id,
                title: subtask.title,
                completed: subtask.completed,
                taskId: task.id,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Sincronizzazione completata',
      lastSync: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error syncing tasks:', error);
    return NextResponse.json(
      { error: 'Errore durante la sincronizzazione' }, 
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/sync
 * Elimina un task specifico
 * 
 * Query params: ?taskId=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non autenticato' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId mancante' }, 
        { status: 400 }
      );
    }

    // Verifica che il task appartenga all'utente
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' }, 
        { status: 404 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.userId !== user.id) {
      return NextResponse.json(
        { error: 'Task non trovato o non autorizzato' }, 
        { status: 404 }
      );
    }

    // Elimina subtask collegati
    await prisma.subtask.deleteMany({
      where: { taskId },
    });

    // Elimina task
    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Task eliminato',
    });

  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Errore durante l\'eliminazione' }, 
      { status: 500 }
    );
  }
}
