import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@vercel/postgres';

export const maxDuration = 60; // Aumenta il timeout a 60 secondi
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
          const session = await auth();
          if (!session?.user?.email) {
                  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

      // Inizializza le tabelle una alla volta invece che tutte insieme
      const tablesCreated = [];

      // 1. Tabella users
      try {
              await sql`
                      CREATE TABLE IF NOT EXISTS users (
                                id TEXT PRIMARY KEY,
                                          email TEXT UNIQUE NOT NULL,
                                                    name TEXT,
                                                              image TEXT,
                                                                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                                                )
                                                                                      `;
              tablesCreated.push('users');
      } catch (e: any) {
              if (!e.message?.includes('already exists')) throw e;
      }

      // 2. Tabella projects
      try {
              await sql`
                      CREATE TABLE IF NOT EXISTS projects (
                                id TEXT PRIMARY KEY,
                                          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                                    name TEXT NOT NULL,
                                                              color TEXT NOT NULL,
                                                                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                                                )
                                                                                      `;
              tablesCreated.push('projects');
      } catch (e: any) {
              if (!e.message?.includes('already exists')) throw e;
      }

      // 3. Tabella tags  
      try {
              await sql`
                      CREATE TABLE IF NOT EXISTS tags (
                                id TEXT PRIMARY KEY,
                                          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                                    name TEXT NOT NULL,
                                                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                                      )
                                                                            `;
              tablesCreated.push('tags');
      } catch (e: any) {
              if (!e.message?.includes('already exists')) throw e;
      }

      // 4. Tabella tasks
      try {
              await sql`
                      CREATE TABLE IF NOT EXISTS tasks (
                                id TEXT PRIMARY KEY,
                                          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                                    title TEXT NOT NULL,
                                                              description TEXT,
                                                                        date TEXT,
                                                                                  time TEXT,
                                                                                            reminder TEXT,
                                                                                                      important BOOLEAN DEFAULT false,
                                                                                                                completed BOOLEAN DEFAULT false,
                                                                                                                          project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
                                                                                                                                    status TEXT DEFAULT 'backlog',
                                                                                                                                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                                                                                                                                )
                                                                                                                                                                      `;
              tablesCreated.push('tasks');
      } catch (e: any) {
              if (!e.message?.includes('already exists')) throw e;
      }

      // 5. Tabella task_tags (relazione many-to-many)
      try {
              await sql`
                      CREATE TABLE IF NOT EXISTS task_tags (
                                task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                                          tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
                                                    PRIMARY KEY (task_id, tag_id)
                                                            )
                                                                  `;
              tablesCreated.push('task_tags');
      } catch (e: any) {
              if (!e.message?.includes('already exists')) throw e;
      }

      // 6. Tabella subtasks
      try {
              await sql`
                      CREATE TABLE IF NOT EXISTS subtasks (
                                id TEXT PRIMARY KEY,
                                          task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                                                    title TEXT NOT NULL,
                                                              completed BOOLEAN DEFAULT false,
                                                                        reminder TEXT,
                                                                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                                                          )
                                                                                                `;
              tablesCreated.push('subtasks');
      } catch (e: any) {
              if (!e.message?.includes('already exists')) throw e;
      }

      // Crea indici per performance
      try {
              await sql`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`;
              await sql`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)`;
              await sql`CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)`;
              await sql`CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)`;
              await sql`CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id)`;
      } catch (e: any) {
              // Ignora errori per indici già esistenti
      }

      return NextResponse.json({ 
                                     success: true, 
              message: 'Database initialized successfully',
              tables_created: tablesCreated,
              total_tables: tablesCreated.length
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
