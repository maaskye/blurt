import { useCallback, useEffect, useRef, useState } from 'react';

type TimerState = {
  remainingSec: number;
  isPaused: boolean;
  isComplete: boolean;
};

export const useTimer = (initialSec: number, onComplete: () => void) => {
  const [state, setState] = useState<TimerState>({
    remainingSec: initialSec,
    isPaused: false,
    isComplete: false
  });

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (state.isPaused || state.isComplete) {
      return;
    }

    const interval = window.setInterval(() => {
      setState((prev) => {
        if (prev.remainingSec <= 1) {
          window.clearInterval(interval);
          onCompleteRef.current();
          return { ...prev, remainingSec: 0, isComplete: true };
        }

        return { ...prev, remainingSec: prev.remainingSec - 1 };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state.isPaused, state.isComplete]);

  const togglePause = useCallback(() => {
    setState((prev) => {
      if (prev.isComplete) {
        return prev;
      }
      return { ...prev, isPaused: !prev.isPaused };
    });
  }, []);

  const reset = useCallback((nextInitialSec: number) => {
    setState({
      remainingSec: nextInitialSec,
      isPaused: false,
      isComplete: false
    });
  }, []);

  return {
    ...state,
    togglePause,
    reset
  };
};
