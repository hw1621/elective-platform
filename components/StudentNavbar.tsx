'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function StudentNavbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/student', label: 'Select Modules' },
    { href: '/student/bidding', label: 'Allocate Bids' },
    { href: '/student/allocation_result', label: 'View Results' },
  ];

  return (
    <nav className="bg-white shadow-md px-6 border-b border-gray-300 sticky top-0 z-50">
      <div className="flex items-center justify-between py-4 flex-wrap gap-y-4">
        {/* left - logo + nav links */}
        <div className="flex items-center gap-x-10 flex-wrap">
          <Image src="/imperial-logo.png" alt="Imperial College Logo" width={200} height={40} />
          <div className="flex flex-wrap gap-x-8 sm:gap-x-12 ml-4">
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
      </div>
    </nav>
  );
}
