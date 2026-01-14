import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TaskFlow - Gestione Task Intelligente',
  description: 'Organizza i tuoi task con vista lista, calendario e kanban. Sincronizzazione con Google Calendar.',
  keywords: ['task manager', 'todo', 'kanban', 'calendario', 'produttività'],
  authors: [{ name: 'TaskFlow' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
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
        {children}
      </body>
    </html>
  );
}
