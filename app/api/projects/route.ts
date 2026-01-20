// File: app/api/projects/route.ts
// API per gestire i projects nel database

import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET - Recupera tutti i projects dell'utente
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;

    const projects = await sql`
      SELECT * FROM projects
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ projects: projects.rows });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Crea un nuovo project
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, color } = body;

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

    await sql`
      INSERT INTO projects (id, user_id, name, color, created_at)
      VALUES (${id}, ${userId}, ${name}, ${color}, NOW())
    `;

    return NextResponse.json({ success: true, project: body });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Aggiorna un project esistente
export async function PUT(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, color } = body;

    const userId = session.user.email;

    const result = await sql`
      UPDATE projects
      SET name = ${name}, color = ${color}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, project: body });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Elimina un project
export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const userId = session.user.email;

    const result = await sql`
      DELETE FROM projects 
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
