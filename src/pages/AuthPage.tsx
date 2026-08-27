import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Mail, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const { configured, loading: authLoading, signIn, signUp , resetPasswordForEmail } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialMode = params.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);

    const result = mode === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);

    setBusy(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (mode === 'signup') {
      setMessage('Account created. Check your email if email confirmation is enabled.');
      return;
    }

    navigate('/app/dashboard', { replace: true });
  }

  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    const { error } = await resetPasswordForEmail(email);
    setResetLoading(false);
    if (error) setResetError(error.message);
    else setResetEmailSent(true);
  };
  return (
    <main className="min-h-screen bg-[#080809] text-[#f5f5f5] flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-white mb-10">
          <UtensilsCrossed size={17} /> Gastro Growth Advisor
        </Link>

        <section className="rounded-2xl border border-[#27272a] bg-[#111113] p-7 shadow-2xl">
          <div className="mb-7">
            <p className="text-xs uppercase tracking-[0.18em] text-[#a78bfa] mb-3">Restaurant Growth OS</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {mode === 'login' ? 'Welcome back.' : 'Create your GGA account.'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
              {mode === 'login'
                ? 'Access your restaurant intelligence workspace.'
                : 'Start building your restaurant intelligence workspace.'}
            </p>
          </div>

          {!configured && (
            <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm leading-5 text-amber-200">
              Authentication is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the environment before using account creation or login.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-[#d4d4d8]">Email</span>
              <span className="relative block">
                <Mail size={16} className="absolute left-3 top-3.5 text-[#71717a]" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" className="w-full rounded-lg border border-[#27272a] bg-[#09090b] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#a78bfa]" placeholder="you@restaurant.com" />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium text-[#d4d4d8]">Password</span>
              <span className="relative block">
                <LockKeyhole size={16} className="absolute left-3 top-3.5 text-[#71717a]" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="w-full rounded-lg border border-[#27272a] bg-[#09090b] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#a78bfa]" placeholder="Minimum 8 characters" />
              </span>
            </label>

            {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
            {message && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p>}

            <button disabled={busy || authLoading || !configured} className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[#f5f5f5] px-4 py-3 text-sm font-semibold text-[#09090b] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? 'Processing...' : mode === 'login' ? 'Sign in' : 'Create account'}
              {!busy && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
            </button>
          
        {isForgotMode && (
          <div className="mt-4 space-y-4">
            <h2 className="text-xl font-semibold text-white">Reset Password</h2>
            {resetEmailSent ? (
              <p className="text-green-400 text-sm">Check your email for the reset link.</p>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Email" 
                  required 
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600" 
                />
                {resetError && <p className="text-red-400 text-sm">{resetError}</p>}
                <button 
                  type="submit" 
                  disabled={resetLoading} 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg py-2.5"
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setIsForgotMode(false); setResetEmailSent(false); setResetError(null); }} 
                  className="w-full text-sm text-slate-400 hover:text-white"
                >
                  Back to Login
                </button>
              </form>
            )}
          </div>
        )}
        {!isForgotMode && (
          <div className="text-right mt-2">
            <button 
              type="button" 
              onClick={() => setIsForgotMode(true)} 
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              Forgot password?
            </button>
          </div>
        )}
</form>

          <div className="mt-6 text-center text-sm text-[#71717a]">
            {mode === 'login' ? 'New to GGA?' : 'Already have an account?'}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }} className="font-medium text-[#c4b5fd] hover:text-white">
              {mode === 'login' ? 'Create account' : 'Sign in'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
