'use client';

import { useTaskStore } from '@/lib/store';
import { useSession } from 'next-auth/react';
import {
  Menu,
  Search,
  LayoutList,
  Calendar,
  Kanban,
  Plus,
  Bell,
  User,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types';
import { formatRelativeDate, isOverdue } from '@/lib/utils';

interface HeaderProps {
  onAddTask: () => void;
}

export default function Header({ onAddTask }: HeaderProps) {
  const {
    viewMode,
    setViewMode,
    filters,
    setFilters,
    toggleSidebar,
    sidebarOpen,
  } = useTaskStore();
  const { data: session } = useSession();
  const { tasks } = useTaskStore();

  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Chiudi il dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  // Calcola le notifiche: task in ritardo e task con promemoria prossimi
  const notifications = (() => {
    const now = new Date();
    const notificationsList: Array<{ type: 'overdue' | 'reminder' | 'upcoming'; task: Task; message: string }> = [];

    tasks.forEach((task) => {
      // Task in ritardo
      if (task.dueDate && !task.completed && isOverdue(task.dueDate)) {
        notificationsList.push({
          type: 'overdue',
          task,
          message: `Task in ritardo: ${task.title}`,
        });
      }

      // Promemoria prossimi (nelle prossime 24 ore)
      if (task.reminder && !task.completed) {
        const reminderDate = new Date(task.reminder);
        const hoursUntilReminder = (reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilReminder > 0 && hoursUntilReminder <= 24) {
          notificationsList.push({
            type: 'reminder',
            task,
            message: `Promemoria: ${task.title}`,
          });
        }
      }

      // Task in scadenza oggi
      if (task.dueDate && !task.completed) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dueDate.getTime() === today.getTime()) {
          notificationsList.push({
            type: 'upcoming',
            task,
            message: `Scade oggi: ${task.title}`,
          });
        }
      }
    });

    return notificationsList.sort((a, b) => {
      // Prima i task in ritardo, poi i promemoria, poi quelli in scadenza
      if (a.type === 'overdue' && b.type !== 'overdue') return -1;
      if (a.type !== 'overdue' && b.type === 'overdue') return 1;
      return 0;
    });
  })();

  const unreadCount = notifications.length;

  const viewOptions = [
    { id: 'list', icon: LayoutList, label: 'Lista' },
    { id: 'calendar', icon: Calendar, label: 'Calendario' },
    { id: 'kanban', icon: Kanban, label: 'Kanban' },
  ] as const;

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="btn-icon lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div
            className={cn(
              'relative flex items-center transition-all duration-200',
              searchFocused ? 'w-64 sm:w-80' : 'w-40 sm:w-64'
            )}
          >
            <Search className="absolute left-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cerca task..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ searchQuery: e.target.value })}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="input-base pl-10 pr-10"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters({ searchQuery: '' })}
                className="absolute right-3 p-1 hover:bg-slate-700 rounded"
              >
                <X className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Center - View Toggle */}
        <div className="hidden md:flex items-center gap-1 p-1 bg-slate-900/60 rounded-lg border border-slate-800/50">
          {viewOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => setViewMode(option.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200',
                  viewMode === option.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <button onClick={onAddTask} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuovo Task</span>
          </button>

          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="btn-icon relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card p-0 shadow-2xl z-50 max-h-96 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-800/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Notifiche</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                        {unreadCount} nuove
                      </span>
                    )}
                  </div>
                </div>
                <div className="overflow-y-auto flex-1">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">Nessuna notifica</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/50">
                      {notifications.map((notification, index) => (
                        <div
                          key={`${notification.task.id}-${index}`}
                          className={cn(
                            'p-4 hover:bg-slate-800/50 transition-colors cursor-pointer',
                            notification.type === 'overdue' && 'bg-red-500/5'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'mt-0.5 p-2 rounded-lg',
                              notification.type === 'overdue' && 'bg-red-500/20',
                              notification.type === 'reminder' && 'bg-blue-500/20',
                              notification.type === 'upcoming' && 'bg-amber-500/20'
                            )}>
                              {notification.type === 'overdue' && (
                                <AlertCircle className="w-4 h-4 text-red-400" />
                              )}
                              {notification.type === 'reminder' && (
                                <Bell className="w-4 h-4 text-blue-400" />
                              )}
                              {notification.type === 'upcoming' && (
                                <Clock className="w-4 h-4 text-amber-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white mb-1">
                                {notification.message}
                              </p>
                              {notification.task.dueDate && (
                                <p className="text-xs text-slate-400">
                                  {formatRelativeDate(notification.task.dueDate)}
                                  {notification.task.dueTime && ` alle ${notification.task.dueTime}`}
                                </p>
                              )}
                              {notification.task.reminder && notification.type === 'reminder' && (
                                <p className="text-xs text-slate-400">
                                  Promemoria: {new Date(notification.task.reminder).toLocaleString('it-IT')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="btn-icon">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
          {session?.user?.name && (
            <span className="hidden sm:inline text-sm text-slate-300">
              {session.user.name}
            </span>
          )}
        </div>
      </div>

      {/* Mobile View Toggle */}
      <div className="md:hidden flex items-center gap-1 px-4 pb-3">
        {viewOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => setViewMode(option.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
                viewMode === option.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900/60 text-slate-400'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{option.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
