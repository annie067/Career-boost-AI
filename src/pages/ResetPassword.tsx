import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Briefcase, Loader2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [completed, setCompleted] = useState(false);

  const tokenPresent = useMemo(() => Boolean(token), [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('error');

    try {
      if (!tokenPresent) {
        throw new Error('This reset link is missing a token.');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      const response = await fetch('/api/password-reset-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Unable to reset password.');
      }

      setCompleted(true);
      setMessageType('success');
      setMessage('Your password has been updated. You can sign in again now.');
      setPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setMessageType('error');
      setMessage(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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
          <h1 className="text-xl font-bold">Reset Password</h1>
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

        {!tokenPresent && !completed ? (
          <div className="text-center text-sm text-muted-foreground">
            This reset link is invalid or missing its token.
            <div className="mt-4">
              <Link to="/auth" className="text-blue-500">
                Back to sign in
              </Link>
            </div>
          </div>
        ) : completed ? (
          <div className="text-center text-sm space-y-4">
            <p className="text-muted-foreground">
              Your password is ready. Return to the sign-in page to access your account.
            </p>
            <Link to="/auth" className="inline-flex text-blue-500">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg"
              />
            </div>

            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg flex justify-center items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update password
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
