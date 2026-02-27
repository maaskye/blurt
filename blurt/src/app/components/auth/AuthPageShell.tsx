import { ReactNode } from 'react';

interface AuthPageShellProps {
  children: ReactNode;
}

export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      {children}
    </div>
  );
}
