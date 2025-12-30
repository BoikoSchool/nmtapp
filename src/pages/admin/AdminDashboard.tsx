import { Link, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, FileQuestion, PlayCircle, LogOut, Home, BarChart3 } from 'lucide-react';
import { useAuth } from '../../components/AuthProvider';

export const AdminLayout = () => {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 p-6 hidden md:block">
                <div className="text-2xl font-extrabold text-green-500 tracking-tighter mb-8">NMT<span className="text-slate-700">ADMIN</span></div>

                <nav className="space-y-2">
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors">
                        <LayoutDashboard className="w-5 h-5" /> Дашборд
                    </Link>
                    <Link to="/admin/subjects" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors">
                        <BookOpen className="w-5 h-5" /> Предмети
                    </Link>
                    <Link to="/admin/tests" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors">
                        <FileQuestion className="w-5 h-5" /> Тести
                    </Link>
                    <div className="pt-4 pb-2 px-4 text-xs font-bold text-slate-400 uppercase">Live Control</div>
                    <Link to="/admin/sessions" className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-colors">
                        <PlayCircle className="w-5 h-5" /> Сесії
                    </Link>
                    <Link to="/admin/stats" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors">
                        <BarChart3 className="w-5 h-5" /> Статистика
                    </Link>
                </nav>

                <div className="mt-auto pt-8 flex flex-col gap-2">
                    <Link to="/" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 rounded-xl font-bold transition-colors">
                        <Home className="w-5 h-5" /> На головну
                    </Link>
                    <button
                        onClick={async () => {
                            await signOut();
                            navigate('/login');
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl font-bold transition-colors group"
                    >
                        <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> Вийти
                    </button>
                </div>
            </aside>

            {/* Content */}
            <main className="flex-1 p-8">
                <Outlet />
            </main>
        </div>
    );
};

export const AdminDashboard = () => {
    return (
        <div>
            <h1 className="text-3xl font-extrabold text-slate-800 mb-6">Панель керування</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/admin/subjects" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-green-400 group">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Предмети</h3>
                    <p className="text-slate-500">Створити нові предмети (Математика, Історія...)</p>
                </Link>

                <Link to="/admin/tests" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-green-400 group">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileQuestion className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Тести</h3>
                    <p className="text-slate-500">Завантажити JSON з питаннями, налаштувати тести.</p>
                </Link>

                <Link to="/admin/stats" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-green-400 group md:col-span-2">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Статистика</h3>
                    <p className="text-slate-500">Аналітика успішності та складність питань.</p>
                </Link>
            </div>
        </div>
    );
};
