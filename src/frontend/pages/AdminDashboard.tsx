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
    totalNotes: number;
    activeToday: number;
}

interface BrandingSettings {
    site_title?: string;
    logo_url?: string;
    favicon_url?: string;
}

export function AdminDashboard() {
    const { token, user } = useAuth();
    const [activeTab, setActiveTab] = useState<'users' | 'branding'>('users');
    const [users, setUsers] = useState<UserData[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [brandingForm, setBrandingForm] = useState({
        site_title: '',
        logo_url: '',
        favicon_url: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, statsRes, settingsRes] = await Promise.all([
                fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/settings')
            ]);

            if (!usersRes.ok) {
                const text = await usersRes.text();
                throw new Error(`Users API Error (${usersRes.status}): ${text}`);
            }
            if (!statsRes.ok) {
                const text = await statsRes.text();
                throw new Error(`Stats API Error (${statsRes.status}): ${text}`);
            }




            // ... inside component ...
            const usersData = await usersRes.json() as { users: UserData[] };
            const statsData = await statsRes.json() as AdminStats;
            const settingsData = await settingsRes.json() as BrandingSettings;

            setUsers(usersData.users);
            setStats(statsData);
            setBrandingForm({
                site_title: settingsData.site_title || '',
                logo_url: settingsData.logo_url || '',
                favicon_url: settingsData.favicon_url || ''
            });

        } catch (err: any) {
            setError(err.message || "Unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    const saveBranding = async () => {
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(brandingForm)
            });
            if (!res.ok) throw new Error("Failed to save settings");
            alert("Branding updated! Reload to see changes.");
            fetchData();
        } catch (e) {
            alert("Error saving settings");
        }
    };

    const handleImpersonate = (userId: string) => {
        if (confirm("View app as this user?")) {
            localStorage.setItem("impersonate_id", userId);
            window.location.href = "/";
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

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-8">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light">Admin Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    >
                        Users & Stats
                    </button>
                    <button
                        onClick={() => setActiveTab('branding')}
                        className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'branding' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    >
                        Branding
                    </button>
                </div>
            </header>

            {activeTab === 'users' && (
                <>
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
                                <p className="text-2xl font-semibold">{stats?.totalNotes || 0}</p>
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
                </>
            )}

            {activeTab === 'branding' && (
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-medium mb-6">Platform Branding</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Site Title</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={brandingForm.site_title}
                                onChange={e => setBrandingForm({ ...brandingForm, site_title: e.target.value })}
                                placeholder="Durable Notes"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                                value={brandingForm.logo_url}
                                onChange={e => setBrandingForm({ ...brandingForm, logo_url: e.target.value })}
                                placeholder="https://example.com/logo.png"
                            />
                            {brandingForm.logo_url && <img src={brandingForm.logo_url} className="mt-2 h-12 object-contain border p-1 rounded" />}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Favicon URL</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                                value={brandingForm.favicon_url}
                                onChange={e => setBrandingForm({ ...brandingForm, favicon_url: e.target.value })}
                                placeholder="https://example.com/favicon.ico"
                            />
                            {brandingForm.favicon_url && <img src={brandingForm.favicon_url} className="mt-2 w-8 h-8 object-contain border p-1 rounded" />}
                        </div>
                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={saveBranding}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
