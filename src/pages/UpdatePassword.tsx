import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { Lock, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

type PageState = 'loading' | 'ready' | 'expired' | 'success';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const showToast = useStore((state) => state.showToast);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // 1. Check for expired / error tokens in the URL hash FIRST.
    // Email scanners pre-fetch links, which consumes the one-time OTP token.
    // Supabase appends #error=... to the redirect URL in that case.
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', '?'));
    const errorCode = params.get('error_code') || params.get('error');
    const errorDesc = params.get('error_description') || '';

    if (errorCode === 'otp_expired' || errorDesc.includes('expired')) {
      setPageState('expired');
      return;
    }

    // 2. Listen for PASSWORD_RECOVERY event — this is the correct PKCE-safe
    //    way to detect when the user has clicked the reset link from their email.
    //    Supabase automatically exchanges the token from the hash and fires this event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        // Token exchanged successfully — show the form
        setPageState('ready');
      } else if (event === 'SIGNED_IN' && session) {
        // Fallback: user already has a valid session (e.g., came back after link click)
        setPageState('ready');
      }
    });

    // 3. Also check if a valid session already exists (e.g., user refreshes the page
    //    after the token was already exchanged).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setPageState('ready');
      } else if (hash.includes('access_token')) {
        // Token is in the hash but session not yet resolved — onAuthStateChange will handle it
        // Keep loading state for a moment
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
            if (retrySession) {
              setPageState('ready');
            } else {
              setPageState('expired');
            }
          });
        }, 1500);
      } else {
        // No session, no token in hash — link is invalid or already used
        setPageState('expired');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        showToast(error.message, 'error');
      } else {
        setPageState('success');
        showToast('Password updated successfully!', 'success');
        setTimeout(() => {
          navigate('/account', { replace: true });
        }, 2500);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-20 select-none animate-fade-in-up">
      <div className="max-w-md w-full bg-white/60 border border-brand-border/45 rounded-3xl p-8 shadow-xs backdrop-blur-xs">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-brand-heading mb-2">Set New Password</h1>
          <p className="text-xs text-brand-body/65 font-sans uppercase tracking-wider">
            Enter your new secure password below
          </p>
          <div className="h-0.5 w-10 bg-[#C9A84C] mt-3 mx-auto"></div>
        </div>

        {/* Loading state */}
        {pageState === 'loading' && (
          <div className="text-center py-8 space-y-3 animate-fade-in">
            <div className="w-8 h-8 border-2 border-brand-border/40 border-t-brand-accent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-brand-body/60 font-sans">Verifying your reset link...</p>
          </div>
        )}

        {/* Link expired / invalid state */}
        {pageState === 'expired' && (
          <div className="text-center space-y-5 py-4 animate-fade-in">
            <div className="bg-red-50 text-red-700 p-5 rounded-2xl border border-red-200 flex flex-col items-center gap-3">
              <AlertCircle size={28} className="text-red-500 shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-sm">This link has expired.</p>
                <p className="text-xs text-red-600/80 leading-relaxed">
                  Password reset links expire after a short time for security. Please request a fresh link.
                </p>
              </div>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-brand-accent hover:text-brand-heading transition-colors uppercase tracking-wider"
            >
              <RefreshCw size={12} />
              Request a New Reset Link
            </Link>
          </div>
        )}

        {/* Success state */}
        {pageState === 'success' && (
          <div className="text-center space-y-4 py-4 animate-fade-in">
            <div className="bg-green-50 text-green-700 p-4 rounded-2xl border border-green-200 text-xs flex flex-col items-center gap-2">
              <CheckCircle2 size={24} className="text-green-600" />
              <span>Password updated successfully! Redirecting to your account...</span>
            </div>
            <Link
              to="/account"
              className="inline-block mt-2 text-xs font-bold text-brand-heading hover:underline uppercase tracking-wider"
            >
              Go to Account &rarr;
            </Link>
          </div>
        )}

        {/* Form — only shown when session is confirmed valid */}
        {pageState === 'ready' && (
          <form onSubmit={handleUpdatePassword} className="space-y-5 animate-fade-in">
            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 mb-2">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-body/40 pointer-events-none">
                  <Lock size={16} strokeWidth={1.5} />
                </span>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full h-11 pl-10 pr-10 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-body/40 hover:text-brand-heading transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showNewPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-body/40 pointer-events-none">
                  <Lock size={16} strokeWidth={1.5} />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-body/40 hover:text-brand-heading transition-colors cursor-pointer"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold transition duration-300 shadow-sm flex items-center justify-center gap-2 select-none ${
                loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : 'Finalize New Password'}
            </button>
          </form>
        )}

        {/* Secured Badge */}
        <div className="mt-8 flex items-center justify-center gap-1.5 text-[9px] text-brand-body/45 select-none uppercase tracking-widest font-bold">
          <ShieldCheck size={12} className="text-[#8FA088]" />
          <span>Supabase Auth Secured</span>
        </div>

      </div>
    </div>
  );
}
