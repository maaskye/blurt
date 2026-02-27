import { ButtonHTMLAttributes } from 'react';
import { Loader2, Check } from 'lucide-react';

interface SendMagicLinkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  isSuccess?: boolean;
}

export function SendMagicLinkButton({
  isLoading,
  isSuccess,
  disabled,
  children,
  ...props
}: SendMagicLinkButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`
        w-full py-3.5 
        rounded-lg 
        font-semibold text-base
        transition-all duration-200
        flex items-center justify-center gap-2
        ${
          disabled
            ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            : isSuccess
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
        }
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Sending…
        </>
      ) : isSuccess ? (
        <>
          <Check className="w-5 h-5" />
          Sent!
        </>
      ) : (
        children || 'Send magic link'
      )}
    </button>
  );
}
