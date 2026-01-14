import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { initDatabase } from '@/lib/db';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
