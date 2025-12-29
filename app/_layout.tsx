import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { COLORS } from '../constants/theme';
import EventsProvider from '../context/EventsContext';
import { UserProvider, useUser } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const AUTH_SKIPPED_KEY = '@locall_auth_skipped';
const AUTH_SEEN_KEY = '@locall_auth_seen';

function AuthRouter({ children }: { children: React.ReactNode }) {
    const { session, isAuthenticated, isGuest, authLoading } = useUser();
    const router = useRouter();
    const segments = useSegments();
    const [hasSkipped, setHasSkipped] = useState<boolean>(false);
    const [hasSeenAuth, setHasSeenAuth] = useState<boolean>(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Clear skip flag on app startup so guests see auth on fresh opens
    useEffect(() => {
        const clearSkipOnStartup = async () => {
            await AsyncStorage.removeItem(AUTH_SKIPPED_KEY);
        };
        clearSkipOnStartup();
    }, []);

    // Check stored auth state on mount
    useEffect(() => {
        const checkAuthState = async () => {
            try {
                const [skipped, seen] = await Promise.all([
                    AsyncStorage.getItem(AUTH_SKIPPED_KEY),
                    AsyncStorage.getItem(AUTH_SEEN_KEY),
                ]);
                setHasSkipped(skipped === 'true');
                setHasSeenAuth(seen === 'true');
            } catch (e) {
                console.log('Error checking auth state:', e);
            } finally {
                setCheckingAuth(false);
            }
        };
        checkAuthState();
    }, []);

    // Listen for storage changes (when user clicks skip)
    useEffect(() => {
        const checkSkipped = async () => {
            const skipped = await AsyncStorage.getItem(AUTH_SKIPPED_KEY);
            if (skipped === 'true') {
                setHasSkipped(true);
            }
        };

        // Check periodically for skip state changes
        const interval = setInterval(checkSkipped, 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (authLoading || checkingAuth) return;

        const inAuthGroup = segments[0] === 'auth';

        // Determine if we should show auth:
        // - No session at all → show auth
        // - Authenticated (not guest) and has completed auth before → go to app
        // - Guest who has skipped during this session → go to app
        // - Guest who hasn't skipped → show auth

        let shouldShowAuth = false;

        if (!session) {
            // No session → show auth
            shouldShowAuth = true;
        } else if (isAuthenticated && !isGuest) {
            // Real authenticated user → skip auth
            shouldShowAuth = false;
        } else if (isGuest) {
            // Guest → check if they've skipped
            shouldShowAuth = !hasSkipped;
        }

        if (shouldShowAuth && !inAuthGroup) {
            router.replace('/auth');
        } else if (!shouldShowAuth && inAuthGroup) {
            router.replace('/');
        }
    }, [session, isAuthenticated, isGuest, authLoading, checkingAuth, hasSkipped, segments]);

    if (authLoading || checkingAuth) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.canvas.porcelain }}>
                <ActivityIndicator size="large" color={COLORS.accents.hotPink} />
            </View>
        );
    }

    return <>{children}</>;
}

function RootLayoutNav() {
    return (
        <AuthRouter>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: COLORS.canvas.porcelain },
                    animation: 'fade',
                    animationDuration: 300,
                }}
            >
                <Stack.Screen
                    name="auth"
                    options={{
                        gestureEnabled: false,
                        animation: 'fade',
                        animationDuration: 200,
                    }}
                />
                <Stack.Screen
                    name="index"
                    options={{
                        animation: 'fade',
                        animationDuration: 300,
                    }}
                />
                <Stack.Screen name="my-moves" options={{ presentation: 'card' }} />
            </Stack>
        </AuthRouter>
    );
}

export default function RootLayout() {
    const [loaded, error] = useFonts({
        // Placeholder for custom fonts
    });

    const [fontsLoaded] = useFonts({
        'Inter-Regular': Inter_400Regular,
        'Inter-Medium': Inter_500Medium,
        'Inter-Bold': Inter_700Bold,
        'Outfit-Bold': Outfit_700Bold,
    });

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <UserProvider>
            <EventsProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <StatusBar style="light" backgroundColor={COLORS.canvas.porcelain} />
                    <RootLayoutNav />
                </GestureHandlerRootView>
            </EventsProvider>
        </UserProvider>
    );
}
