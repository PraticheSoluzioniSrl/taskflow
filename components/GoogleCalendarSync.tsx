'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Calendar, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GoogleCalendarSync() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-slate-500">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Caricamento...</span>
      </div>
    );
  }

  if (session) {
    return (
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {session.user?.email}
            </p>
            <p className="text-xs text-green-400">Google Calendar connesso</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Disconnetti
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Google Calendar</p>
          <p className="text-xs text-slate-500">Sincronizza i tuoi task</p>
        </div>
      </div>
      <button
        onClick={() => signIn('google')}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium transition-colors"
      >
        <LogIn className="w-4 h-4" />
        Connetti Google Calendar
      </button>
    </div>
  );
}
