import { InputHTMLAttributes } from 'react';

interface EmailInputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function EmailInput({ hasError, className = '', ...props }: EmailInputProps) {
  return (
    <input
      {...props}
      className={`
        w-full px-4 py-3 
        text-base text-neutral-900
        bg-white 
        border-2 rounded-lg
        transition-all duration-200
        placeholder:text-neutral-400
        disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed
        ${
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
            : 'border-neutral-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100'
        }
        focus:outline-none
        ${className}
      `}
      placeholder="you@example.com"
    />
  );
}
