import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { AppStateProvider } from './app/state';
import { StartupSplash } from './app/components/StartupSplash';
import { useCallback, useEffect, useRef, useState } from 'react';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const startupAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const startupAudio = new Audio('/sfx/startup/startup.wav');
    startupAudio.preload = 'auto';
    startupAudioRef.current = startupAudio;
    void startupAudio.play().catch(() => {
      // Ignore playback rejection (environment policy/device state).
    });
  }, []);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <AppStateProvider>
      <RouterProvider router={router} />
      {showSplash && <StartupSplash onComplete={handleSplashComplete} />}
    </AppStateProvider>
  );
}

export default App;
