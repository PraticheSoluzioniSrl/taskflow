import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

/**
 * Endpoint pubblico per inizializzare il database
 * Usa solo per la prima inizializzazione, poi rimuovi o proteggi questo endpoint
 */
export async function GET() {
  try {
    await initDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully! Tables created.' 
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize database', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
