// File: hooks/useAutoSync.ts
// Hook per sincronizzare automaticamente i dati al login

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTaskStore } from '@/lib/store';

export function useAutoSync() {
  const { data: session, status } = useSession();
  const { setCurrentUserId, loadUserData, currentUserId } = useTaskStore();
  
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      // Imposta l'utente corrente
      if (currentUserId !== session.user.email) {
        setCurrentUserId(session.user.email);
      }
    } else if (status === 'unauthenticated') {
      // Pulisci i dati quando l'utente fa logout
      setCurrentUserId(null);
    }
  }, [status, session, currentUserId, setCurrentUserId]);
  
  // Sincronizza periodicamente ogni 30 secondi se l'utente è loggato
  useEffect(() => {
    if (status === 'authenticated' && currentUserId) {
      const interval = setInterval(() => {
        loadUserData();
      }, 30000); // 30 secondi
      
      return () => clearInterval(interval);
    }
  }, [status, currentUserId, loadUserData]);
}
