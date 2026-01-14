import { getServerSession } from 'next-auth';
import { authOptions } from './authOptions';

// Helper per ottenere la sessione nelle API routes
export async function getAuthSession() {
  return await getServerSession(authOptions);
}
