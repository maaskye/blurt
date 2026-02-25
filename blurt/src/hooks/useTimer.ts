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
  const completedRef = useRef(false);
  onCompleteRef.current = onComplete;

  const triggerComplete = useCallback(() => {
    if (completedRef.current) {
      return;
    }
    completedRef.current = true;
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    if (state.isPaused || state.isComplete) {
      return;
    }

    const interval = window.setInterval(() => {
      setState((prev) => {
        if (prev.remainingSec <= 1) {
          window.clearInterval(interval);
          triggerComplete();
          return { ...prev, remainingSec: 0, isComplete: true };
        }

        return { ...prev, remainingSec: prev.remainingSec - 1 };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state.isPaused, state.isComplete, triggerComplete]);

  const togglePause = useCallback(() => {
    setState((prev) => {
      if (prev.isComplete) {
        return prev;
      }
      return { ...prev, isPaused: !prev.isPaused };
    });
  }, []);

  const reset = useCallback((nextInitialSec: number) => {
    completedRef.current = false;
    setState({
      remainingSec: nextInitialSec,
      isPaused: false,
      isComplete: false
    });
  }, []);

  const completeNow = useCallback(() => {
    setState((prev) => {
      if (prev.isComplete) {
        return prev;
      }
      triggerComplete();
      return {
        remainingSec: 0,
        isPaused: false,
        isComplete: true
      };
    });
  }, [triggerComplete]);

  return {
    ...state,
    togglePause,
    reset,
    completeNow
  };
};
