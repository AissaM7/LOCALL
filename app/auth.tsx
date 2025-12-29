import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
    ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Required for OAuth
WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'signin' | 'signup';

const AUTH_SEEN_KEY = '@locall_auth_seen';
const AUTH_SKIPPED_KEY = '@locall_auth_skipped';

export default function AuthScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [mode, setMode] = useState<AuthMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<string | null>(null);

    // Get redirect URL for OAuth
    const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'locall',
        path: 'auth/callback',
    });

    const markAuthComplete = async () => {
        await AsyncStorage.setItem(AUTH_SEEN_KEY, 'true');
    };

    const handleEmailAuth = async () => {
        if (!email || !password) {
            Alert.alert('Missing Fields', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: redirectUrl,
                    },
                });
                if (error) throw error;
                Alert.alert(
                    'Check your email',
                    'We sent you a confirmation link. Please check your email to verify your account.',
                    [{ text: 'OK', onPress: () => setMode('signin') }]
                );
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                await markAuthComplete();
                router.replace('/');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'facebook') => {
        setOauthLoading(provider);
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;
            if (data.url) {
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUrl
                );

                if (result.type === 'success') {
                    const url = result.url;
                    const params = new URLSearchParams(url.split('#')[1]);
                    const access_token = params.get('access_token');
                    const refresh_token = params.get('refresh_token');

                    if (access_token && refresh_token) {
                        await supabase.auth.setSession({
                            access_token,
                            refresh_token,
                        });
                        await markAuthComplete();
                        router.replace('/');
                    }
                }
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setOauthLoading(null);
        }
    };

    const handleGuestMode = async () => {
        setLoading(true);
        try {
            // Set skip flag FIRST so the router knows to let us through
            await AsyncStorage.setItem(AUTH_SKIPPED_KEY, 'true');

            // Sign out and sign in anonymously
            await supabase.auth.signOut();
            const { error } = await supabase.auth.signInAnonymously();
            if (error) throw error;

            // Navigate to main app
            router.replace('/');
        } catch (error: any) {
            // Remove skip flag if something went wrong
            await AsyncStorage.removeItem(AUTH_SKIPPED_KEY);
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../assets/auth-background.jpg')}
            style={styles.container}
            resizeMode="cover"
        >
            {/* Dark overlay for readability */}
            <View style={styles.overlay} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.keyboardView, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo & Welcome */}
                    <View style={styles.header}>
                        <Text style={styles.logo}>Locall</Text>
                        <Text style={styles.tagline}>Creating the Third Space</Text>
                    </View>

                    {/* Social Login Buttons */}
                    <View style={styles.socialSection}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.socialButton,
                                styles.appleButton,
                                pressed && styles.buttonPressed,
                            ]}
                            onPress={() => handleOAuthSignIn('apple')}
                            disabled={oauthLoading !== null}
                        >
                            {oauthLoading === 'apple' ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="logo-apple" size={22} color="#fff" />
                                    <Text style={styles.socialButtonTextLight}>Continue with Apple</Text>
                                </>
                            )}
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.socialButton,
                                styles.googleButton,
                                pressed && styles.buttonPressed,
                            ]}
                            onPress={() => handleOAuthSignIn('google')}
                            disabled={oauthLoading !== null}
                        >
                            {oauthLoading === 'google' ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <>
                                    <Ionicons name="logo-google" size={20} color="#4285F4" />
                                    <Text style={styles.socialButtonTextDark}>Continue with Google</Text>
                                </>
                            )}
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.socialButton,
                                styles.instagramButton,
                                pressed && styles.buttonPressed,
                            ]}
                            onPress={() => handleOAuthSignIn('facebook')}
                            disabled={oauthLoading !== null}
                        >
                            {oauthLoading === 'facebook' ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="logo-instagram" size={22} color="#fff" />
                                    <Text style={styles.socialButtonTextLight}>Continue with Instagram</Text>
                                </>
                            )}
                        </Pressable>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Mode Toggle */}
                    <View style={styles.modeToggle}>
                        <Pressable
                            style={[styles.modeButton, mode === 'signin' && styles.modeButtonActive]}
                            onPress={() => setMode('signin')}
                        >
                            <Text style={[styles.modeButtonText, mode === 'signin' && styles.modeButtonTextActive]}>
                                Sign In
                            </Text>
                        </Pressable>
                        <Pressable
                            style={[styles.modeButton, mode === 'signup' && styles.modeButtonActive]}
                            onPress={() => setMode('signup')}
                        >
                            <Text style={[styles.modeButtonText, mode === 'signup' && styles.modeButtonTextActive]}>
                                Sign Up
                            </Text>
                        </Pressable>
                    </View>

                    {/* Email/Password Form */}
                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        />

                        <Pressable
                            style={({ pressed }) => [
                                styles.submitButton,
                                pressed && styles.buttonPressed,
                                loading && styles.buttonDisabled,
                            ]}
                            onPress={handleEmailAuth}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={[COLORS.accents.hotPink, '#FF6B9D']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitButtonGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>
                                        {mode === 'signin' ? 'Sign In' : 'Create Account'}
                                    </Text>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </View>

                    {/* Guest Mode */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.guestButton,
                            pressed && { opacity: 0.7 },
                        ]}
                        onPress={handleGuestMode}
                        disabled={loading}
                    >
                        <Text style={styles.guestButtonText}>Skip and browse as guest →</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        fontSize: 52,
        fontWeight: '300',
        color: '#FFFFFF',
        letterSpacing: 8,
        marginBottom: 12,
        textTransform: 'uppercase',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 12,
    },
    tagline: {
        fontSize: 17,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        fontWeight: '500',
    },
    socialSection: {
        gap: 12,
        marginBottom: 24,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 12,
    },
    appleButton: {
        backgroundColor: '#000000',
    },
    googleButton: {
        backgroundColor: '#FFFFFF',
    },
    instagramButton: {
        backgroundColor: '#E1306C',
    },
    appleIcon: {
        fontSize: 20,
        color: '#fff',
    },
    googleIcon: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4285F4',
    },
    instagramIcon: {
        fontSize: 18,
    },
    socialButtonTextLight: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    socialButtonTextDark: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    buttonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    dividerText: {
        color: 'rgba(255,255,255,0.6)',
        paddingHorizontal: 16,
        fontSize: 14,
        fontWeight: '500',
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 14,
        padding: 4,
        marginBottom: 16,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    modeButtonActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    modeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
    },
    modeButtonTextActive: {
        color: '#fff',
    },
    form: {
        gap: 12,
        marginBottom: 28,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 18,
        fontSize: 16,
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    submitButton: {
        marginTop: 6,
        borderRadius: 16,
        overflow: 'hidden',
    },
    submitButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    guestButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    guestButtonText: {
        fontSize: 15,
        color: COLORS.accents.mint,
        fontWeight: '600',
    },
});
