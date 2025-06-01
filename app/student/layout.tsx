'use client'
import Navbar from "@/components/Navbar";
import { SessionProvider } from "next-auth/react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider> 
      <Navbar role='student'/>
      <div className="h-10 bg-[#f9fafb]" />
      {children}
    </SessionProvider>
  );
}
