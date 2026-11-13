import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import '@fontsource-variable/archivo';
import { queryClient } from './app/queryClient';
import { AppRouter } from './app/router';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { ToastContainer } from './components/ui/Toast';
import './styles/globals.css';

function Providers() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  // Oppora is a dark-mode product: always render the dark canvas.
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  // Restore authentication once on mount
  useEffect(() => {
    restoreSession().finally(() => useAuthStore.setState({ sessionRestored: true }));
  }, [restoreSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </QueryClientProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers />
  </StrictMode>
);
