'use client';

import { useState, useMemo } from 'react';
import { useTaskStore } from '@/lib/store';
import { Task } from '@/types';
import TaskCard from './TaskCard';
import { cn, getMonthDays } from '@/lib/utils';
import {
  format,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfMonth,
  parseISO,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface CalendarViewProps {
  onEditTask: (task: Task) => void;
  onAddTask: (date: string) => void;
}

export default function CalendarView({ onEditTask, onAddTask }: CalendarViewProps) {
  const { tasks, getFilteredTasks } = useTaskStore();
  const filteredTasks = getFilteredTasks();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthDays = useMemo(() => getMonthDays(
    currentDate.getFullYear(),
    currentDate.getMonth()
  ), [currentDate]);

  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  const getTasksForDate = (date: Date): Task[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredTasks.filter((task) => task.dueDate === dateStr);
  };

  const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Calendar Grid */}
      <div className="flex-1">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">
              {format(currentDate, 'MMMM yyyy', { locale: it })}
            </h2>
            <button
              onClick={goToToday}
              className="btn-secondary text-sm"
            >
              Oggi
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToPrevMonth} className="btn-icon">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={goToNextMonth} className="btn-icon">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-slate-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day, index) => {
            const dayTasks = getTasksForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const hasImportant = dayTasks.some((t) => t.important && !t.completed);
            const hasOverdue = dayTasks.some((t) => !t.completed && t.dueDate && parseISO(t.dueDate) < new Date());

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'calendar-cell rounded-lg transition-all duration-150 text-left',
                  !isCurrentMonth && 'opacity-40',
                  isSelected && 'calendar-cell-selected',
                  isTodayDate && !isSelected && 'calendar-cell-today',
                  'hover:bg-slate-800/50'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium',
                      isTodayDate && 'bg-blue-600 text-white',
                      !isTodayDate && isCurrentMonth && 'text-slate-300',
                      !isTodayDate && !isCurrentMonth && 'text-slate-600'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-xs text-slate-500">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Task indicators */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded truncate',
                        task.completed
                          ? 'bg-slate-700/50 text-slate-500 line-through'
                          : task.important
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      )}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-slate-500 pl-1.5">
                      +{dayTasks.length - 3} altri
                    </div>
                  )}
                </div>

                {/* Indicators */}
                <div className="flex gap-1 mt-1">
                  {hasImportant && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                  {hasOverdue && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Panel */}
      <div className="lg:w-80 glass-card p-4">
        {selectedDate ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {format(selectedDate, 'EEEE', { locale: it })}
                </h3>
                <p className="text-sm text-slate-400">
                  {format(selectedDate, 'd MMMM yyyy', { locale: it })}
                </p>
              </div>
              <button
                onClick={() => onAddTask(format(selectedDate, 'yyyy-MM-dd'))}
                className="btn-primary p-2"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {selectedDateTasks.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {selectedDateTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEditTask}
                    compact
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm mb-3">
                  Nessun task per questo giorno
                </p>
                <button
                  onClick={() => onAddTask(format(selectedDate, 'yyyy-MM-dd'))}
                  className="btn-secondary text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Aggiungi Task
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">
              Seleziona un giorno per vedere i task
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
