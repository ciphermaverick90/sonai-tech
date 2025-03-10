import type { Metadata } from 'next';
import { Urbanist } from 'next/font/google';
import './globals.css';
import { Provider } from '@/components/Provider';

const urbanist = Urbanist({
  variable: '--font-urbanist',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SonAI - AI on Sonic Network',
  description: 'Smart trading assistant powered by AI on Sonic Network EVM',
  keywords: 'AI, crypto trading, blockchain, artificial intelligence, SonAI, Sonic Network, EVM',
  authors: [{ name: 'SonAI Team' }],
  openGraph: {
    title: 'SonAI - AI on Sonic Network',
    description: 'Smart trading assistant powered by AI on Sonic Network EVM',
    images: ['/sonai-og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className='dark'>
      <body className={`${urbanist.variable} antialiased min-h-screen text-white relative`}>
        <Provider>{children}</Provider>
        <img src='/body-background.png' alt='sonai-bg' className='fixed w-full h-full bottom-0 -z-5 pointer-events-none' />
      </body>
    </html>
  );
}
