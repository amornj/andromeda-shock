import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ANDROMEDA-SHOCK 2 | CRT-PHR Algorithm',
  description:
    'Clinical decision support tool for CRT-guided personalized hemodynamic resuscitation in septic shock — based on ANDROMEDA-SHOCK 2 (Hernandez et al., JAMA 2025)',
  keywords: ['septic shock', 'CRT', 'hemodynamic resuscitation', 'clinical decision support'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
