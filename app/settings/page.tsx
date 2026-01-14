'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Calendar,
  Bell,
  Moon,
  Sun,
  Download,
  Trash2,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [calendarSync, setCalendarSync] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleExportData = async () => {
    // TODO: Implementare export dati
    alert('Funzionalità di export in arrivo');
  };

  const handleDeleteAllTasks = async () => {
    if (confirm('Sei sicuro di voler eliminare tutti i task? Questa azione non può essere annullata.')) {
      // TODO: Implementare eliminazione task
      alert('Funzionalità di eliminazione in arrivo');
    }
  };

  const handleDisconnectGoogle = async () => {
    if (confirm('Vuoi disconnettere il tuo account Google?')) {
      await signOut({ callbackUrl: '/login' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Torna indietro</span>
          </button>
          <h1 className="text-3xl font-bold text-white">Impostazioni</h1>
          <p className="text-slate-400 mt-2">Gestisci le tue preferenze e il tuo account</p>
        </div>

        {/* Account Section */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Account</h2>
              <p className="text-sm text-slate-400">Informazioni del tuo account</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400">Email</label>
              <p className="text-white mt-1">{session?.user?.email}</p>
            </div>
            {session?.user?.name && (
              <div>
                <label className="text-sm text-slate-400">Nome</label>
                <p className="text-white mt-1">{session.user.name}</p>
              </div>
            )}
            {session?.user?.image && (
              <div>
                <label className="text-sm text-slate-400">Immagine profilo</label>
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-16 h-16 rounded-full mt-2"
                />
              </div>
            )}
          </div>
        </div>

        {/* Calendar Sync Section */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Sincronizzazione Calendar</h2>
              <p className="text-sm text-slate-400">Gestisci la sincronizzazione con Google Calendar</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Sincronizza con Google Calendar</p>
              <p className="text-sm text-slate-400 mt-1">
                I task con data verranno sincronizzati automaticamente
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={calendarSync}
                onChange={(e) => setCalendarSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-600/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Notifiche</h2>
              <p className="text-sm text-slate-400">Gestisci le notifiche e i promemoria</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Abilita notifiche</p>
              <p className="text-sm text-slate-400 mt-1">
                Ricevi notifiche per i promemoria dei task
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Theme Section */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-purple-400" />
              ) : (
                <Sun className="w-5 h-5 text-purple-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Tema</h2>
              <p className="text-sm text-slate-400">Scegli il tema dell'applicazione</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                'flex-1 px-4 py-3 rounded-lg border transition-all',
                theme === 'dark'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
              )}
            >
              <Moon className="w-5 h-5 mx-auto mb-2" />
              <span className="text-sm font-medium">Scuro</span>
            </button>
            <button
              onClick={() => setTheme('light')}
              className={cn(
                'flex-1 px-4 py-3 rounded-lg border transition-all',
                theme === 'light'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
              )}
            >
              <Sun className="w-5 h-5 mx-auto mb-2" />
              <span className="text-sm font-medium">Chiaro</span>
            </button>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-cyan-600/20 flex items-center justify-center">
              <Download className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Gestione Dati</h2>
              <p className="text-sm text-slate-400">Esporta o elimina i tuoi dati</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Esporta tutti i dati</span>
            </button>
            <button
              onClick={handleDeleteAllTasks}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 rounded-lg text-red-400 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              <span>Elimina tutti i task</span>
            </button>
          </div>
        </div>

        {/* Disconnect Section */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Disconnetti</h2>
              <p className="text-sm text-slate-400">Disconnetti il tuo account Google</p>
            </div>
          </div>

          <button
            onClick={handleDisconnectGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Disconnetti account Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
