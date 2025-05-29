'use client';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { PowerIcon } from '@heroicons/react/24/outline';


export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const navLinks = [
    { href: '/admin', label: 'Home' },
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/staff', label: 'Staff' },
    { href: '/admin/modules', label: 'Modules' },
    { href: '/admin/config', label: 'Configuration' },
    { href: '/admin/reports', label: 'Reports' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white shadow-md px-6">
      <div className="flex flex-wrap items-center justify-between py-4 gap-y-4">
        {/* left region */}
        <div className="flex flex-wrap items-center gap-x-10 min-w-0">
          <Image src="/imperial-logo.png" alt="Imperial College Logo" width={220} height={220} />
          <div className="flex flex-wrap gap-x-6 sm:gap-x-10 ml-6">
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-base font-semibold border-b-2 transition ${
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
                onClick={() => setOpen((prev) => !prev)}
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
