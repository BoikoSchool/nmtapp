import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            checkAdmin(session?.user);
            setLoading(false);
        });

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            checkAdmin(session?.user);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAdmin = async (currentUser: User | null | undefined) => {
        if (!currentUser) {
            setIsAdmin(false);
            return;
        }
        // Check if user has 'admin' role in profiles table
        // Note: We sync auth.users meta to profiles, but let's query profiles to be sure
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single();

        setIsAdmin(data?.role === 'admin');
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, isAdmin, signOut }}>
            {!loading ? children : (
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                </div>
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
