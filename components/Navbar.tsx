'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { PowerIcon } from '@heroicons/react/24/outline';

type NavbarProps = {
  role: 'admin' | 'student';
};

export default function Navbar({ role }: NavbarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const studentLinks = [
    { href: '/student', label: 'Select Modules' },
    { href: '/student/bidding', label: 'Allocate Bids' },
    { href: '/student/allocation_result', label: 'View Results' },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Home' },
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/staff', label: 'Staff' },
    { href: '/admin/modules', label: 'Modules' },
    { href: '/admin/config', label: 'Configuration' },
    { href: '/admin/reports', label: 'Reports' },
  ];

  const navLinks = role === 'admin' ? adminLinks : studentLinks;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white shadow-md px-6 border-b border-gray-300 sticky top-0 z-50">
      <div className="flex items-center justify-between py-4 flex-wrap gap-y-4">
        {/* left - logo + nav links */}
        <div className="flex items-center gap-x-10 flex-wrap min-w-0">
          <Image src="/imperial-logo.png" alt="Imperial College Logo" width={200} height={40} />
          <div className="flex flex-wrap gap-x-8 sm:gap-x-10 ml-4">
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-lg font-semibold border-b-2 transition ${
                    isActive
                      ? 'text-blue-700 border-blue-700'
                      : 'text-gray-800 border-transparent hover:text-blue-600 hover:border-blue-300'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* right region */}
        {status === 'authenticated' && (
          <div className="relative" ref={menuRef}>
            <div className="flex items-center gap-1 flex-wrap">
              <span role="img" aria-label="wave" className="text-xl">👋</span>
              <span className="text-base font-medium">Welcome!</span>
              <button
                onClick={() => setOpen(prev => !prev)}
                className="text-blue-700 font-semibold px-1 py-2 rounded-lg hover:bg-gray-100 text-md"
              >
                {session.user?.name || 'User'}
              </button>
            </div>

            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 text-sm">
                <button
                  onClick={() => signOut({ callbackUrl: '/sign-in' })}
                  className="flex items-center gap-2 w-full px-4 py-3 text-left text-red-500 hover:bg-gray-50"
                >
                  <PowerIcon className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
