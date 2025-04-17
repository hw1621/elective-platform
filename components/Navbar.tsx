'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/admin', label: 'Home' },
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/staff', label: 'Staff' },
    { href: '/admin/modules', label: 'Modules' },
    { href: '/admin/configuration', label: 'Configuration' },
    { href: '/admin/reports', label: 'Reports' },
  ];

  return (
    <nav className="bg-white shadow-md">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center">
          <Image
            src="/imperial-logo.png"
            alt="Imperial College Logo"
            width={220}
            height={220}
          />
          <div className="ml-24 flex space-x-10">
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-lg font-semibold pb-1 border-b-2 transition ${
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
