import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { AppStateProvider } from './app/state';

function App() {
  return (
    <AppStateProvider>
      <RouterProvider router={router} />
    </AppStateProvider>
  );
}

export default App;
