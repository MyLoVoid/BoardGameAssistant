import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';
import { NotificationsProvider } from '@/components/ui/notifications-provider';

export const metadata: Metadata = {
  title: 'BGAI Admin Portal',
  description: 'Board Game Assistant Intelligent - Admin Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <NotificationsProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
