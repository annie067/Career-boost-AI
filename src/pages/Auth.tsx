import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Mail, Lock, Loader2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';

type AuthMode = 'login' | 'signup' | 'verify' | 'forgot';

export default function Auth() {
  const { user } = useAuth();
  const initialMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'verify'
    ? 'verify'
    : 'login';

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');

  useEffect(() => {
    const savedToken = sessionStorage.getItem('careerboost-signup-token');
    const savedEmail = sessionStorage.getItem('careerboost-signup-email');

    if (savedToken && mode !== 'verify') {
      setMode('verify');
    }

    if (savedToken && !verificationToken) {
      setVerificationToken(savedToken);
    }

    if (savedEmail && !email) {
      setEmail(savedEmail);
    }
  }, [mode, verificationToken, email]);

  if (user) return <Navigate to="/" />;

  const apiRequest = async <T,>(url: string, payload: Record<string, unknown>) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as T & {
      error?: string;
      message?: string;
    };

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Something went wrong');
    }

    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('error');

    try {
      if (mode === 'signup') {
        const data = await apiRequest<{ verificationToken: string }>('/api/signup-request', {
          email,
        });

        setVerificationToken(data.verificationToken);
        sessionStorage.setItem('careerboost-signup-token', data.verificationToken);
        sessionStorage.setItem('careerboost-signup-email', email);
        setVerificationCode('');
        setMode('verify');
        setMessageType('success');
        setMessage('We sent a 6-digit verification code to your email.');
      }

      if (mode === 'verify') {
        if (!verificationToken) {
          throw new Error('Please request a new verification code.');
        }

        await apiRequest('/api/signup-verify', {
          verificationToken,
          code: verificationCode,
          password,
        });

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        sessionStorage.removeItem('careerboost-signup-token');
        sessionStorage.removeItem('careerboost-signup-email');
      }

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }

      if (mode === 'forgot') {
        await apiRequest('/api/password-reset-request', { email });
        setMessageType('success');
        setMessage('If the email exists, a reset link has been sent.');
      }
    } catch (err: unknown) {
      setMessageType('error');
      setMessage(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setMessage('');
    setMessageType('error');

    try {
      const data = await apiRequest<{ verificationToken: string }>('/api/signup-request', {
        email,
      });

      setVerificationToken(data.verificationToken);
      sessionStorage.setItem('careerboost-signup-token', data.verificationToken);
      sessionStorage.setItem('careerboost-signup-email', email);
      setVerificationCode('');
      setMessageType('success');
      setMessage('A fresh verification code has been sent.');
    } catch (err: unknown) {
      setMessageType('error');
      setMessage(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error(error);
      setMessageType('error');
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
          <div
            className={`mb-4 text-center text-sm ${
              messageType === 'success' ? 'text-emerald-500' : 'text-red-500'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {mode === 'verify' && (
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                inputMode="numeric"
                placeholder="6-digit verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg"
              />
            </div>
          )}

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
            {mode === 'verify' && 'Verify & Create Account'}
            {mode === 'forgot' && 'Send Reset Link'}
          </button>
        </form>

        {mode === 'login' && (
          <>
            <div className="my-4 text-center text-sm">or</div>

            <button onClick={handleGoogleLogin} className="w-full py-3 border rounded-lg">
              Continue with Google
            </button>
          </>
        )}

        <div className="mt-6 text-center text-sm space-y-2">
          {mode === 'login' && (
            <>
              <p>
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => setMode('signup')} className="text-blue-500">
                  Sign Up
                </button>
              </p>

              <p>
                Forgot password?{' '}
                <button type="button" onClick={() => setMode('forgot')} className="text-blue-500">
                  Reset
                </button>
              </p>
            </>
          )}

          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')} className="text-blue-500">
                Sign In
              </button>
            </p>
          )}

          {mode === 'verify' && (
            <>
              <p>
                Didn&apos;t get the code?{' '}
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-blue-500"
                  disabled={loading}
                >
                  Resend code
                </button>
              </p>

              <p>
                Use a different email?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setVerificationCode('');
                    setVerificationToken('');
                    sessionStorage.removeItem('careerboost-signup-token');
                    sessionStorage.removeItem('careerboost-signup-email');
                  }}
                  className="text-blue-500"
                >
                  Go back
                </button>
              </p>
            </>
          )}

          {mode === 'forgot' && (
            <p>
              Back to login?{' '}
              <button type="button" onClick={() => setMode('login')} className="text-blue-500">
                Sign In
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
