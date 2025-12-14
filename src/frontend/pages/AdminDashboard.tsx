import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Activity, Loader2, ShieldAlert } from 'lucide-react';

interface UserData {
    id: string;
    email: string;
    name: string;
    picture: string;
    created_at: number;
}

interface AdminStats {
    totalUsers: number;
    activeToday: number;
}

export function AdminDashboard() {
    const { token, user } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, statsRes] = await Promise.all([
                fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (!usersRes.ok) {
                const text = await usersRes.text();
                throw new Error(`Users API Error (${usersRes.status}): ${text}`);
            }
            if (!statsRes.ok) {
                const text = await statsRes.text();
                throw new Error(`Stats API Error (${statsRes.status}): ${text}`);
            }

            const usersData = await usersRes.json() as { users: UserData[] };
            const statsData = await statsRes.json() as AdminStats;

            setUsers(usersData.users);
            setStats(statsData);
        } catch (err: any) {
            setError(err.message || "Unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
    if (error) return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 text-red-500">
            <ShieldAlert className="w-12 h-12" />
            <p className="font-semibold text-lg">Access Denied</p>
            <p>{error}</p>
            <p className="text-gray-500 text-sm">
                You are logged in as: <span className="font-mono text-gray-700">{user?.email}</span>
            </p>
            <p className="text-xs text-gray-400">Allowed: durablenotes@gmail.com</p>
            <a href="/" className="text-indigo-500 hover:underline mt-4">Go Back</a>
        </div>
    );


    const handleImpersonate = (userId: string) => {
        if (confirm("View app as this user?")) {
            localStorage.setItem("impersonate_id", userId);
            window.location.href = "/";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-8">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light">Admin Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Total Users</p>
                        <p className="text-2xl font-semibold">{stats?.totalUsers || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Total Notes</p>
                        <p className="text-2xl font-semibold">-</p> {/* Notes are partitioned, hard to count global cheaply without counter */}
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-medium">Recent Users</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">User</th>
                                <th className="px-6 py-3 font-medium">Email</th>
                                <th className="px-6 py-3 font-medium">Joined</th>
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <img src={u.picture} className="w-8 h-8 rounded-full" />
                                        <div className="flex flex-col">
                                            <span className="font-medium">{u.name}</span>
                                            <span className="text-xs text-gray-400 font-mono">{u.id.slice(0, 8)}...</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{u.email}</td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {new Date(u.created_at * 1000).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleImpersonate(u.id)}
                                            className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors"
                                        >
                                            Login As
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
