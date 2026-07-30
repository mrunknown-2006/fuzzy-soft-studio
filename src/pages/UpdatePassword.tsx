import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const showToast = useStore((state) => state.showToast);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !window.location.hash.includes('access_token')) {
        showToast('Password recovery session expired or invalid. Please request a new link.', 'error');
      }
    });
  }, [showToast]);

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
        setIsSuccess(true);
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

        {isSuccess ? (
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
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-5">
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
                  type="password"
                  id="newPassword"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-4 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                />
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
                  type="password"
                  id="confirmPassword"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-4 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                />
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
              {loading ? 'Updating Password...' : 'Finalize New Password'}
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
