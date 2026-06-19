'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth-context';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a1a2e', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1a1a2e' } },
            success: { iconTheme: { primary: '#10b981', secondary: '#1a1a2e' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
