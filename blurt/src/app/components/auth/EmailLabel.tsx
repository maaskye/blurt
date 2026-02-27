import { ReactNode } from 'react';

interface EmailLabelProps {
  htmlFor: string;
  children: ReactNode;
}

export function EmailLabel({ htmlFor, children }: EmailLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-neutral-700 mb-2"
    >
      {children}
    </label>
  );
}
