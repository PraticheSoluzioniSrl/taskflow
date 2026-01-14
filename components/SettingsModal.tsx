'use client';

import { useState, useEffect } from 'react';
import { X, Bell, Calendar, Volume2, Trash2 } from 'lucide-react';
import { useTaskStore } from '@/lib/store';
import { notificationService } from '@/lib/notifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useTaskStore();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    settings?.notifications ?? true
  );
  const [soundEnabled, setSoundEnabled] = useState(
    settings?.sound ?? true
  );
  const [calendarSync, setCalendarSync] = useState(
    settings?.calendarSync ?? false
  );
  const [reminderMinutes, setReminderMinutes] = useState(
    settings?.reminderMinutes ?? 15
  );

  // Aggiorna stato quando cambiano le impostazioni
  useEffect(() => {
    if (settings) {
      setNotificationsEnabled(settings.notifications ?? true);
      setSoundEnabled(settings.sound ?? true);
      setCalendarSync(settings.calendarSync ?? false);
      setReminderMinutes(settings.reminderMinutes ?? 15);
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = async () => {
    // Richiedi permessi notifiche se necessario
    if (notificationsEnabled && Notification.permission === 'default') {
      const permission = await notificationService.requestPermission();
      if (!permission) {
        alert('Le notifiche sono state bloccate dal browser. Abilita le notifiche dalle impostazioni del browser.');
        setNotificationsEnabled(false);
      }
    }

    // Salva impostazioni
    updateSettings({
      notifications: notificationsEnabled,
      sound: soundEnabled,
      calendarSync,
      reminderMinutes,
    });

    // Mostra notifica di test se abilitata
    if (notificationsEnabled) {
      notificationService.showNotification(
        '✅ Impostazioni salvate',
        {
          body: 'Le notifiche sono attive',
          sound: soundEnabled,
        }
      );
    }

    onClose();
  };

  const handleClearData = () => {
    if (confirm('Sei sicuro di voler eliminare tutti i task e i dati locali? Questa azione non può essere annullata.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-navy-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-navy-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Impostazioni</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-navy-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Opzioni */}
        <div className="space-y-6">
          {/* Notifiche */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-blue-400 mt-1" />
              <div>
                <h3 className="font-medium text-white">Notifiche Push</h3>
                <p className="text-sm text-gray-400">
                  Ricevi notifiche per task in scadenza
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-navy-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {/* Suoni */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Volume2 className="w-5 h-5 text-purple-400 mt-1" />
              <div>
                <h3 className="font-medium text-white">Suoni</h3>
                <p className="text-sm text-gray-400">
                  Riproduci suono con le notifiche
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-navy-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>

          {/* Sync Google Calendar */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-green-400 mt-1" />
              <div>
                <h3 className="font-medium text-white">Sincronizza Google Calendar</h3>
                <p className="text-sm text-gray-400">
                  I task vengono aggiunti al calendario
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={calendarSync}
                onChange={(e) => setCalendarSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-navy-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>

          {/* Promemoria anticipato */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Bell className="w-5 h-5 text-yellow-400" />
              <h3 className="font-medium text-white">Promemoria Anticipato</h3>
            </div>
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(Number(e.target.value))}
              className="w-full bg-navy-700 text-white rounded-lg px-4 py-2 border border-navy-600 focus:border-blue-500 focus:outline-none"
            >
              <option value={5}>5 minuti prima</option>
              <option value={10}>10 minuti prima</option>
              <option value={15}>15 minuti prima</option>
              <option value={30}>30 minuti prima</option>
              <option value={60}>1 ora prima</option>
              <option value={120}>2 ore prima</option>
              <option value={1440}>1 giorno prima</option>
            </select>
          </div>

          {/* Zona pericolosa */}
          <div className="pt-4 border-t border-navy-700">
            <button
              onClick={handleClearData}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Elimina tutti i dati locali</span>
            </button>
          </div>
        </div>

        {/* Pulsanti */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-navy-700 text-white rounded-lg hover:bg-navy-600 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Salva
          </button>
        </div>

        {/* Info permessi */}
        {Notification.permission === 'denied' && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400">
              ⚠️ Le notifiche sono bloccate. Abilita le notifiche dalle impostazioni del browser.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
