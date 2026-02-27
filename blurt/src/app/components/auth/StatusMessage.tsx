import { CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusMessageProps {
  state: 'default' | 'loading' | 'success' | 'error';
  errorMessage?: string | null;
  successMessage?: string;
}

export function StatusMessage({ state, errorMessage, successMessage }: StatusMessageProps) {
  if (state === 'default' || state === 'loading') {
    // Reserve space to prevent layout shift
    return <div className="h-10" />;
  }

  if (state === 'success') {
    return (
      <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-green-800">
          {successMessage ?? 'Check your email for the sign-in link'}
        </p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-800">
          {errorMessage ?? 'Something went wrong. Please try again.'}
        </p>
      </div>
    );
  }

  return null;
}
