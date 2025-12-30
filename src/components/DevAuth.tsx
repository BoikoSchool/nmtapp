import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export const DevAuth = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        // OTP login for simplicity in dev
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) alert(error.message);
        else alert('Check your email for the magic link!');
        setLoading(false);
    };

    return (
        <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg mb-8">
            <p className="text-xs font-bold text-yellow-700 uppercase mb-2">Dev Auth (Temporary)</p>
            <div className="flex gap-2">
                <input
                    className="border p-2 rounded text-sm"
                    placeholder="Enter email to login..."
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <button onClick={handleLogin} disabled={loading} className="bg-yellow-500 text-white px-4 py-2 rounded text-sm font-bold">
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Magic Link'}
                </button>
            </div>
        </div>
    );
};
