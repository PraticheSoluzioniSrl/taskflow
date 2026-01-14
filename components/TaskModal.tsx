'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Task, PROJECT_COLORS, TAG_COLORS } from '@/types';
import { useTaskStore } from '@/lib/store';
import { cn, formatDate } from '@/lib/utils';
import {
  X,
  Calendar,
  Clock,
  Bell,
  Star,
  Tag,
  FolderOpen,
  Plus,
  Trash2,
  ChevronDown,
} from 'lucide-react';

interface TaskModalProps {
  task?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export default function TaskModal({
  task,
  isOpen,
  onClose,
  defaultDate,
}: TaskModalProps) {
  const { addTask, updateTask, getUserProjects, getUserTags, addSubtask, deleteSubtask, updateSubtask } = useTaskStore();
  const { data: session } = useSession();
  
  const projects = getUserProjects();
  const tags = getUserTags();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [reminder, setReminder] = useState('');
  const [important, setImportant] = useState(false);
  const [projectId, setProjectId] = useState<string | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [status, setStatus] = useState<Task['status']>('todo');
  const [newSubtask, setNewSubtask] = useState('');
  const [subtasks, setSubtasks] = useState<Task['subtasks']>([]);

  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.dueDate || '');
      setDueTime(task.dueTime || '');
      setReminder(task.reminder || '');
      setImportant(task.important);
      setProjectId(task.projectId);
      setSelectedTags(task.tags);
      setStatus(task.status);
      setSubtasks(task.subtasks);
    } else {
      resetForm();
      if (defaultDate) {
        setDueDate(defaultDate);
      }
    }
  }, [task, defaultDate, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setDueTime('');
    setReminder('');
    setImportant(false);
    setProjectId(undefined);
    setSelectedTags([]);
    setStatus('todo');
    setNewSubtask('');
    setSubtasks([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const userId = session?.user?.email || '';
    if (!userId) return;

    const taskData = {
      userId,
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      reminder: reminder || undefined,
      important,
      projectId,
      tags: selectedTags,
      status,
      completed: status === 'done',
      subtasks,
    };

    if (task) {
      updateTask(task.id, taskData);
    } else {
      addTask(taskData);
    }

    onClose();
    resetForm();
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const newSub = {
      id: Math.random().toString(36).substr(2, 9),
      title: newSubtask.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtask('');
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    );
  };

  if (!isOpen) return null;

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {task ? 'Modifica Task' : 'Nuovo Task'}
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titolo del task"
              className="input-base text-lg font-medium"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrizione (opzionale)"
              className="input-base min-h-[100px] resize-none"
            />
          </div>

          {/* Important toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setImportant(!important)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all',
                important
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'border-slate-700 text-slate-400 hover:border-amber-500/50'
              )}
            >
              <Star className={cn('w-4 h-4', important && 'fill-current')} />
              <span className="text-sm font-medium">
                {important ? 'Task Importante' : 'Segna come importante'}
              </span>
            </button>
            {important && (
              <span className="text-xs text-slate-500">
                Non scomparirà finché non completato
              </span>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Data scadenza
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Ora
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              <Bell className="inline w-4 h-4 mr-1" />
              Promemoria
            </label>
            <input
              type="datetime-local"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              className="input-base"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Stato</label>
            <div className="flex gap-2">
              {(['backlog', 'todo', 'in-progress', 'done'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    status === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  )}
                >
                  {s === 'backlog' && 'Backlog'}
                  {s === 'todo' && 'Da Fare'}
                  {s === 'in-progress' && 'In Corso'}
                  {s === 'done' && 'Completato'}
                </button>
              ))}
            </div>
          </div>

          {/* Project */}
          <div className="relative">
            <label className="block text-sm text-slate-400 mb-2">
              <FolderOpen className="inline w-4 h-4 mr-1" />
              Progetto
            </label>
            <button
              type="button"
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="input-base flex items-center justify-between"
            >
              {selectedProject ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedProject.color }}
                  />
                  {selectedProject.name}
                </div>
              ) : (
                <span className="text-slate-500">Seleziona progetto</span>
              )}
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {showProjectDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowProjectDropdown(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-1 z-20 glass-card p-2 max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setProjectId(undefined);
                      setShowProjectDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                  >
                    Nessun progetto
                  </button>
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        setProjectId(project.id);
                        setShowProjectDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              <Tag className="inline w-4 h-4 mr-1" />
              Tag
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    'tag-badge transition-all',
                    selectedTags.includes(tag.id)
                      ? 'ring-2 ring-white/30'
                      : 'opacity-60 hover:opacity-100'
                  )}
                  style={{
                    backgroundColor: `${tag.color}30`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </button>
              ))}
              {tags.length === 0 && (
                <span className="text-sm text-slate-500">
                  Nessun tag disponibile
                </span>
              )}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Subtask
            </label>
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 p-2 bg-slate-900/60 rounded-lg"
                >
                  <span className="flex-1 text-sm text-slate-300">
                    {subtask.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="p-1 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Aggiungi subtask"
                  className="input-base flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="btn-secondary"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {task ? 'Salva Modifiche' : 'Crea Task'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
