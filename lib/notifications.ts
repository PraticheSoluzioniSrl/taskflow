'use client';

// Richiedi permessi per le notifiche del browser
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
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

// Mostra una notifica
export function showNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  new Notification(title, {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    ...options,
  });
}

// Controlla i task in scadenza e mostra notifiche
export function checkDueTasks(tasks: Array<{ title: string; dueDate?: string; dueTime?: string; completed: boolean }>) {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 ora da ora

  tasks.forEach((task) => {
    if (task.completed || !task.dueDate) return;

    const dueDate = new Date(task.dueDate);
    if (task.dueTime) {
      const [hours, minutes] = task.dueTime.split(':');
      dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      dueDate.setHours(23, 59, 59, 999); // Fine giornata se non c'è ora
    }

    // Notifica se il task è in scadenza entro 1 ora
    if (dueDate <= oneHourFromNow && dueDate >= now) {
      const minutesUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60));
      let message = '';
      
      if (minutesUntilDue <= 0) {
        message = 'Il task è in scadenza ora!';
      } else if (minutesUntilDue < 60) {
        message = `Il task scade tra ${minutesUntilDue} minuti`;
      } else {
        const hours = Math.floor(minutesUntilDue / 60);
        message = `Il task scade tra ${hours} ${hours === 1 ? 'ora' : 'ore'}`;
      }

      showNotification(`Task in scadenza: ${task.title}`, {
        body: message,
        tag: `task-${task.dueDate}`, // Evita notifiche duplicate
        requireInteraction: true,
      });
    }
  });
}

// Inizializza il sistema di notifiche
export async function initNotifications() {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.log('Notification permission denied');
    return;
  }

  // Controlla i task ogni minuto
  setInterval(() => {
    // Questa funzione verrà chiamata dal componente che ha accesso ai task
  }, 60000);
}
