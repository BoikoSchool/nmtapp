import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Mail } from 'lucide-react';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) {
            alert(error.message);
            setGoogleLoading(false);
        }
        // On success the browser redirects to Google — no need to reset state
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Use Magic Link for simplicity and security
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin
            }
        });

        if (error) {
            alert(error.message);
        } else {
            setSent(true);
        }
        setLoading(false);
    };

    if (sent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Перевірте пошту</h2>
                    <p className="text-slate-600 mb-6">
                        Ми надіслали магічне посилання для входу на <strong>{email}</strong>.
                    </p>
                    <button
                        onClick={() => setSent(false)}
                        className="text-green-600 font-bold hover:underline"
                    >
                        Ввести іншу пошту
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                <div className="text-center mb-8">
                    <span className="text-3xl font-extrabold text-green-500 tracking-tighter">NMT<span className="text-slate-700">APP</span></span>
                    <h2 className="text-xl font-bold text-slate-700 mt-2">Вхід до системи</h2>
                </div>

                {/* Google Sign-In */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 p-4 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-70 mb-6"
                >
                    {googleLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <GoogleIcon />}
                    Увійти через Google
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs font-bold text-slate-400 uppercase">або через email</span>
                    <div className="flex-1 h-px bg-slate-200" />
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:outline-none font-medium text-slate-700 transition-colors"
                            placeholder="student@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg shadow-green-200 active:scale-95 flex items-center justify-center disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Увійти'}
                    </button>

                    <p className="text-xs text-center text-slate-400 mt-4">
                        Ми використовуємо passwordless вхід. Просто введіть email.
                    </p>
                </form>
            </div>
        </div>
    );
};
