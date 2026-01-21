import type { Metadata, Viewport } from 'next';
import './globals.css';
import AuthProvider from '@/components/AuthProvider';
import { SyncProvider } from '@/components/SyncProvider';

export const metadata: Metadata = {
  title: 'TaskFlow - Gestione Task Intelligente',
  description: 'Organizza i tuoi task con vista lista, calendario e kanban. Sincronizzazione con Google Calendar.',
  keywords: ['task manager', 'todo', 'kanban', 'calendario', 'produttività'],
  authors: [{ name: 'TaskFlow' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0f1c',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="dark">
      <body className="antialiased">
        <AuthProvider>
          <SyncProvider>
            {children}
          </SyncProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
