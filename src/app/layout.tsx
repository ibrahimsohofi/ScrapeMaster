import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/context';
import { ThemeProvider } from '@/lib/theme';
import { Toaster } from '@/components/ui/toaster';
import { TutorialProgressProvider } from '@/lib/contexts/tutorial-progress';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ScrapeMaster - Enterprise Web Scraping Platform',
    template: '%s | ScrapeMaster'
  },
  description: 'Transform raw web data into actionable insights with ScrapeMaster - the enterprise-grade web scraping platform featuring AI-powered automation, advanced proxy management, CAPTCHA solving, and real-time analytics. Extract data at scale with enterprise security.',
  keywords: [
    'web scraping',
    'data extraction',
    'automation',
    'AI powered scraping',
    'proxy management',
    'enterprise scraping',
    'SaaS platform',
    'CAPTCHA solving',
    'data analytics',
    'no-code scraping'
  ],
  authors: [{ name: 'ScrapeMaster Team', url: 'https://scrapemaster.pro' }],
  creator: 'ScrapeMaster',
  publisher: 'ScrapeMaster',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://scrapemaster.pro'),
  openGraph: {
    title: 'ScrapeMaster - Enterprise Web Scraping Platform',
    description: 'Transform raw web data into actionable insights with AI-powered automation and enterprise security.',
    url: 'https://scrapemaster.pro',
    siteName: 'ScrapeMaster',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ScrapeMaster - Enterprise Web Scraping Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScrapeMaster - Enterprise Web Scraping Platform',
    description: 'Transform raw web data into actionable insights with AI-powered automation and enterprise security.',
    images: ['/og-image.png'],
    creator: '@scrapemaster',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.svg', type: 'image/svg+xml', sizes: '32x32' },
    ],
    apple: [
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider
          defaultTheme="system"
        >
          <AuthProvider>
            <TutorialProgressProvider>
              {children}
              <Toaster />
            </TutorialProgressProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
