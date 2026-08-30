import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Mail, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { configured, loading: authLoading, signIn, signUp, resetPasswordForEmail } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [forgotMode, setForgotMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function clearFeedback() { setError(''); setMessage(''); setResetSent(false); }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); clearFeedback();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) { setError('Enter your email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters long.'); return; }
    if (mode === 'signup' && password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true);
    const result = mode === 'login' ? await signIn(normalizedEmail, password) : await signUp(normalizedEmail, password);
    setBusy(false);
    if (result.error) { setError(result.error.message); return; }
    if (mode === 'signup') { setMessage('Account created. If email confirmation is enabled, check your inbox.'); setPassword(''); setConfirmPassword(''); return; }
    navigate('/app/dashboard', { replace: true });
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); clearFeedback();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) { setError('Enter your email address.'); return; }
    setBusy(true);
    const result = await resetPasswordForEmail(normalizedEmail);
    setBusy(false);
    if (result.error) { setError(result.error.message); return; }
    setResetSent(true); setMessage('If an account exists for this email, a reset link has been sent.');
  }

  function switchMode() { setMode(mode === 'login' ? 'signup' : 'login'); setForgotMode(false); setPassword(''); setConfirmPassword(''); clearFeedback(); }

  return (
    <main className="min-h-screen bg-[#080809] text-[#f5f5f5] flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-white mb-10"><UtensilsCrossed size={17} /> Gastro Growth Advisor</Link>
        <section className="rounded-2xl border border-[#27272a] bg-[#111113] p-7 shadow-2xl">
          <div className="mb-7"><p className="text-xs uppercase tracking-[0.18em] text-[#a78bfa] mb-3">Restaurant Growth OS</p><h1 className="text-3xl font-semibold tracking-tight">{forgotMode ? 'Reset your password.' : mode === 'login' ? 'Welcome back.' : 'Create your GGA account.'}</h1><p className="mt-2 text-sm leading-6 text-[#a1a1aa]">{forgotMode ? 'Enter your account email and we will send reset instructions.' : mode === 'login' ? 'Access your restaurant intelligence workspace.' : 'Start building your restaurant intelligence workspace.'}</p></div>
          {!configured && <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm leading-5 text-amber-200">Authentication is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before using accounts.</div>}
          {forgotMode ? (
            <form onSubmit={handleReset} className="space-y-4" noValidate>
              <label className="block"><span className="mb-2 block text-xs font-medium text-[#d4d4d8]">Email</span><span className="relative block"><Mail size={16} className="absolute left-3 top-3.5 text-[#71717a]" /><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" className="w-full rounded-lg border border-[#27272a] bg-[#09090b] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#a78bfa]" placeholder="you@restaurant.com" /></span></label>
              {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
              {message && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p>}
              <button type="submit" disabled={busy || authLoading || !configured || resetSent} className="flex w-full items-center justify-center rounded-lg bg-[#f5f5f5] px-4 py-3 text-sm font-semibold text-[#09090b] disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Sending...' : resetSent ? 'Reset link sent' : 'Send reset link'}</button>
              <button type="button" onClick={() => { setForgotMode(false); clearFeedback(); }} className="w-full text-sm text-slate-400 hover:text-white">Back to login</button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <label className="block"><span className="mb-2 block text-xs font-medium text-[#d4d4d8]">Email</span><span className="relative block"><Mail size={16} className="absolute left-3 top-3.5 text-[#71717a]" /><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" className="w-full rounded-lg border border-[#27272a] bg-[#09090b] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#a78bfa]" placeholder="you@restaurant.com" /></span></label>
              <label className="block"><span className="mb-2 block text-xs font-medium text-[#d4d4d8]">Password</span><span className="relative block"><LockKeyhole size={16} className="absolute left-3 top-3.5 text-[#71717a]" /><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="w-full rounded-lg border border-[#27272a] bg-[#09090b] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#a78bfa]" placeholder="Minimum 8 characters" /></span></label>
              {mode === 'signup' && <label className="block"><span className="mb-2 block text-xs font-medium text-[#d4d4d8]">Confirm password</span><span className="relative block"><LockKeyhole size={16} className="absolute left-3 top-3.5 text-[#71717a]" /><input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required minLength={8} autoComplete="new-password" className="w-full rounded-lg border border-[#27272a] bg-[#09090b] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#a78bfa]" placeholder="Repeat your password" /></span></label>}
              {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
              {message && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p>}
              <button type="submit" disabled={busy || authLoading || !configured} className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[#f5f5f5] px-4 py-3 text-sm font-semibold text-[#09090b] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Processing...' : mode === 'login' ? 'Sign in' : 'Create account'}{!busy && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}</button>
              {mode === 'login' && <button type="button" onClick={() => { setForgotMode(true); clearFeedback(); }} className="w-full text-right text-sm text-purple-400 hover:text-purple-300">Forgot password?</button>}
            </form>
          )}
          {!forgotMode && <div className="mt-6 text-center text-sm text-[#71717a]">{mode === 'login' ? 'New to GGA?' : 'Already have an account?'}{' '}<button type="button" onClick={switchMode} className="font-medium text-[#c4b5fd] hover:text-white">{mode === 'login' ? 'Create account' : 'Sign in'}</button></div>}
        </section>
      </div>
    </main>
  );
}
