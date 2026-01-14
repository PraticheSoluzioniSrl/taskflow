import { createClient } from '@vercel/postgres';
import { Task, Project, Tag } from '@/types';

// Crea il client del database
const db = createClient();

// Inizializza le tabelle del database (da chiamare una volta)
export async function initDatabase() {
  try {
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
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Crea tabella tags
    await db.sql`
      CREATE TABLE IF NOT EXISTS tags (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(7) NOT NULL
      );
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
        task_order INTEGER DEFAULT 0
      );
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
    // Prima recupera i task
    const tasksResult = await db.sql`
      SELECT * FROM tasks
      WHERE user_id = ${userId}
      ORDER BY task_order ASC, created_at DESC;
    `;

    const tasks = tasksResult.rows;

    // Per ogni task, recupera i tag e i subtask
    const tasksWithRelations = await Promise.all(
      tasks.map(async (task: any) => {
        // Recupera i tag
        const tagsResult = await db.sql`
          SELECT tag_id FROM task_tags
          WHERE task_id = ${task.id};
        `;
        const tags = tagsResult.rows.map((row: any) => row.tag_id);

        // Recupera i subtask
        const subtasksResult = await db.sql`
          SELECT id, title, completed, reminder
          FROM subtasks
          WHERE task_id = ${task.id};
        `;
        const subtasks = subtasksResult.rows.map((row: any) => ({
          id: row.id,
          title: row.title,
          completed: row.completed,
          reminder: row.reminder || undefined,
        }));

        return {
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
          tags,
          subtasks,
          status: task.status as Task['status'],
          createdAt: task.created_at,
          updatedAt: task.updated_at,
          googleCalendarEventId: task.google_calendar_event_id,
          order: task.task_order || 0,
        };
      })
    );

    return tasksWithRelations;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Promise<Task> {
  try {
    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Inserisci il task
    await db.sql`
      INSERT INTO tasks (
        id, user_id, project_id, title, description, completed, important,
        due_date, due_time, reminder, status, google_calendar_event_id,
        created_at, updated_at, task_order
      )
      VALUES (
        ${taskId}, ${task.userId}, ${task.projectId || null}, ${task.title},
        ${task.description || null}, ${task.completed}, ${task.important},
        ${task.dueDate || null}, ${task.dueTime || null}, ${task.reminder || null},
        ${task.status}, ${task.googleCalendarEventId || null},
        ${now}, ${now}, 0
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
    };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function updateTask(taskId: string, updates: Partial<Task>, userId: string): Promise<void> {
  try {
    // Costruisci le query statiche per ogni campo da aggiornare
    if (updates.title !== undefined) {
      await db.sql`UPDATE tasks SET title = ${updates.title}, updated_at = NOW() WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.description !== undefined) {
      await db.sql`UPDATE tasks SET description = ${updates.description || null}, updated_at = NOW() WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.completed !== undefined) {
      await db.sql`UPDATE tasks SET completed = ${updates.completed}, updated_at = NOW() WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.important !== undefined) {
      await db.sql`UPDATE tasks SET important = ${updates.important}, updated_at = NOW() WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.dueDate !== undefined) {
      await db.sql`UPDATE tasks SET due_date = ${updates.dueDate || null}, updated_at = NOW() WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.dueTime !== undefined) {
      await db.sql`UPDATE tasks SET due_time = ${updates.dueTime || null}, updated_at = NOW() WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.reminder !== undefined) {
      await db.sql`UPDATE tasks SET reminder = ${updates.reminder || null}, updated_at = NOW() WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.status !== undefined) {
      await db.sql`UPDATE tasks SET status = ${updates.status}, updated_at = NOW() WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.projectId !== undefined) {
      await db.sql`UPDATE tasks SET project_id = ${updates.projectId || null}, updated_at = NOW() WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    if (updates.googleCalendarEventId !== undefined) {
      await db.sql`UPDATE tasks SET google_calendar_event_id = ${updates.googleCalendarEventId || null}, updated_at = NOW() WHERE id = ${taskId} AND user_id = ${userId}`;
    }
    
    // Se non ci sono aggiornamenti specifici, aggiorna solo updated_at
    if (Object.keys(updates).length === 0) {
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
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

export async function createProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
  try {
    const projectId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.sql`
      INSERT INTO projects (id, user_id, name, color, created_at)
      VALUES (${projectId}, ${project.userId}, ${project.name}, ${project.color}, ${now});
    `;

    return {
      ...project,
      id: projectId,
      createdAt: now,
    };
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

export async function updateProject(projectId: string, updates: Partial<Project>, userId: string): Promise<void> {
  try {
    if (updates.name !== undefined) {
      await db.sql`UPDATE projects SET name = ${updates.name} WHERE id = ${projectId} AND user_id = ${userId}`;
    }
    if (updates.color !== undefined) {
      await db.sql`UPDATE projects SET color = ${updates.color} WHERE id = ${projectId} AND user_id = ${userId}`;
    }
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

export async function deleteProject(projectId: string, userId: string): Promise<void> {
  try {
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
    }));
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
}

export async function createTag(tag: Omit<Tag, 'id'>): Promise<Tag> {
  try {
    const tagId = crypto.randomUUID();

    await db.sql`
      INSERT INTO tags (id, user_id, name, color)
      VALUES (${tagId}, ${tag.userId}, ${tag.name}, ${tag.color});
    `;

    return {
      ...tag,
      id: tagId,
    };
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
}

export async function updateTag(tagId: string, updates: Partial<Tag>, userId: string): Promise<void> {
  try {
    if (updates.name !== undefined) {
      await db.sql`UPDATE tags SET name = ${updates.name} WHERE id = ${tagId} AND user_id = ${userId}`;
    }
    if (updates.color !== undefined) {
      await db.sql`UPDATE tags SET color = ${updates.color} WHERE id = ${tagId} AND user_id = ${userId}`;
    }
  } catch (error) {
    console.error('Error updating tag:', error);
    throw error;
  }
}

export async function deleteTag(tagId: string, userId: string): Promise<void> {
  try {
    await db.sql`
      DELETE FROM tags
      WHERE id = ${tagId} AND user_id = ${userId};
    `;
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
}
