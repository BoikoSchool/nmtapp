import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LogOut, Shield } from 'lucide-react';

export const Layout = () => {
    const { user, signOut, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-2xl font-extrabold text-green-500 tracking-tighter">NMT<span className="text-slate-700">APP</span></span>
                    </Link>

                    <nav className="flex items-center gap-6">
                        <Link to="/" className="text-slate-500 hover:text-green-500 font-bold transition-colors">Предмети</Link>
                        <Link to="/live" className="flex items-center gap-1 text-red-500 hover:text-red-600 font-black tracking-wide transition-colors">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> LIVE
                        </Link>
                        {isAdmin && (
                            <Link to="/admin" className="flex items-center gap-1 text-blue-500 hover:text-blue-600 font-bold transition-colors">
                                <Shield className="w-4 h-4" /> Адмін
                            </Link>
                        )}
                    </nav>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-bold text-slate-700 leading-none">{user?.user_metadata?.full_name || user?.email}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isAdmin ? 'Адміністратор' : 'Студент'}</span>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Вийти"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
};
