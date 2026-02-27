import { FormEvent, ReactNode, useState } from 'react';
import { useAppState } from '../state';
import { AuthPageShell } from './auth/AuthPageShell';
import { EmailInput } from './auth/EmailInput';
import { EmailLabel } from './auth/EmailLabel';
import { LocalModeLink } from './auth/LocalModeLink';
import { SendMagicLinkButton } from './auth/SendMagicLinkButton';
import { StatusMessage } from './auth/StatusMessage';

type Props = {
  children: ReactNode;
};

export const AuthGate = ({ children }: Props) => {
  const {
    authRequired,
    authEnabled,
    authLoading,
    authUser,
    authStatusMessage,
    clearStatusMessage,
    signInWithPassword,
    signUpWithPassword
  } = useAppState();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password.trim() || submitting || authLoading) {
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setSuccessMessage(null);

    const run = async () => {
      if (mode === 'signin') {
        await signInWithPassword(normalizedEmail, password);
        return;
      }
      await signUpWithPassword(normalizedEmail, password);
      setSuccessMessage('Account created. You are now signed in.');
    };

    void run()
      .catch((error) => {
        setFormError(error instanceof Error ? error.message : 'Authentication failed.');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  if (!authRequired || authUser) {
    return (
      <>
        {authStatusMessage && (
          <div className="fixed top-4 left-1/2 z-[70] -translate-x-1/2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 shadow">
            <div className="flex items-center gap-3">
              <span>{authStatusMessage}</span>
              <button type="button" className="rounded border border-amber-300 px-2 py-0.5 text-xs" onClick={clearStatusMessage}>
                Dismiss
              </button>
            </div>
          </div>
        )}
        {children}
      </>
    );
  }

  if (!authEnabled) {
    return (
      <AuthPageShell>
        <div className="w-full max-w-[490px] bg-white rounded-2xl shadow-lg border border-neutral-200 p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">blurt.</h1>
          </div>
          <h2 className="text-2xl font-semibold text-neutral-900 text-center mb-2">Cloud mode needs setup</h2>
          <p className="text-neutral-600 text-center mb-6">
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>blurt/.env</code>.
          </p>
          <LocalModeLink
            onClick={() => {
              setFormError('Set VITE_STORAGE_MODE=local in blurt/.env, then restart npm run tauri dev.');
            }}
          />
          <StatusMessage state={formError ? 'error' : 'default'} errorMessage={formError} />
        </div>
      </AuthPageShell>
    );
  }

  const state: 'default' | 'loading' | 'success' | 'error' = submitting
    ? 'loading'
    : formError
      ? 'error'
      : successMessage
        ? 'success'
        : 'default';

  return (
    <AuthPageShell>
      <div className="w-full max-w-[490px] bg-white rounded-2xl shadow-lg border border-neutral-200 p-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">blurt.</h1>
        </div>

        <h2 className="text-2xl font-semibold text-neutral-900 text-center mb-2">Sign in to sync Blurt</h2>
        <p className="text-neutral-600 text-center mb-6">Use your email and password directly in the app.</p>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <button
            type="button"
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${mode === 'signin' ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-neutral-300 text-neutral-600'}`}
            onClick={() => {
              setMode('signin');
              setFormError(null);
              setSuccessMessage(null);
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${mode === 'signup' ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-neutral-300 text-neutral-600'}`}
            onClick={() => {
              setMode('signup');
              setFormError(null);
              setSuccessMessage(null);
            }}
          >
            Create account
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <EmailLabel htmlFor="email">Email</EmailLabel>
            <EmailInput
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting || authLoading}
              hasError={Boolean(formError)}
            />
          </div>

          <div>
            <EmailLabel htmlFor="password">Password</EmailLabel>
            <EmailInput
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting || authLoading}
              hasError={Boolean(formError)}
              placeholder="Minimum 6 characters"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <EmailLabel htmlFor="confirm-password">Confirm Password</EmailLabel>
              <EmailInput
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={submitting || authLoading}
                hasError={Boolean(formError)}
                placeholder="Repeat password"
              />
            </div>
          )}

          <StatusMessage state={state} errorMessage={formError} successMessage={successMessage ?? 'Signed in successfully'} />

          <SendMagicLinkButton
            type="submit"
            disabled={!email.trim() || !password.trim() || submitting || authLoading || (mode === 'signup' && !confirmPassword.trim())}
            isLoading={submitting || authLoading}
            isSuccess={Boolean(successMessage)}
          >
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </SendMagicLinkButton>

          <LocalModeLink
            onClick={() => {
              setFormError('To use local mode: set VITE_STORAGE_MODE=local in blurt/.env and restart app.');
            }}
          />

          <p className="text-xs text-neutral-500 text-center mt-6">Cloud sync account (no browser redirect required).</p>
        </form>
      </div>
    </AuthPageShell>
  );
};
