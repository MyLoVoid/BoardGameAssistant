'use client';

import { Toaster } from 'react-hot-toast';

export function NotificationsProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0px 10px 15px -3px rgba(15, 23, 42, 0.2)',
        },
        success: {
          style: {
            borderColor: '#16a34a',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#16a34a',
          },
        },
        error: {
          style: {
            borderColor: '#dc2626',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#dc2626',
          },
        },
      }}
    />
  );
}
