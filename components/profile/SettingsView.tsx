import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, ScrollView, Pressable, Modal, Alert, Linking, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, DESIGN } from '../../constants/theme';
import { GalleryText } from '../GalleryPrimitives';
import {
    ChevronLeft, ChevronRight, Bell, Moon, MapPin,
    Shield, HelpCircle, FileText, LogOut, User, Mail, Smartphone
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface SettingsViewProps {
    visible: boolean;
    onClose: () => void;
}

type SettingsScreen = 'MAIN' | 'PERSONAL_INFO' | 'PRIVACY' | 'HELP' | 'TERMS';

export const SettingsView: React.FC<SettingsViewProps> = ({ visible, onClose }) => {
    // Navigation State
    const [currentScreen, setCurrentScreen] = useState<SettingsScreen>('MAIN');

    // Preference State
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(true);
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);

    // Load Preferences on Mount
    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const notifs = await AsyncStorage.getItem('settings_notifications');
            const loc = await AsyncStorage.getItem('settings_location');
            const priv = await AsyncStorage.getItem('settings_private');

            if (notifs !== null) setNotificationsEnabled(JSON.parse(notifs));
            if (loc !== null) setLocationEnabled(JSON.parse(loc));
            if (priv !== null) setIsPrivate(JSON.parse(priv));
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    };

    const toggleSwitch = async (key: string, value: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setter(value);
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error("Failed to save setting", e);
        }
    };

    const togglePrivacy = async () => {
        const newValue = !isPrivate;
        toggleSwitch('settings_private', newValue, setIsPrivate);
        Alert.alert(
            newValue ? "Account Private" : "Account Public",
            newValue
                ? "Only approved followers can see your activity."
                : "Your profile is now visible to everyone."
        );
    };

    const handleLogOut = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out? This will clear your local session.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        // Simulate API Logout
                        setLoading(true);
                        setTimeout(async () => {
                            setLoading(false);
                            onClose();
                            // In a real app, you'd clear auth tokens here
                            // await AsyncStorage.clear(); 
                        }, 1000);
                    }
                }
            ]
        );
    };

    const navigateTo = (screen: SettingsScreen) => {
        Haptics.selectionAsync();
        setCurrentScreen(screen);
    };

    const goBack = () => {
        Haptics.selectionAsync();
        if (currentScreen === 'MAIN') {
            onClose();
        } else {
            setCurrentScreen('MAIN');
        }
    };

    if (!visible) return null;

    // RENDER CONTENT BASED ON SCREEN
    const renderContent = () => {
        switch (currentScreen) {
            case 'PERSONAL_INFO':
                return (
                    <View style={styles.subPageContainer}>
                        <View style={styles.inputGroup}>
                            <GalleryText type="micro" style={styles.inputLabel}>FULL NAME</GalleryText>
                            <TextInput style={styles.input} placeholder="Aissa" placeholderTextColor={COLORS.text.secondary} defaultValue="Aissa" />
                        </View>
                        <View style={styles.inputGroup}>
                            <GalleryText type="micro" style={styles.inputLabel}>USERNAME</GalleryText>
                            <TextInput style={styles.input} placeholder="@aissam" placeholderTextColor={COLORS.text.secondary} defaultValue="@aissam" />
                        </View>
                        <View style={styles.inputGroup}>
                            <GalleryText type="micro" style={styles.inputLabel}>EMAIL</GalleryText>
                            <TextInput style={styles.input} placeholder="email@example.com" placeholderTextColor={COLORS.text.secondary} defaultValue="aissa@example.com" keyboardType="email-address" />
                        </View>
                        <View style={styles.inputGroup}>
                            <GalleryText type="micro" style={styles.inputLabel}>PHONE</GalleryText>
                            <TextInput style={styles.input} placeholder="+1 (555) 000-0000" placeholderTextColor={COLORS.text.secondary} defaultValue="+1 (555) 123-4567" keyboardType="phone-pad" />
                        </View>
                        <GalleryText type="micro" style={styles.helperText}>These details are visible on your profile.</GalleryText>
                    </View>
                );
            case 'PRIVACY':
                return (
                    <View style={styles.subPageContainer}>
                        <View style={styles.groupContainer}>
                            <Pressable style={styles.row} onPress={togglePrivacy}>
                                <GalleryText type="body" style={styles.rowLabel}>Profile Visibility</GalleryText>
                                <GalleryText type="body" style={{ color: isPrivate ? COLORS.accents.bleuGrey : COLORS.text.secondary }}>
                                    {isPrivate ? 'Private' : 'Public'}
                                </GalleryText>
                            </Pressable>
                            <View style={styles.divider} />
                            <Pressable style={styles.row} onPress={() => navigateTo('BLOCKED')}>
                                <GalleryText type="body" style={styles.rowLabel}>Blocked Accounts</GalleryText>
                                <ChevronRight size={16} color={COLORS.text.secondary} />
                            </Pressable>
                        </View>
                        <GalleryText type="micro" style={styles.helperText}>
                            {isPrivate
                                ? "Your account is private. Only followers can see your activity."
                                : "Your account is public. Anyone can see your activity."}
                        </GalleryText>
                    </View>
                );
            case 'BLOCKED':
                return (
                    <View style={styles.subPageContainer}>
                        <View style={{ alignItems: 'center', marginTop: 60, opacity: 0.5 }}>
                            <Shield size={48} color={COLORS.text.secondary} />
                            <GalleryText type="body" style={{ marginTop: 16, color: COLORS.text.secondary }}>No blocked accounts</GalleryText>
                        </View>
                    </View>
                );
            case 'TERMS':
                return (
                    <ScrollView style={styles.subPageContainer}>
                        <GalleryText type="heading" style={{ marginBottom: 16 }}>Terms of Service</GalleryText>
                        <GalleryText type="body" style={{ color: COLORS.text.secondary, lineHeight: 22 }}>
                            Welcome to our app. By using our services, you agree to these terms. Please read them carefully. We reserve the right to suspend accounts that violate our community guidelines...
                        </GalleryText>
                    </ScrollView>
                );
            default: // MAIN
                return (
                    <>
                        {/* SECTION: ACCOUNT */}
                        <View style={styles.section}>
                            <GalleryText type="micro" style={styles.sectionHeader}>ACCOUNT</GalleryText>
                            <View style={styles.groupContainer}>
                                <Pressable style={styles.row} onPress={() => navigateTo('PERSONAL_INFO')}>
                                    <View style={styles.rowLeft}>
                                        <View style={[styles.iconBox, { backgroundColor: COLORS.accents.bleuGrey }]}>
                                            <User size={16} color="#FFF" />
                                        </View>
                                        <GalleryText type="body" style={styles.rowLabel}>Personal Information</GalleryText>
                                    </View>
                                    <ChevronRight size={16} color={COLORS.text.secondary} />
                                </Pressable>
                                <View style={styles.divider} />
                                <Pressable style={styles.row} onPress={() => navigateTo('PRIVACY')}>
                                    <View style={styles.rowLeft}>
                                        <View style={[styles.iconBox, { backgroundColor: COLORS.accents.mint }]}>
                                            <Shield size={16} color={COLORS.text.inverse} />
                                        </View>
                                        <GalleryText type="body" style={styles.rowLabel}>Privacy & Security</GalleryText>
                                    </View>
                                    <ChevronRight size={16} color={COLORS.text.secondary} />
                                </Pressable>
                            </View>
                        </View>

                        {/* SECTION: PREFERENCES */}
                        <View style={styles.section}>
                            <GalleryText type="micro" style={styles.sectionHeader}>PREFERENCES</GalleryText>
                            <View style={styles.groupContainer}>
                                {/* Notifications */}
                                <View style={styles.row}>
                                    <View style={styles.rowLeft}>
                                        <View style={[styles.iconBox, { backgroundColor: '#FF9500' }]}>
                                            <Bell size={16} color="#FFF" />
                                        </View>
                                        <GalleryText type="body" style={styles.rowLabel}>Notifications</GalleryText>
                                    </View>
                                    <Switch
                                        trackColor={{ false: "#767577", true: COLORS.accents.mint }}
                                        thumbColor={notificationsEnabled ? "#FFF" : "#f4f3f4"}
                                        ios_backgroundColor="#3e3e3e"
                                        onValueChange={(val) => toggleSwitch('settings_notifications', val, setNotificationsEnabled)}
                                        value={notificationsEnabled}
                                    />
                                </View>
                                <View style={styles.divider} />
                                {/* Location */}
                                <View style={styles.row}>
                                    <View style={styles.rowLeft}>
                                        <View style={[styles.iconBox, { backgroundColor: '#007AFF' }]}>
                                            <MapPin size={16} color="#FFF" />
                                        </View>
                                        <GalleryText type="body" style={styles.rowLabel}>Location Services</GalleryText>
                                    </View>
                                    <Switch
                                        trackColor={{ false: "#767577", true: COLORS.accents.mint }}
                                        thumbColor={locationEnabled ? "#FFF" : "#f4f3f4"}
                                        ios_backgroundColor="#3e3e3e"
                                        onValueChange={(val) => toggleSwitch('settings_location', val, setLocationEnabled)}
                                        value={locationEnabled}
                                    />
                                </View>
                                <View style={styles.divider} />
                                {/* Appearance */}
                                <View style={styles.row}>
                                    <View style={styles.rowLeft}>
                                        <View style={[styles.iconBox, { backgroundColor: '#333' }]}>
                                            <Moon size={16} color="#FFF" />
                                        </View>
                                        <GalleryText type="body" style={styles.rowLabel}>Dark Mode</GalleryText>
                                    </View>
                                    <Switch
                                        disabled={true} // Forced Dark Mode
                                        value={true}
                                        trackColor={{ false: "#767577", true: COLORS.text.secondary }}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* SECTION: SUPPORT */}
                        <View style={styles.section}>
                            <GalleryText type="micro" style={styles.sectionHeader}>SUPPORT</GalleryText>
                            <View style={styles.groupContainer}>
                                <Pressable style={styles.row} onPress={() => Linking.openURL('https://example.com/help')}>
                                    <View style={styles.rowLeft}>
                                        <View style={[styles.iconBox, { backgroundColor: COLORS.accents.lavender }]}>
                                            <HelpCircle size={16} color={COLORS.text.inverse} />
                                        </View>
                                        <GalleryText type="body" style={styles.rowLabel}>Help Center</GalleryText>
                                    </View>
                                    <ChevronRight size={16} color={COLORS.text.secondary} />
                                </Pressable>
                                <View style={styles.divider} />
                                <Pressable style={styles.row} onPress={() => navigateTo('TERMS')}>
                                    <View style={styles.rowLeft}>
                                        <View style={[styles.iconBox, { backgroundColor: '#8E8E93' }]}>
                                            <FileText size={16} color="#FFF" />
                                        </View>
                                        <GalleryText type="body" style={styles.rowLabel}>Terms & Privacy</GalleryText>
                                    </View>
                                    <ChevronRight size={16} color={COLORS.text.secondary} />
                                </Pressable>
                            </View>
                        </View>

                        {/* LOG OUT */}
                        <Pressable style={styles.logoutButton} onPress={handleLogOut}>
                            {loading ? (
                                <ActivityIndicator color="#FF3B30" />
                            ) : (
                                <>
                                    <LogOut size={18} color="#FF3B30" />
                                    <GalleryText type="body" style={styles.logoutText}>Log Out</GalleryText>
                                </>
                            )}
                        </Pressable>
                        <GalleryText type="micro" style={styles.versionText}>Version 1.0.0 (Build 2025.1)</GalleryText>
                        <View style={{ height: 50 }} />
                    </>
                );
        }
    };

    const getHeaderTitle = () => {
        switch (currentScreen) {
            case 'PERSONAL_INFO': return 'Personal Info';
            case 'PRIVACY': return 'Privacy';
            case 'BLOCKED': return 'Blocked Accounts';
            case 'TERMS': return 'Terms & Privacy';
            default: return 'Settings';
        }
    };

    return (
        <Modal
            animationType="slide"
            presentationStyle="pageSheet"
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        style={styles.backButton}
                        onPress={goBack}
                    >
                        <View style={styles.headerLeft}>
                            <ChevronLeft color={COLORS.text.primary} size={28} />
                            <GalleryText type="body" style={[styles.headerTitle, { marginLeft: 0 }]}>
                                {currentScreen === 'MAIN' ? '' : 'Back'}
                            </GalleryText>
                        </View>
                    </Pressable>

                    {/* Centered Title */}
                    <View style={StyleSheet.absoluteFill} pointerEvents="none" style={styles.headerCenter}>
                        <GalleryText type="body" style={styles.headerDisplayTitle}>{getHeaderTitle()}</GalleryText>
                    </View>

                    {/* Placeholder for symmetry */}
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {renderContent()}
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.canvas.porcelain,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backButton: {
        zIndex: 10,
        padding: 4,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerCenter: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 16, // Match padding top of header
    },
    headerTitle: {
        fontSize: 17,
        color: COLORS.text.primary,
    },
    headerDisplayTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        color: COLORS.text.secondary,
        marginBottom: 8,
        marginLeft: 12,
        fontSize: 12,
        letterSpacing: 1,
    },
    groupContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowLabel: {
        fontSize: 16,
        color: COLORS.text.primary,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginLeft: 58,
    },
    helperText: {
        color: COLORS.text.secondary,
        marginLeft: 12,
        marginTop: 8,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,59,48,0.1)',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        marginTop: 10,
    },
    logoutText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    },
    versionText: {
        textAlign: 'center',
        color: COLORS.text.secondary,
        marginTop: 24,
        opacity: 0.5,
    },
    // Sub-Page Styles
    subPageContainer: {
        paddingTop: 8,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        color: COLORS.text.secondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        color: COLORS.text.primary,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
});
