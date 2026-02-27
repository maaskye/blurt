import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { AppStateProvider } from './app/state';
import { StartupSplash } from './app/components/StartupSplash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthGate } from './app/components/AuthGate';
import { initDeepLinkAuth } from './services/deepLinkAuth';

const AppShell = () => {
  return (
    <AuthGate>
      <RouterProvider router={router} />
    </AuthGate>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const startupAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void initDeepLinkAuth().then((stop) => {
      unlisten = stop;
    });

    const startupAudio = new Audio('/sfx/startup/startup.wav');
    startupAudio.preload = 'auto';
    startupAudioRef.current = startupAudio;
    void startupAudio.play().catch(() => {
      // Ignore playback rejection (environment policy/device state).
    });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <AppStateProvider>
      <AppShell />
      {showSplash && <StartupSplash onComplete={handleSplashComplete} />}
    </AppStateProvider>
  );
}

export default App;
