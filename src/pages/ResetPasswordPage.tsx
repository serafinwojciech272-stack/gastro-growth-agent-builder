import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { configured, loading: authLoading, user, updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) setError("Your password reset session is missing or expired. Request a new reset link.");
  }, [authLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!configured) { setError("Authentication is not configured."); return; }
    if (!user) { setError("Your reset session is missing or expired. Request a new reset link."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters long."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);
    if (updateError) setError(updateError.message || "Failed to update password.");
    else { setSuccess(true); setTimeout(() => navigate("/login", { replace: true }), 1500); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
      <div className="w-full max-w-md space-y-6 bg-slate-900/50 border border-slate-800 rounded-xl p-8 shadow-xl">
        <div className="text-center"><h1 className="text-3xl font-bold tracking-tight">GGA</h1><p className="mt-2 text-sm text-slate-400">Restaurant Growth OS</p><h2 className="mt-6 text-xl font-semibold">Reset Password</h2></div>
        {error && <div role="alert" className="flex items-center gap-2 bg-red-500/10 text-red-400 text-sm p-3 rounded-lg border border-red-500/20"><AlertCircle size={16} /><span>{error}</span></div>}
        {success && <div role="status" className="flex items-center gap-2 bg-green-500/10 text-green-400 text-sm p-3 rounded-lg border border-green-500/20"><CheckCircle size={16} /><span>Password updated successfully. Redirecting to login...</span></div>}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div><label htmlFor="password" className="sr-only">New Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" required minLength={8} autoComplete="new-password" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
          <div><label htmlFor="confirm-password" className="sr-only">Confirm Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input id="confirm-password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required minLength={8} autoComplete="new-password" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent" /></div></div>
          <button type="submit" disabled={loading || authLoading || success || !configured || !user} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{loading ? "Updating..." : "Update Password"}</button>
        </form>
      </div>
    </div>
  );
}