import { createClient } from '@vercel/postgres';
import { Task, Project, Tag } from '@/types';

// Funzione helper per ottenere il client del database
// Creiamo il client solo quando necessario, non a livello di modulo
function getDb() {
  return createClient();
}

// Inizializza le tabelle del database (da chiamare una volta)
export async function initDatabase() {
  try {
    const db = getDb();
    // Crea tabella users
    await db.sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        image VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Crea tabella projects
    await db.sql`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(7) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        version INTEGER DEFAULT 1,
        last_modified BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
        sync_status VARCHAR(20) DEFAULT 'synced'
      );
    `;
    
    // Aggiungi colonne se non esistono (per migrazione)
    await db.sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='version') THEN
          ALTER TABLE projects ADD COLUMN version INTEGER DEFAULT 1;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='last_modified') THEN
          ALTER TABLE projects ADD COLUMN last_modified BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='sync_status') THEN
          ALTER TABLE projects ADD COLUMN sync_status VARCHAR(20) DEFAULT 'synced';
        END IF;
      END $$;
    `;

    // Crea tabella tags
    await db.sql`
      CREATE TABLE IF NOT EXISTS tags (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(7) NOT NULL,
        version INTEGER DEFAULT 1,
        last_modified BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
        sync_status VARCHAR(20) DEFAULT 'synced'
      );
    `;
    
    // Aggiungi colonne se non esistono (per migrazione)
    await db.sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tags' AND column_name='version') THEN
          ALTER TABLE tags ADD COLUMN version INTEGER DEFAULT 1;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tags' AND column_name='last_modified') THEN
          ALTER TABLE tags ADD COLUMN last_modified BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tags' AND column_name='sync_status') THEN
          ALTER TABLE tags ADD COLUMN sync_status VARCHAR(20) DEFAULT 'synced';
        END IF;
      END $$;
    `;

    // Crea tabella tasks
    await db.sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id VARCHAR(255) REFERENCES projects(id) ON DELETE SET NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        important BOOLEAN DEFAULT FALSE,
        due_date DATE,
        due_time TIME,
        reminder TIMESTAMP,
        status VARCHAR(20) DEFAULT 'todo',
        google_calendar_event_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        task_order INTEGER DEFAULT 0,
        version INTEGER DEFAULT 1,
        last_modified BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
        sync_status VARCHAR(20) DEFAULT 'synced',
        calendar_event_id VARCHAR(255)
      );
    `;
    
    // Aggiungi colonne se non esistono (per migrazione)
    await db.sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='version') THEN
          ALTER TABLE tasks ADD COLUMN version INTEGER DEFAULT 1;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='last_modified') THEN
          ALTER TABLE tasks ADD COLUMN last_modified BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='sync_status') THEN
          ALTER TABLE tasks ADD COLUMN sync_status VARCHAR(20) DEFAULT 'synced';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='calendar_event_id') THEN
          ALTER TABLE tasks ADD COLUMN calendar_event_id VARCHAR(255);
        END IF;
      END $$;
    `;

    // Crea tabella task_tags (many-to-many)
    await db.sql`
      CREATE TABLE IF NOT EXISTS task_tags (
        task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        tag_id VARCHAR(255) NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (task_id, tag_id)
      );
    `;

    // Crea tabella subtasks
    await db.sql`
      CREATE TABLE IF NOT EXISTS subtasks (
        id VARCHAR(255) PRIMARY KEY,
        task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        reminder TIMESTAMP
      );
    `;

    // Crea indici per migliorare le performance
    await db.sql`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);`;

    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Funzioni per gestire gli utenti
export async function createOrUpdateUser(userId: string, email: string, name?: string, image?: string) {
  try {
    const db = getDb();
    await db.sql`
      INSERT INTO users (id, email, name, image)
      VALUES (${userId}, ${email}, ${name || null}, ${image || null})
      ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          name = EXCLUDED.name,
          image = EXCLUDED.image;
    `;
    return { success: true };
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
}

// Funzioni per gestire i task
export async function getTasksByUserId(userId: string): Promise<Task[]> {
  try {
    const db = getDb();
    
    // Query ottimizzata: recupera tutto in batch invece di query separate per ogni task
    // Prima recupera tutti i task
    const tasksResult = await db.sql`
      SELECT * FROM tasks
      WHERE user_id = ${userId}
      ORDER BY task_order ASC, created_at DESC;
    `;

    const tasks = tasksResult.rows;
    
    if (tasks.length === 0) {
      return [];
    }

    // Recupera tutti i tag e subtask in batch usando query separate per batch
    // Questo evita problemi con array SQL e mantiene buone performance
    const taskIds = tasks.map((t: any) => t.id);
    
    if (taskIds.length === 0) {
      return [];
    }
    
    // Usa un approccio con loop batch per evitare problemi con array SQL
    // Processa in batch di 50 per evitare query troppo lunghe
    const batchSize = 50;
    const allTagsMap = new Map<string, string[]>();
    const allSubtasksMap = new Map<string, any[]>();
    
    for (let i = 0; i < taskIds.length; i += batchSize) {
      const batch = taskIds.slice(i, i + batchSize);
      
      // Per ogni batch, costruisci query con parametri individuali
      // Usa un approccio più semplice: query separate per ogni ID nel batch
      // Questo è più sicuro e compatibile con Vercel Postgres
      const batchTagsPromises = batch.map(async (taskId: string) => {
        const result = await db.sql`
          SELECT tag_id FROM task_tags WHERE task_id = ${taskId}
        `;
        return { taskId, tags: result.rows.map((r: any) => r.tag_id) };
      });
      
      const batchSubtasksPromises = batch.map(async (taskId: string) => {
        const result = await db.sql`
          SELECT id, title, completed, reminder FROM subtasks WHERE task_id = ${taskId}
        `;
        return {
          taskId,
          subtasks: result.rows.map((r: any) => ({
            id: r.id,
            title: r.title,
            completed: r.completed,
            reminder: r.reminder || undefined,
          })),
        };
      });
      
      const batchTagsResults = await Promise.all(batchTagsPromises);
      const batchSubtasksResults = await Promise.all(batchSubtasksPromises);
      
      batchTagsResults.forEach(({ taskId, tags }) => {
        allTagsMap.set(taskId, tags);
      });
      
      batchSubtasksResults.forEach(({ taskId, subtasks }) => {
        allSubtasksMap.set(taskId, subtasks);
      });
    }
    
    // Crea mappe per accesso rapido (già popolate)
    const tagsMap = allTagsMap;
    const subtasksMap = allSubtasksMap;

    // Le mappe sono già popolate nel loop sopra

    // Costruisci i task con le relazioni
    const tasksWithRelations = tasks.map((task: any) => ({
      id: task.id,
      userId: task.user_id,
      title: task.title,
      description: task.description,
      completed: task.completed,
      important: task.important,
      dueDate: task.due_date,
      dueTime: task.due_time,
      reminder: task.reminder,
      projectId: task.project_id,
      tags: tagsMap.get(task.id) || [],
      subtasks: subtasksMap.get(task.id) || [],
      status: task.status as Task['status'],
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      googleCalendarEventId: task.google_calendar_event_id,
      order: task.task_order || 0,
      version: task.version || 1,
      lastModified: task.last_modified ? Number(task.last_modified) : Date.now(),
      syncStatus: task.sync_status || 'synced',
      calendarEventId: task.calendar_event_id,
    }));

    return tasksWithRelations;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'version' | 'lastModified'>): Promise<Task> {
  try {
    const db = getDb();
    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();
    const nowTimestamp = Date.now();
    const version = 1;

    // Inserisci il task
    await db.sql`
      INSERT INTO tasks (
        id, user_id, project_id, title, description, completed, important,
        due_date, due_time, reminder, status, google_calendar_event_id,
        created_at, updated_at, task_order, version, last_modified, sync_status, calendar_event_id
      )
      VALUES (
        ${taskId}, ${task.userId}, ${task.projectId || null}, ${task.title},
        ${task.description || null}, ${task.completed}, ${task.important},
        ${task.dueDate || null}, ${task.dueTime || null}, ${task.reminder || null},
        ${task.status}, ${task.googleCalendarEventId || null},
        ${now}, ${now}, 0, ${version}, ${nowTimestamp}, 'synced', ${task.calendarEventId || null}
      );
    `;

    // Inserisci i tag associati
    if (task.tags && task.tags.length > 0) {
      for (const tagId of task.tags) {
        await db.sql`
          INSERT INTO task_tags (task_id, tag_id)
          VALUES (${taskId}, ${tagId})
          ON CONFLICT DO NOTHING;
        `;
      }
    }

    // Inserisci i subtask
    if (task.subtasks && task.subtasks.length > 0) {
      for (const subtask of task.subtasks) {
        await db.sql`
          INSERT INTO subtasks (id, task_id, title, completed, reminder)
          VALUES (${subtask.id}, ${taskId}, ${subtask.title}, ${subtask.completed}, ${subtask.reminder || null});
        `;
      }
    }

    return {
      ...task,
      id: taskId,
      createdAt: now,
      updatedAt: now,
      order: 0,
      version,
      lastModified: nowTimestamp,
      syncStatus: 'synced',
      calendarEventId: task.calendarEventId,
    };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function updateTask(taskId: string, updates: Partial<Task>, userId: string): Promise<void> {
  try {
    const db = getDb();
    
    // Recupera il task corrente per ottenere la versione
    const currentTaskResult = await db.sql`
      SELECT version FROM tasks WHERE id = ${taskId} AND user_id = ${userId}
    `;
    const currentVersion = currentTaskResult.rows[0]?.version || 1;
    const newVersion = updates.version !== undefined ? updates.version : currentVersion + 1;
    const nowTimestamp = updates.lastModified !== undefined ? updates.lastModified : Date.now();
    
    // Costruisci le query statiche per ogni campo da aggiornare
    if (updates.title !== undefined) {
      await db.sql`UPDATE tasks SET title = ${updates.title}, updated_at = NOW(), version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = 'synced' WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.description !== undefined) {
      await db.sql`UPDATE tasks SET description = ${updates.description || null}, updated_at = NOW(), version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = 'synced' WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.completed !== undefined) {
      await db.sql`UPDATE tasks SET completed = ${updates.completed}, updated_at = NOW(), version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = 'synced' WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.important !== undefined) {
      await db.sql`UPDATE tasks SET important = ${updates.important}, updated_at = NOW(), version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = 'synced' WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.dueDate !== undefined) {
      await db.sql`UPDATE tasks SET due_date = ${updates.dueDate || null}, updated_at = NOW(), version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = 'synced' WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.dueTime !== undefined) {
      await db.sql`UPDATE tasks SET due_time = ${updates.dueTime || null}, updated_at = NOW(), version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = 'synced' WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.reminder !== undefined) {
      await db.sql`UPDATE tasks SET reminder = ${updates.reminder || null}, updated_at = NOW(), version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = 'synced' WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.status !== undefined) {
      await db.sql`UPDATE tasks SET status = ${updates.status}, updated_at = NOW(), version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = 'synced' WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.projectId !== undefined) {
      await db.sql`UPDATE tasks SET project_id = ${updates.projectId || null}, updated_at = NOW(), version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = 'synced' WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.googleCalendarEventId !== undefined) {
      await db.sql`UPDATE tasks SET google_calendar_event_id = ${updates.googleCalendarEventId || null}, updated_at = NOW(), version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = 'synced' WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.calendarEventId !== undefined) {
      await db.sql`UPDATE tasks SET calendar_event_id = ${updates.calendarEventId || null}, updated_at = NOW(), version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = 'synced' WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.version !== undefined || updates.lastModified !== undefined || updates.syncStatus !== undefined) {
      // Aggiorna solo i campi di sincronizzazione se specificati
      await db.sql`UPDATE tasks SET version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = ${updates.syncStatus || 'synced'}, updated_at = NOW() WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    
    // Se non ci sono aggiornamenti specifici, aggiorna solo updated_at
    if (Object.keys(updates).filter(k => !['version', 'lastModified', 'syncStatus'].includes(k)).length === 0 && updates.version === undefined && updates.lastModified === undefined && updates.syncStatus === undefined) {
      await db.sql`UPDATE tasks SET updated_at = NOW() WHERE id = ${taskId} AND user_id = ${userId}`;
    }

    // Aggiorna i tag se necessario
    if (updates.tags !== undefined) {
      // Rimuovi tutti i tag esistenti
      await db.sql`DELETE FROM task_tags WHERE task_id = ${taskId};`;
      // Aggiungi i nuovi tag
      if (updates.tags.length > 0) {
        for (const tagId of updates.tags) {
          await db.sql`
            INSERT INTO task_tags (task_id, tag_id)
            VALUES (${taskId}, ${tagId});
          `;
        }
      }
    }

    // Aggiorna i subtask se necessario
    if (updates.subtasks !== undefined) {
      // Rimuovi tutti i subtask esistenti
      await db.sql`DELETE FROM subtasks WHERE task_id = ${taskId};`;
      // Aggiungi i nuovi subtask
      if (updates.subtasks.length > 0) {
        for (const subtask of updates.subtasks) {
          await db.sql`
            INSERT INTO subtasks (id, task_id, title, completed, reminder)
            VALUES (${subtask.id}, ${taskId}, ${subtask.title}, ${subtask.completed}, ${subtask.reminder || null});
          `;
        }
      }
    }
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function deleteTask(taskId: string, userId: string): Promise<void> {
  try {
    const db = getDb();
    await db.sql`
      DELETE FROM tasks
      WHERE id = ${taskId} AND user_id = ${userId};
    `;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// Funzioni per gestire i progetti
export async function getProjectsByUserId(userId: string): Promise<Project[]> {
  try {
    const db = getDb();
    const result = await db.sql`
      SELECT * FROM projects
      WHERE user_id = ${userId}
      ORDER BY created_at DESC;
    `;
    return result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      color: row.color,
      createdAt: row.created_at,
      version: row.version || 1,
      lastModified: row.last_modified ? Number(row.last_modified) : Date.now(),
      syncStatus: row.sync_status || 'synced',
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

export async function createProject(project: Omit<Project, 'id' | 'createdAt' | 'version' | 'lastModified'>): Promise<Project> {
  try {
    const db = getDb();
    const projectId = crypto.randomUUID();
    const now = new Date().toISOString();
    const nowTimestamp = Date.now();
    const version = 1;

    await db.sql`
      INSERT INTO projects (id, user_id, name, color, created_at, version, last_modified, sync_status)
      VALUES (${projectId}, ${project.userId}, ${project.name}, ${project.color}, ${now}, ${version}, ${nowTimestamp}, 'synced');
    `;

    return {
      ...project,
      id: projectId,
      createdAt: now,
      version,
      lastModified: nowTimestamp,
      syncStatus: 'synced',
    };
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

export async function updateProject(projectId: string, updates: Partial<Project>, userId: string): Promise<void> {
  try {
    const db = getDb();
    
    // Recupera la versione corrente
    const currentProjectResult = await db.sql`
      SELECT version FROM projects WHERE id = ${projectId} AND user_id = ${userId}
    `;
    const currentVersion = currentProjectResult.rows[0]?.version || 1;
    const newVersion = updates.version !== undefined ? updates.version : currentVersion + 1;
    const nowTimestamp = updates.lastModified !== undefined ? updates.lastModified : Date.now();
    
    if (updates.name !== undefined) {
      await db.sql`UPDATE projects SET name = ${updates.name}, version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = 'synced' WHERE id = ${projectId} AND user_id = ${userId}`;
    }
    if (updates.color !== undefined) {
      await db.sql`UPDATE projects SET color = ${updates.color}, version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = 'synced' WHERE id = ${projectId} AND user_id = ${userId}`;
    }
    if (updates.version !== undefined || updates.lastModified !== undefined || updates.syncStatus !== undefined) {
      await db.sql`UPDATE projects SET version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = ${updates.syncStatus || 'synced'} WHERE id = ${projectId} AND user_id = ${userId}`;
    }
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

export async function deleteProject(projectId: string, userId: string): Promise<void> {
  try {
    const db = getDb();
    await db.sql`
      DELETE FROM projects
      WHERE id = ${projectId} AND user_id = ${userId};
    `;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

// Funzioni per gestire i tag
export async function getTagsByUserId(userId: string): Promise<Tag[]> {
  try {
    const db = getDb();
    const result = await db.sql`
      SELECT * FROM tags
      WHERE user_id = ${userId}
      ORDER BY name ASC;
    `;
    return result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      color: row.color,
      version: row.version || 1,
      lastModified: row.last_modified ? Number(row.last_modified) : Date.now(),
      syncStatus: row.sync_status || 'synced',
    }));
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
}

export async function createTag(tag: Omit<Tag, 'id' | 'version' | 'lastModified'>): Promise<Tag> {
  try {
    const db = getDb();
    const tagId = crypto.randomUUID();
    const nowTimestamp = Date.now();
    const version = 1;

    await db.sql`
      INSERT INTO tags (id, user_id, name, color, version, last_modified, sync_status)
      VALUES (${tagId}, ${tag.userId}, ${tag.name}, ${tag.color}, ${version}, ${nowTimestamp}, 'synced');
    `;

    return {
      ...tag,
      id: tagId,
      version,
      lastModified: nowTimestamp,
      syncStatus: 'synced',
    };
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
}

export async function updateTag(tagId: string, updates: Partial<Tag>, userId: string): Promise<void> {
  try {
    const db = getDb();
    
    // Recupera la versione corrente
    const currentTagResult = await db.sql`
      SELECT version FROM tags WHERE id = ${tagId} AND user_id = ${userId}
    `;
    const currentVersion = currentTagResult.rows[0]?.version || 1;
    const newVersion = updates.version !== undefined ? updates.version : currentVersion + 1;
    const nowTimestamp = updates.lastModified !== undefined ? updates.lastModified : Date.now();
    
    if (updates.name !== undefined) {
      await db.sql`UPDATE tags SET name = ${updates.name}, version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = 'synced' WHERE id = ${tagId} AND user_id = ${userId}`;
    }
    if (updates.color !== undefined) {
      await db.sql`UPDATE tags SET color = ${updates.color}, version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = 'synced' WHERE id = ${tagId} AND user_id = ${userId}`;
    }
    if (updates.version !== undefined || updates.lastModified !== undefined || updates.syncStatus !== undefined) {
      await db.sql`UPDATE tags SET version = ${newVersion}, last_modified = ${nowTimestamp}, sync_status = ${updates.syncStatus || 'synced'} WHERE id = ${tagId} AND user_id = ${userId}`;
    }
  } catch (error) {
    console.error('Error updating tag:', error);
    throw error;
  }
}

export async function deleteTag(tagId: string, userId: string): Promise<void> {
  try {
    const db = getDb();
    await db.sql`
      DELETE FROM tags
      WHERE id = ${tagId} AND user_id = ${userId};
    `;
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
}
