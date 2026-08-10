import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const showToast = useStore((state) => state.showToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [isResetView, setIsResetView] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // If user is already authenticated, redirect based on role
  const ADMIN_EMAIL = 'angrybird@fuzzysoftstudio.com';
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (session.user.email === ADMIN_EMAIL) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/account', { replace: true });
        }
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Signed in successfully!', 'success');
        const { data: { session } } = await supabase.auth.getSession();
        const searchParams = new URLSearchParams(location.search);
        const locState = (location as any).state;
        const redirectTo = searchParams.get('redirectTo') || locState?.redirectTo;

        if (session?.user.email === ADMIN_EMAIL) {
          navigate('/admin', { replace: true });
        } else if (redirectTo) {
          navigate(redirectTo, { replace: true, state: locState });
        } else {
          navigate('/account', { replace: true });
        }
      }
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showToast('Please enter your email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) throw error;
      setResetSent(true);
      showToast('Password reset link sent to your email!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send password reset email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-20 select-none animate-fade-in-up">
      <div className="max-w-md w-full bg-white/60 border border-brand-border/45 rounded-3xl p-8 shadow-xs backdrop-blur-xs">
        
        {isResetView ? (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-serif text-brand-heading mb-2">Reset Password</h1>
              <p className="text-xs text-brand-body/65 font-sans uppercase tracking-wider">
                Enter your email to receive a password recovery link
              </p>
              <div className="h-0.5 w-10 bg-[#C9A84C] mt-3 mx-auto"></div>
            </div>

            {resetSent ? (
              <div className="text-center space-y-4 py-4 animate-fade-in">
                <div className="bg-green-50 text-green-700 p-4 rounded-2xl border border-green-200 text-xs leading-relaxed">
                  Password reset link sent to <strong>{resetEmail}</strong>! Please check your inbox.
                </div>
                <button
                  type="button"
                  onClick={() => { setIsResetView(false); setResetSent(false); }}
                  className="text-xs font-bold text-brand-heading hover:underline uppercase tracking-wider cursor-pointer"
                >
                  &larr; Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5 animate-fade-in">
                <div>
                  <label htmlFor="resetEmail" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-body/40 pointer-events-none">
                      <Mail size={16} strokeWidth={1.5} />
                    </span>
                    <input
                      type="email"
                      id="resetEmail"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full h-11 pl-10 pr-4 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold transition duration-300 shadow-sm flex items-center justify-center gap-2 select-none ${
                    loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {loading ? 'Sending Link...' : 'Send Password Reset Link'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetView(false)}
                    className="text-xs text-brand-body/70 hover:text-brand-heading transition-colors font-semibold cursor-pointer"
                  >
                    &larr; Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div>
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-serif text-brand-heading mb-2">Welcome Back</h1>
              <p className="text-xs text-brand-body/65 font-sans uppercase tracking-wider">
                Sign in to your luxury bloom account
              </p>
              <div className="h-0.5 w-10 bg-[#C9A84C] mt-3 mx-auto"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-body/40 pointer-events-none">
                    <Mail size={16} strokeWidth={1.5} />
                  </span>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-11 pl-10 pr-4 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setIsResetView(true); setResetEmail(email); }}
                    className="text-[11px] text-brand-accent hover:text-brand-accent-hover font-semibold transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-body/40 pointer-events-none">
                    <Lock size={16} strokeWidth={1.5} />
                  </span>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-4 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold transition duration-300 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 mt-2 select-none ${
                  loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Footer links */}
            <div className="mt-8 text-center text-xs font-sans text-brand-body/70 border-t border-brand-border/20 pt-6">
              <span>Don't have an account? </span>
              <Link to="/signup" className="text-brand-accent hover:text-brand-accent-hover font-semibold transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
        )}

        {/* Secured Badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[9px] text-brand-body/45 select-none uppercase tracking-widest font-bold">
          <ShieldCheck size={12} className="text-[#8FA088]" />
          <span>Supabase Auth Secured</span>
        </div>

      </div>
    </div>
  );
}
