import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers/providers';

// 使用系统字体，避免 Google Fonts 加载问题

export const metadata: Metadata = {
  title: 'YouTube Analytics Platform',
  description: 'AI-powered YouTube analytics and insights platform for creators and marketers',
  keywords: 'YouTube analytics, video analytics, creator tools, social media analytics, YouTube insights',
  authors: [{ name: 'TubeAnalyticsHub' }],
  openGraph: {
    title: 'YouTube Analytics Platform',
    description: 'AI-powered YouTube analytics and insights platform',
    url: 'https://tubeanalyticshub.xyz',
    siteName: 'TubeAnalyticsHub',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Analytics Platform',
    description: 'AI-powered YouTube analytics and insights platform',
  },

};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}