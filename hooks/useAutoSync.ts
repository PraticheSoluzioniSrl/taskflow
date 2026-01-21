import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTaskStore } from '@/lib/store';

export function useAutoSync() {
    const { data: session, status } = useSession();
    const { setCurrentUserId, loadUserData, currentUserId } = useTaskStore();

  useEffect(() => {
        if (status === 'authenticated' && session?.user?.email) {
                if (currentUserId !== session.user.email) {
                          setCurrentUserId(session.user.email);
                }
        } else if (status === 'unauthenticated') {
                setCurrentUserId(null);
        }
  }, [status, session, currentUserId, setCurrentUserId]);

  useEffect(() => {
        if (status === 'authenticated' && currentUserId) {
                const interval = setInterval(() => {
                          loadUserData();
                }, 30000);

          return () => clearInterval(interval);
        }
  }, [status, currentUserId, loadUserData]);
}
