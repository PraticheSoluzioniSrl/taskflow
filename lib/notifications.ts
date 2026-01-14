/**
 * Sistema di Notifiche Push per TaskFlow
 * 
 * Gestisce:
 * - Richiesta permessi browser
 * - Notifiche per task in scadenza
 * - Suoni di notifica
 * - Controllo periodico dei task
 */

export class NotificationService {
  private static instance: NotificationService;
  private checkInterval: NodeJS.Timeout | null = null;
  private notifiedTasks: Set<string> = new Set();

  private constructor() {
    // Carica task già notificati da localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('notified_tasks');
      if (stored) {
        try {
          this.notifiedTasks = new Set(JSON.parse(stored));
        } catch (e) {
          console.error('Error loading notified tasks:', e);
        }
      }
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Richiedi permessi per le notifiche
   */
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('Browser non supporta notifiche');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Mostra una notifica
   */
  async showNotification(
    title: string, 
    options?: NotificationOptions & { sound?: boolean }
  ): Promise<Notification | null> {
    if (typeof window === 'undefined') return null;

    if (Notification.permission !== 'granted') {
      await this.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        ...options,
      });

      // Suono (se abilitato)
      if (options?.sound !== false) {
        this.playSound();
      }

      // Chiudi dopo 5 secondi
      setTimeout(() => notification.close(), 5000);

      return notification;
    }

    return null;
  }

  /**
   * Riproduci suono notifica
   */
  playSound() {
    if (typeof window === 'undefined') return;

    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Cannot play sound:', e));
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  }

  /**
   * Avvia controllo periodico dei task
   */
  startTaskChecker(
    getTasks: () => any[],
    reminderMinutes: number = 15
  ) {
    // Pulisci interval esistente
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Controlla ogni minuto
    this.checkInterval = setInterval(() => {
      this.checkDueTasks(getTasks(), reminderMinutes);
    }, 60000); // 60 secondi

    // Controlla subito
    this.checkDueTasks(getTasks(), reminderMinutes);
  }

  /**
   * Ferma controllo periodico
   */
  stopTaskChecker() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Controlla task in scadenza
   */
  private checkDueTasks(tasks: any[], reminderMinutes: number) {
    if (typeof window === 'undefined') return;

    const now = new Date();

    tasks.forEach(task => {
      // Salta task completati o senza data
      if (task.completed || !task.dueDate) return;

      const dueDate = new Date(task.dueDate);
      const timeUntilDue = dueDate.getTime() - now.getTime();
      const minutesUntilDue = Math.floor(timeUntilDue / 60000);

      // Notifica se manca il tempo impostato
      if (minutesUntilDue > 0 && minutesUntilDue <= reminderMinutes) {
        const notificationKey = `${task.id}_${reminderMinutes}`;
        
        if (!this.notifiedTasks.has(notificationKey)) {
          this.showNotification(
            `📋 Task in scadenza: ${task.title}`,
            {
              body: `Scade tra ${minutesUntilDue} ${minutesUntilDue === 1 ? 'minuto' : 'minuti'}`,
              tag: task.id,
              requireInteraction: false,
            }
          );
          
          // Segna come notificato
          this.notifiedTasks.add(notificationKey);
          this.saveNotifiedTasks();
          
          // Rimuovi flag dopo la scadenza
          setTimeout(() => {
            this.notifiedTasks.delete(notificationKey);
            this.saveNotifiedTasks();
          }, timeUntilDue + 60000);
        }
      }

      // Notifica se è scaduto da poco
      if (timeUntilDue < 0 && timeUntilDue > -300000) { // Ultimi 5 minuti
        const overdueKey = `${task.id}_overdue`;
        
        if (!this.notifiedTasks.has(overdueKey)) {
          this.showNotification(
            `⚠️ Task scaduto: ${task.title}`,
            {
              body: 'Questo task è in ritardo!',
              tag: task.id,
              requireInteraction: true,
            }
          );
          
          this.notifiedTasks.add(overdueKey);
          this.saveNotifiedTasks();
        }
      }
    });
  }

  /**
   * Salva task notificati su localStorage
   */
  private saveNotifiedTasks() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'notified_tasks', 
          JSON.stringify(Array.from(this.notifiedTasks))
        );
      } catch (e) {
        console.error('Error saving notified tasks:', e);
      }
    }
  }

  /**
   * Pulisci task notificati (per testing)
   */
  clearNotified() {
    this.notifiedTasks.clear();
    this.saveNotifiedTasks();
  }
}

// Export singleton
export const notificationService = NotificationService.getInstance();
