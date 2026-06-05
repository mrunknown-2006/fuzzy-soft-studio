import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { ShieldCheck, Mail, Lock, ArrowLeft } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const showToast = useStore((state) => state.showToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // If user is already authenticated, check if they can access admin, else keep them here or redirect to admin
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/admin', { replace: true });
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
        navigate('/admin', { replace: true });
      }
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#F5EDE6] flex items-center justify-center px-6 py-20 select-none animate-fade-in-up">
      <div className="max-w-md w-full bg-white/60 border border-brand-border/45 rounded-3xl p-8 shadow-xs backdrop-blur-xs relative">
        
        {/* Back Link */}
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-6 left-6 text-brand-body/60 hover:text-brand-accent transition flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft size={12} />
          <span>Website</span>
        </button>

        {/* Title */}
        <div className="text-center mb-8 mt-4">
          <h1 className="text-3xl font-serif text-brand-heading mb-2">Admin Terminal</h1>
          <p className="text-xs text-brand-body/65 font-sans uppercase tracking-wider">
            Fuzzy Soft Studio Management Login
          </p>
          <div className="h-0.5 w-10 bg-[#C9A84C] mt-3 mx-auto"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 mb-2">
              Admin Email Address
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
                placeholder="admin@fuzzysoftstudio.com"
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
                <span>Logging in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>


        {/* Secured Badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[9px] text-brand-body/45 select-none uppercase tracking-widest font-bold">
          <ShieldCheck size={12} className="text-[#8FA088]" />
          <span>Supabase Auth Secured</span>
        </div>

      </div>
    </div>
  );
}
