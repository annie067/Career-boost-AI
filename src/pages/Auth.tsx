import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';
import { Briefcase, Mail, Lock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Auth() {
  const { user } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (user) return <Navigate to="/" />;

  // ✅ HANDLE LOGIN / SIGNUP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Check your email to verify your account.');
      }

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }

      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'http://localhost:5173/reset-password',
        });
        if (error) throw error;
        setMessage('Password reset link sent to your email.');
      }
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ GOOGLE LOGIN (FINAL)
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) {
      console.error(error);
      setMessage('Google login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel w-full max-w-md p-8 rounded-2xl"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
            <Briefcase className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">CareerBoost</h1>
        </div>

        {message && (
          <div className="mb-4 text-center text-sm text-red-500">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* EMAIL */}
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg"
            />
          </div>

          {/* PASSWORD (hide in forgot mode) */}
          {mode !== 'forgot' && (
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg flex justify-center items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}

            {mode === 'login' && 'Sign In'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot' && 'Send Reset Link'}
          </button>
        </form>

        {/* GOOGLE LOGIN */}
        {mode !== 'forgot' && (
          <>
            <div className="my-4 text-center text-sm">or</div>

            <button
              onClick={handleGoogleLogin}
              className="w-full py-3 border rounded-lg"
            >
              Continue with Google
            </button>
          </>
        )}

        {/* SWITCH MODES */}
        <div className="mt-6 text-center text-sm space-y-2">
          {mode === 'login' && (
            <>
              <p>
                Don’t have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-blue-500"
                >
                  Sign Up
                </button>
              </p>

              <p>
                Forgot password?{' '}
                <button
                  onClick={() => setMode('forgot')}
                  className="text-blue-500"
                >
                  Reset
                </button>
              </p>
            </>
          )}

          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-blue-500"
              >
                Sign In
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <p>
              Back to login?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-blue-500"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}