import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import { Session, User } from '@supabase/supabase-js';

interface UserProfile {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
}

interface UserContextType {
    // Auth state
    session: Session | null;
    user: User | null;
    isAuthenticated: boolean;
    isGuest: boolean;
    authLoading: boolean;

    // Profile
    profile: UserProfile | null;
    loading: boolean;

    // Methods
    updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Diverse Avatar Seeds
const AVATAR_SEEDS = [
    'Stacy', 'Ahmed', 'Yuki', 'Kofi', 'Maria', 'Chen', 'Raj', 'Aisha',
    'Olga', 'Diego', 'Sven', 'Fatima', 'Lars', 'Mei', 'Zarah', 'Liam',
    'Noah', 'Emma', 'Ivy', 'Kai', 'Ali', 'Omar', 'Nina', 'Zion',
    'Raya', 'Malik', 'Amara', 'Kenji', 'Hana', 'Luca', 'Maya', 'Zane',
    'Finn', 'Elena', 'Oscar', 'Chloe', 'Max', 'Luna', 'Leo', 'Sofia'
];

export const CURATED_AVATARS = AVATAR_SEEDS.map(seed => `https://api.dicebear.com/9.x/fun-emoji/png?seed=${seed}`);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);

    // Check if user is authenticated (not anonymous)
    const isAuthenticated = !!session && !session.user.is_anonymous;
    const isGuest = !!session?.user.is_anonymous;

    // Listen for auth state changes
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setAuthLoading(false);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth event:', event);
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                    setLoading(false);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            setLoading(true);

            const { data, error } = await (supabase.from('profiles') as any)
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setProfile({
                    id: data.id,
                    username: data.username,
                    full_name: data.full_name,
                    avatar_url: data.avatar_url,
                    bio: data.bio || '',
                });
            } else {
                // Create profile if doesn't exist
                const randomAvatar = CURATED_AVATARS[Math.floor(Math.random() * CURATED_AVATARS.length)];
                const { error: insertError } = await (supabase.from('profiles') as any).insert({
                    id: userId,
                    username: `user_${userId.substring(0, 8)}`,
                    avatar_url: randomAvatar,
                });
                if (!insertError) {
                    await fetchProfile(userId);
                    return;
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        try {
            if (!profile) return false;

            const { error } = await (supabase.from('profiles') as any)
                .update({
                    username: updates.username || undefined,
                    full_name: updates.full_name || undefined,
                    avatar_url: updates.avatar_url || undefined,
                    bio: updates.bio || undefined,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', profile.id);

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            console.log('Profile updated successfully:', updates);
            setProfile(prev => prev ? { ...prev, ...updates } : null);
            return true;
        } catch (error: any) {
            console.error('Update Profile Exception:', error);
            Alert.alert('Update Failed', error.message);
            return false;
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setSession(null);
            setUser(null);
            setProfile(null);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    return (
        <UserContext.Provider value={{
            session,
            user,
            isAuthenticated,
            isGuest,
            authLoading,
            profile,
            loading,
            updateProfile,
            refreshProfile,
            signOut,
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
