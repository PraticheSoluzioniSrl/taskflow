'use client';

import { Task, Subtask } from '@/types';
import { useTaskStore } from '@/lib/store';
import { useDatabaseSync } from '@/hooks/useDatabaseSync';
import { formatRelativeDate, isOverdue, cn } from '@/lib/utils';
import {
  Check,
  Star,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Edit,
  Bell,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  compact?: boolean;
  draggableProps?: any;
  dragHandleProps?: any;
  innerRef?: any;
}

export default function TaskCard({
  task,
  onEdit,
  compact = false,
  draggableProps,
  dragHandleProps,
  innerRef,
}: TaskCardProps) {
  const {
    toggleSubtaskComplete,
    getUserProjects,
    getUserTags,
  } = useTaskStore();
  const { 
    updateTask: syncUpdateTask, 
    deleteTask: syncDeleteTask,
    toggleTaskImportant: syncToggleTaskImportant,
    loadFromDatabase
  } = useDatabaseSync();
  
  const projects = getUserProjects();
  const tags = getUserTags();

  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const project = projects.find((p) => p.id === task.projectId);
  const taskTags = tags.filter((t) => task.tags.includes(t.id));
  const completedSubtasks = task.subtasks.filter((st) => st.completed).length;
  const hasOverdue = task.dueDate && !task.completed && isOverdue(task.dueDate);

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      className={cn(
        'group p-3 sm:p-4 bg-slate-900/60 rounded-lg border border-slate-800/50',
        'hover:bg-slate-900/80 transition-all cursor-pointer',
        task.completed && 'opacity-60',
        task.important && !task.completed && 'border-l-4 border-l-amber-500',
        hasOverdue && 'border-l-4 border-l-red-500'
      )}
      onClick={() => !compact && onEdit(task)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={async (e) => {
            e.stopPropagation();
            const updatedTask = { ...task, completed: !task.completed };
            await syncUpdateTask(task.id, { completed: !task.completed });
            // Sincronizza con Google Calendar quando si completa/uncompleta
            if (task.dueDate) {
              try {
                await fetch('/api/calendar/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ task: updatedTask, action: 'sync' }),
                });
                // Ricarica i dati per sincronizzare tutti i dispositivi
                setTimeout(() => {
                  loadFromDatabase(false);
                }, 500);
              } catch (error) {
                console.error('Error syncing to calendar:', error);
              }
            }
          }}
          className={cn(
            'mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
            task.completed
              ? 'bg-blue-600 border-blue-600'
              : 'border-slate-600 hover:border-blue-500'
          )}
        >
          {task.completed && <Check className="w-3 h-3 text-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {/* Title */}
              <h3
                className={cn(
                  'text-sm font-medium text-white leading-tight',
                  task.completed && 'line-through text-slate-400'
                )}
              >
                {task.title}
              </h3>

              {/* Description */}
              {task.description && !compact && (
                <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* Important badge */}
                {task.important && !task.completed && (
                  <span className="important-badge">
                    <Star className="w-3 h-3" />
                    <span>Importante</span>
                  </span>
                )}

                {/* Overdue badge */}
                {hasOverdue && (
                  <span className="overdue-badge">
                    <AlertCircle className="w-3 h-3" />
                    <span>In ritardo</span>
                  </span>
                )}

                {/* Due date */}
                {task.dueDate && (
                  <span
                    className={cn(
                      'flex items-center gap-1 text-xs',
                      hasOverdue ? 'text-red-400' : 'text-slate-500'
                    )}
                  >
                    <Calendar className="w-3 h-3" />
                    {formatRelativeDate(task.dueDate)}
                    {task.dueTime && ` alle ${task.dueTime}`}
                  </span>
                )}

                {/* Reminder */}
                {task.reminder && (
                  <span className="flex items-center gap-1 text-xs text-blue-400">
                    <Bell className="w-3 h-3" />
                    Promemoria
                  </span>
                )}

                {/* Project */}
                {project && (
                  <span
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${project.color}20`,
                      color: project.color,
                    }}
                  >
                    {project.name}
                  </span>
                )}

                {/* Tags */}
                {taskTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="tag-badge"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}

                {/* Subtasks counter */}
                {task.subtasks.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Check className="w-3 h-3" />
                    {completedSubtasks}/{task.subtasks.length}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await syncToggleTaskImportant(task.id);
                }}
                className={cn(
                  'btn-icon p-1.5',
                  task.important && 'text-amber-400'
                )}
              >
                <Star className={cn('w-4 h-4', task.important && 'fill-current')} />
              </button>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="btn-icon p-1.5"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                      }}
                    />
                    <div className="absolute right-0 top-full mt-1 z-20 glass-card p-1 min-w-[140px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(task);
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                        Modifica
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          // Elimina anche l'evento da Google Calendar se esiste
                          if (task.googleCalendarEventId) {
                            try {
                              await fetch('/api/calendar/sync', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ task, action: 'delete' }),
                              });
                            } catch (error) {
                              console.error('Error deleting calendar event:', error);
                            }
                          }
                          await syncDeleteTask(task.id);
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                        Elimina
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Subtasks (expandable) */}
          {task.subtasks.length > 0 && !compact && (
            <div className="mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
              >
                {expanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                {task.subtasks.length} subtask
              </button>

              {expanded && (
                <div className="mt-2 pl-2 space-y-2 border-l border-slate-700">
                  {task.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => toggleSubtaskComplete(task.id, subtask.id)}
                        className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                          subtask.completed
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-slate-600 hover:border-blue-500'
                        )}
                      >
                        {subtask.completed && (
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                      </button>
                      <span
                        className={cn(
                          'text-sm',
                          subtask.completed
                            ? 'text-slate-500 line-through'
                            : 'text-slate-300'
                        )}
                      >
                        {subtask.title}
                      </span>
                      {subtask.reminder && (
                        <Bell className="w-3 h-3 text-blue-400" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
