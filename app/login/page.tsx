'use client';

import { signIn } from 'next-auth/react';
import { CheckCircle2 } from 'lucide-react';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo e Titolo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">TaskFlow</h1>
          <p className="text-slate-400">Gestione Task Intelligente</p>
        </div>

        {/* Card di Login */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">
              Benvenuto in TaskFlow
            </h2>
            <p className="text-sm text-slate-400">
              Accedi con il tuo account Google per iniziare a organizzare i tuoi task
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Accedi con Google</span>
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Continuando, accetti i nostri Termini di Servizio e la Privacy Policy
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="text-slate-400">
            <div className="text-2xl mb-1">📋</div>
            <p className="text-xs">Task Management</p>
          </div>
          <div className="text-slate-400">
            <div className="text-2xl mb-1">📅</div>
            <p className="text-xs">Google Calendar</p>
          </div>
          <div className="text-slate-400">
            <div className="text-2xl mb-1">🎯</div>
            <p className="text-xs">Produttività</p>
          </div>
        </div>
      </div>
    </div>
  );
}
