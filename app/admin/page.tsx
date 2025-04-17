export default function AdminPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-lg">Welcome to the admin dashboard!</p>
        <div className="mt-8">
            <a href="/admin/dashboard" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Go to Dashboard</a>
        </div>
        </div>
    );
}