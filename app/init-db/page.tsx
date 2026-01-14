'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function InitDbPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInit = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/init-db', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message || 'Database initialized successfully!' });
      } else {
        setResult({ success: false, message: data.error || 'Failed to initialize database' });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Inizializza Database</h1>
            <p className="text-sm text-slate-400">
              Crea le tabelle necessarie per TaskFlow
            </p>
          </div>

          {session?.user && (
            <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-300 mb-1">
                <span className="text-slate-500">Utente:</span> {session.user.email}
              </p>
              <p className="text-xs text-slate-400">
                Le tabelle verranno create per questo account
              </p>
            </div>
          )}

          {result && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                result.success
                  ? 'bg-green-500/20 border border-green-500/50'
                  : 'bg-red-500/20 border border-red-500/50'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    result.success ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {result.success ? 'Successo!' : 'Errore'}
                </p>
                <p className="text-xs text-slate-300 mt-1">{result.message}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleInit}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Inizializzazione...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Inizializza Database</span>
              </>
            )}
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full mt-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-all duration-200"
          >
            Torna alla Home
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Questa operazione è sicura e può essere eseguita più volte.
              <br />
              Le tabelle vengono create solo se non esistono già.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
