'use client'
import { SessionProvider } from 'next-auth/react';
import Navbar from '@/components/Navbar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow p-8 bg-gray-100">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
