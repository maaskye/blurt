import { useEffect } from 'react';

type Props = {
  onComplete: () => void;
};

const SPLASH_DURATION_MS = 2300;
const REDUCED_MOTION_DURATION_MS = 250;

export const StartupSplash = ({ onComplete }: Props) => {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timeoutId = window.setTimeout(
      onComplete,
      prefersReducedMotion ? REDUCED_MOTION_DURATION_MS : SPLASH_DURATION_MS
    );
    return () => window.clearTimeout(timeoutId);
  }, [onComplete]);

  return (
    <div
      className="startup-splash"
      role="status"
      aria-live="polite"
      aria-label="Starting Blurt"
      onClick={onComplete}
    >
      <div className="startup-splash__content">
        <img src="/branding/blurt-logo.svg" alt="blurt." className="startup-splash__logo" />
        <p className="startup-splash__tagline">Capture your thoughts</p>
        <div className="startup-splash__dots" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="startup-splash__ring" aria-hidden />
    </div>
  );
};
