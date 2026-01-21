// File: app/api/tags/route.ts
// API per gestire i tags nel database

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET - Recupera tutti i tags dell'utente
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;

    const tags = await sql`
      SELECT * FROM tags
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ tags: tags.rows });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Crea un nuovo tag
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name } = body;

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
      INSERT INTO tags (id, user_id, name, created_at)
      VALUES (${id}, ${userId}, ${name}, NOW())
    `;

    return NextResponse.json({ success: true, tag: body });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { error: 'Failed to create tag', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Aggiorna un tag esistente
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name } = body;

    const userId = session.user.email;

    const result = await sql`
      UPDATE tags
      SET name = ${name}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tag not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, tag: body });
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { error: 'Failed to update tag', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Elimina un tag
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tag ID required' }, { status: 400 });
    }

    const userId = session.user.email;

    const result = await sql`
      DELETE FROM tags 
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tag not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
