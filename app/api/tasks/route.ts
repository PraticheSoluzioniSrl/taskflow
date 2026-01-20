// File: app/api/tasks/route.ts
// API per gestire le tasks nel database

import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET - Recupera tutte le tasks dell'utente
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trova o crea l'utente
    let user = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;

    if (user.rows.length === 0) {
      // Crea l'utente se non esiste
      const newUser = await sql`
        INSERT INTO users (id, email, name, image)
        VALUES (${session.user.email}, ${session.user.email}, ${session.user.name || ''}, ${session.user.image || ''})
        RETURNING id
      `;
      user = newUser;
    }

    const userId = user.rows[0].id;

    // Recupera tutte le tasks con i subtasks
    const tasks = await sql`
      SELECT 
        t.*,
        json_agg(
          json_build_object(
            'id', s.id,
            'title', s.title,
            'completed', s.completed,
            'reminder', s.reminder
          )
        ) FILTER (WHERE s.id IS NOT NULL) as subtasks,
        array_agg(DISTINCT tt.tag_id) FILTER (WHERE tt.tag_id IS NOT NULL) as tag_ids
      FROM tasks t
      LEFT JOIN subtasks s ON t.id = s.task_id
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      WHERE t.user_id = ${userId}
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `;

    return NextResponse.json({ tasks: tasks.rows });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Crea una nuova task
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, date, time, reminder, important, completed, projectId, status, subtasks, tagIds } = body;

    // Trova o crea l'utente
    let user = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;

    if (user.rows.length === 0) {
      const newUser = await sql`
        INSERT INTO users (id, email, name, image)
        VALUES (${session.user.email}, ${session.user.email}, ${session.user.name || ''}, ${session.user.image || ''})
        RETURNING id
      `;
      user = newUser;
    }

    const userId = user.rows[0].id;

    // Crea la task
    await sql`
      INSERT INTO tasks (
        id, user_id, title, description, date, time, reminder, 
        important, completed, project_id, status, created_at, updated_at
      )
      VALUES (
        ${id}, ${userId}, ${title}, ${description || null}, ${date || null}, 
        ${time || null}, ${reminder || null}, ${important || false}, 
        ${completed || false}, ${projectId || null}, ${status || 'backlog'}, 
        NOW(), NOW()
      )
    `;

    // Aggiungi subtasks se presenti
    if (subtasks && subtasks.length > 0) {
      for (const subtask of subtasks) {
        await sql`
          INSERT INTO subtasks (id, task_id, title, completed, reminder, created_at)
          VALUES (${subtask.id}, ${id}, ${subtask.title}, ${subtask.completed || false}, ${subtask.reminder || null}, NOW())
        `;
      }
    }

    // Aggiungi tags se presenti
    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await sql`
          INSERT INTO task_tags (task_id, tag_id)
          VALUES (${id}, ${tagId})
          ON CONFLICT DO NOTHING
        `;
      }
    }

    return NextResponse.json({ success: true, task: body });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Aggiorna una task esistente
export async function PUT(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, date, time, reminder, important, completed, projectId, status, subtasks, tagIds } = body;

    // Verifica che l'utente sia proprietario della task
    const userId = session.user.email;
    const taskCheck = await sql`
      SELECT id FROM tasks WHERE id = ${id} AND user_id = ${userId}
    `;

    if (taskCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 });
    }

    // Aggiorna la task
    await sql`
      UPDATE tasks
      SET 
        title = ${title},
        description = ${description || null},
        date = ${date || null},
        time = ${time || null},
        reminder = ${reminder || null},
        important = ${important || false},
        completed = ${completed || false},
        project_id = ${projectId || null},
        status = ${status || 'backlog'},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    // Rimuovi tutti i subtasks esistenti e ricreali
    await sql`DELETE FROM subtasks WHERE task_id = ${id}`;
    if (subtasks && subtasks.length > 0) {
      for (const subtask of subtasks) {
        await sql`
          INSERT INTO subtasks (id, task_id, title, completed, reminder, created_at)
          VALUES (${subtask.id}, ${id}, ${subtask.title}, ${subtask.completed || false}, ${subtask.reminder || null}, NOW())
        `;
      }
    }

    // Rimuovi tutti i tags esistenti e ricreali
    await sql`DELETE FROM task_tags WHERE task_id = ${id}`;
    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await sql`
          INSERT INTO task_tags (task_id, tag_id)
          VALUES (${id}, ${tagId})
          ON CONFLICT DO NOTHING
        `;
      }
    }

    return NextResponse.json({ success: true, task: body });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Elimina una task
export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    }

    const userId = session.user.email;

    // Verifica proprietà e elimina
    const result = await sql`
      DELETE FROM tasks 
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
