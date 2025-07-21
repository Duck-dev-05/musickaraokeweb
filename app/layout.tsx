import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '../components/Navbar';
import Player from '../components/Player';
import Sidebar from '../components/Sidebar';
import { AuthProvider } from './providers/AuthProvider';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Music Karaoke Web',
  description: 'A music and karaoke web application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <AuthProvider>
          <div className="flex h-full bg-dark text-light">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1 overflow-y-auto p-6 pb-28">
                {children}
              </main>
              <Player />
            </div>
          </div>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--dark-secondary)',
                color: 'var(--light)',
                borderRadius: '0.5rem',
                border: '1px solid var(--dark-hover)',
              },
              duration: 3000,
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
