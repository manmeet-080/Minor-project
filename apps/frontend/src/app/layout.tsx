import type { Metadata } from 'next';
import { DM_Sans, Bricolage_Grotesque } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { CommandPalette } from '@/components/shared/CommandPalette';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const bricolage = Bricolage_Grotesque({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Campusphere - Smart Campus Management Platform',
  description: 'Complete campus and hostel management solution for modern institutions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${bricolage.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            <TooltipProvider>
              {children}
              <CommandPalette />
              <Toaster position="top-right" richColors closeButton duration={4000} />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
