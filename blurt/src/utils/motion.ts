export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export const easeOutQuint = (t: number) => 1 - (1 - t) ** 5;

export const stepVelocity = (velocityPxPerSec: number, frictionPerSec: number, deltaMs: number) =>
  velocityPxPerSec * Math.exp((-frictionPerSec * deltaMs) / 1000);

type FrameArgs = {
  progress: number;
  elapsedMs: number;
  deltaMs: number;
};

type DoneArgs = {
  completed: boolean;
};

export const animateRaf = (
  durationMs: number,
  onFrame: (args: FrameArgs) => void,
  onDone?: (args: DoneArgs) => void
) => {
  let rafId = 0;
  let startedAt = 0;
  let lastAt = 0;
  let isDone = false;

  const finish = (completed: boolean) => {
    if (isDone) {
      return;
    }
    isDone = true;
    onDone?.({ completed });
  };

  const tick = (timestamp: number) => {
    if (isDone) {
      return;
    }

    if (!startedAt) {
      startedAt = timestamp;
      lastAt = timestamp;
    }

    const elapsedMs = timestamp - startedAt;
    const deltaMs = timestamp - lastAt;
    lastAt = timestamp;

    const progress = durationMs <= 0 ? 1 : Math.min(1, elapsedMs / durationMs);
    onFrame({ progress, elapsedMs, deltaMs });

    if (progress >= 1) {
      finish(true);
      return;
    }

    rafId = window.requestAnimationFrame(tick);
  };

  rafId = window.requestAnimationFrame(tick);

  return () => {
    if (isDone) {
      return;
    }
    window.cancelAnimationFrame(rafId);
    finish(false);
  };
};

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const prefersReducedMotion = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
};

export const subscribeReducedMotion = (onChange: (isReduced: boolean) => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    onChange(false);
    return () => undefined;
  }

  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  const handler = () => onChange(mediaQuery.matches);
  handler();

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }

  const legacyQuery = mediaQuery as MediaQueryList & {
    addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  };

  legacyQuery.addListener?.(handler);
  return () => legacyQuery.removeListener?.(handler);
};
