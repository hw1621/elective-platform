import Navbar from '@/components/Navbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow p-8 bg-gray-100">
            {children}
        </main>
        </div>
    );
}