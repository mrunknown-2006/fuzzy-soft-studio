import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { ShieldCheck, Mail, Lock, User } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const showToast = useStore((state) => state.showToast);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      showToast('Please fill out all fields.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password should be at least 6 characters long.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        showToast(error.message, 'error');
      } else {
        // Check if session exists (verification disabled) or check email verification
        if (data.session) {
          showToast('Account created and signed in successfully!', 'success');
          const ADMIN_EMAIL = 'angrybird@fuzzysoftstudio.com';
          if (data.session.user.email === ADMIN_EMAIL) {
            navigate('/admin', { replace: true });
          } else {
            navigate('/account', { replace: true });
          }
        } else {
          showToast('Signup successful! Please check your email for verification link.', 'success');
          navigate('/login');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-20 select-none animate-fade-in-up">
      <div className="max-w-md w-full bg-white/60 border border-brand-border/45 rounded-3xl p-8 shadow-xs backdrop-blur-xs">
        
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-brand-heading mb-2">Create Account</h1>
          <p className="text-xs text-brand-body/65 font-sans uppercase tracking-wider">
            Join the Fuzzy Soft Studio luxury garden
          </p>
          <div className="h-0.5 w-10 bg-[#C9A84C] mt-3 mx-auto"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-5">
          {/* Name field */}
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 mb-2">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-body/40 pointer-events-none">
                <User size={16} strokeWidth={1.5} />
              </span>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="w-full h-11 pl-10 pr-4 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
              />
            </div>
          </div>

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
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-body/40 pointer-events-none">
                <Lock size={16} strokeWidth={1.5} />
              </span>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
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
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-8 text-center text-xs font-sans text-brand-body/70 border-t border-brand-border/20 pt-6">
          <span>Already have an account? </span>
          <Link to="/login" className="text-brand-accent hover:text-brand-accent-hover font-semibold transition-colors">
            Log In
          </Link>
        </div>

        {/* Secured Badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] text-brand-body/45 select-none uppercase tracking-widest font-bold">
          <ShieldCheck size={12} className="text-[#8FA088]" />
          <span>Supabase Auth Secured</span>
        </div>

      </div>
    </div>
  );
}
