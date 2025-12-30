import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Mail } from 'lucide-react';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);


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
