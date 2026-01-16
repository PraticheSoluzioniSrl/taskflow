'use client';

import { useMemo } from 'react';
import { useTaskStore } from '@/lib/store';
import { Task } from '@/types';
import TaskCard from './TaskCard';
import { formatRelativeDate, cn } from '@/lib/utils';
import { format, parseISO, isToday, isTomorrow, isThisWeek, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { InboxIcon, CalendarDays, Star, AlertCircle } from 'lucide-react';

interface ListViewProps {
  onEditTask: (task: Task) => void;
}

export default function ListView({ onEditTask }: ListViewProps) {
  const { getFilteredTasks, filters } = useTaskStore();
  const tasks = getFilteredTasks();

  // Group tasks by date
  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: Task[] } = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
      noDate: [],
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tasks.forEach((task) => {
      if (!task.dueDate) {
        groups.noDate.push(task);
      } else {
        const dueDate = parseISO(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today && !task.completed) {
          groups.overdue.push(task);
        } else if (isToday(dueDate)) {
          groups.today.push(task);
        } else if (isTomorrow(dueDate)) {
          groups.tomorrow.push(task);
        } else if (isThisWeek(dueDate, { weekStartsOn: 1 })) {
          groups.thisWeek.push(task);
        } else {
          groups.later.push(task);
        }
      }
    });

    // Sort each group by importance first, then by order
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        if (a.important && !b.important) return -1;
        if (!a.important && b.important) return 1;
        return a.order - b.order;
      });
    });

    return groups;
  }, [tasks]);

  const sections = [
    {
      key: 'overdue',
      title: 'In Ritardo',
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      key: 'today',
      title: 'Oggi',
      icon: CalendarDays,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      key: 'tomorrow',
      title: 'Domani',
      icon: CalendarDays,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      key: 'thisWeek',
      title: 'Questa Settimana',
      icon: CalendarDays,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      key: 'later',
      title: 'Più Avanti',
      icon: CalendarDays,
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
    },
    {
      key: 'noDate',
      title: 'Senza Data',
      icon: InboxIcon,
      color: 'text-slate-500',
      bgColor: 'bg-slate-500/10',
    },
  ];

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
          <InboxIcon className="w-10 h-10 text-slate-600" />
        </div>
        <h3 className="text-lg font-medium text-slate-400 mb-2">
          Nessun task trovato
        </h3>
        <p className="text-sm text-slate-500 max-w-md">
          {filters.searchQuery
            ? `Nessun risultato per "${filters.searchQuery}"`
            : 'Crea il tuo primo task per iniziare a organizzare il tuo lavoro'}
        </p>
      </div>
    );
  }

  // Se il filtro "In Ritardo" è attivo, mostra solo i task in ritardo
  const displaySections = filters.showOverdueOnly
    ? sections.filter(s => s.key === 'overdue')
    : sections;

  return (
    <div className="space-y-8">
      {displaySections.map((section) => {
        const sectionTasks = groupedTasks[section.key];
        if (sectionTasks.length === 0) return null;

        const Icon = section.icon;

        return (
          <div key={section.key} className="animate-fade-in">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('p-2 rounded-lg', section.bgColor)}>
                <Icon className={cn('w-4 h-4', section.color)} />
              </div>
              <h2 className={cn('text-sm font-semibold uppercase tracking-wider', section.color)}>
                {section.title}
              </h2>
              <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
                {sectionTasks.length}
              </span>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {sectionTasks.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={onEditTask} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
