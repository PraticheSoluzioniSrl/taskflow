'use client';

import { useMemo } from 'react';
import { useTaskStore } from '@/lib/store';
import { useDatabaseSync } from '@/hooks/useDatabaseSync';
import { Task, KANBAN_COLUMNS, TaskStatus } from '@/types';
import TaskCard from './TaskCard';
import { cn } from '@/lib/utils';
import { Plus, MoreHorizontal } from 'lucide-react';

interface KanbanViewProps {
  onEditTask: (task: Task) => void;
  onAddTask: () => void;
}

export default function KanbanView({ onEditTask, onAddTask }: KanbanViewProps) {
  const { getFilteredTasks } = useTaskStore();
  const { moveTask } = useDatabaseSync();
  const tasks = getFilteredTasks();

  const columns = useMemo(() => {
    return KANBAN_COLUMNS.map((column) => ({
      ...column,
      tasks: tasks
        .filter((task) => task.status === column.id)
        .sort((a, b) => {
          // Importanti prima
          if (a.important && !b.important) return -1;
          if (!a.important && b.important) return 1;
          return a.order - b.order;
        }),
    }));
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      moveTask(taskId, status);
    }
  };

  return (
    <div className="h-full overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {columns.map((column) => (
          <div
            key={column.id}
            className="kanban-column w-80 shrink-0"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="kanban-column-header">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <h3 className="font-semibold text-white">{column.title}</h3>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                  {column.tasks.length}
                </span>
              </div>
              <button className="btn-icon p-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Tasks */}
            <div className="flex-1 space-y-3 min-h-[200px]">
              {column.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <TaskCard task={task} onEdit={onEditTask} compact />
                </div>
              ))}

              {column.tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-800 rounded-lg">
                  <p className="text-sm text-slate-500 mb-2">
                    Nessun task
                  </p>
                  <p className="text-xs text-slate-600">
                    Trascina qui un task
                  </p>
                </div>
              )}
            </div>

            {/* Add Task Button */}
            {column.id === 'todo' && (
              <button
                onClick={onAddTask}
                className="w-full mt-3 py-2 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-white hover:border-slate-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Aggiungi Task</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
