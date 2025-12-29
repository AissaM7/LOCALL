import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, Dimensions, Modal, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';

import { COLORS, DESIGN, EVENT_FONTS } from '../../constants/theme';
import { GalleryText } from '../GalleryPrimitives';
import { SettingsView } from './SettingsView';
import { TicketCard } from './TicketCard';
import {
    Settings, Edit2, Share, Calendar, MapPin, ChevronLeft, ChevronRight, Ticket, Camera, Check, X as CloseIcon, HelpCircle
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useUser, CURATED_AVATARS } from '../../context/UserContext';
import { useEvents } from '../../context/EventsContext';

import { EventData } from '../../constants/events';

interface ProfileMenuProps {
    visible: boolean;
    onClose: () => void;
    onFindEvents?: () => void;
    onCreateEvent?: () => void;
    onEventSelect?: (event: EventData) => void;
}

const { width } = Dimensions.get('window');

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ visible, onClose, onFindEvents, onCreateEvent, onEventSelect }) => {
    const { profile, updateProfile, loading: userLoading } = useUser();
    const { myMoves, savedEvents } = useEvents(); // Destructure savedEvents
    const router = useRouter();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSelectingAvatar, setIsSelectingAvatar] = useState(false);
    const [isPastStackExpanded, setIsPastStackExpanded] = useState(false);

    // Form state
    const [editHandle, setEditHandle] = useState('');
    const [editFullName, setEditFullName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('');

    // Sort events into upcoming and past (GO)
    const now = new Date();
    const upcomingEvents = myMoves.filter(e => e.startTime && e.startTime >= now).sort((a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0));
    const pastEvents = myMoves.filter(e => e.startTime && e.startTime < now).sort((a, b) => (b.startTime?.getTime() || 0) - (a.startTime?.getTime() || 0));

    // Sort saved events (MAYBE)
    const maybeEvents = savedEvents.filter(e => e.startTime && e.startTime >= now).sort((a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0));

    useEffect(() => {
        if (profile) {
            setEditHandle(profile.username || '');
            setEditFullName(profile.full_name || '');
            setEditBio(profile.bio || '');
            setSelectedAvatar(profile.avatar_url || CURATED_AVATARS[0]);
        }
    }, [profile, visible]);

    const handleSave = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const success = await updateProfile({
            username: editHandle,
            full_name: editFullName,
            bio: editBio,
            avatar_url: selectedAvatar
        });
        if (success) {
            setIsEditing(false);
        }
    };

    if (!visible) return null;

    const currentAvatar = selectedAvatar || profile?.avatar_url || CURATED_AVATARS[0];
    const OPTION_SIZE = (width - 48 - 36) / 4;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1E0030' }]} />
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <View style={{
                        position: 'absolute', top: -100, left: -100,
                        width: width + 200, height: width + 200,
                        borderRadius: (width + 200) / 2,
                        backgroundColor: '#FF007F',
                        opacity: 0.15
                    }} />
                    <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
                </View>

                <View style={styles.safeArea}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable
                            style={styles.backButton}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                if (isEditing) {
                                    setIsEditing(false);
                                } else {
                                    onClose();
                                }
                            }}
                        >
                            <ChevronLeft color={COLORS.text.primary} size={28} />
                        </Pressable>

                        <View style={styles.headerTitleContainer}>
                            <GalleryText type="heading" style={[styles.headerTitle, EVENT_FONTS.sleek]}>
                                {isEditing ? 'Edit Profile' : 'Profile'}
                            </GalleryText>
                        </View>

                        <Pressable style={styles.iconButton} onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            if (isEditing) {
                                handleSave();
                            } else {
                                setIsSettingsOpen(true);
                            }
                        }}>
                            {isEditing ? (
                                <Check color={COLORS.accents.mint} size={28} />
                            ) : (
                                <Settings color={COLORS.text.primary} size={24} />
                            )}
                        </Pressable>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        bounces={false}
                    >
                        {/* HERO SECTION */}
                        <View style={styles.hero}>
                            <Pressable
                                style={styles.avatarContainer}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    setIsSelectingAvatar(true);
                                }}
                            >
                                <View style={styles.avatarWrapper}>
                                    {currentAvatar.startsWith('http') ? (
                                        <Image source={{ uri: currentAvatar }} style={styles.avatar} />
                                    ) : (
                                        <View style={[styles.avatar, styles.emojiAvatar]}>
                                            <GalleryText style={{ fontSize: 60 }}>{currentAvatar}</GalleryText>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.editBadge}>
                                    <Camera size={18} color="#FFF" />
                                </View>
                            </Pressable>

                            {isEditing ? (
                                <View style={styles.editForm}>
                                    <TextInput
                                        style={[styles.editInput, styles.nameInput, EVENT_FONTS.phosphate]}
                                        value={editFullName}
                                        onChangeText={setEditFullName}
                                        placeholder="Your Name"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                    />
                                    <TextInput
                                        style={[styles.editInput, styles.handleInput, EVENT_FONTS.digital]}
                                        value={editHandle}
                                        onChangeText={setEditHandle}
                                        placeholder="@handle"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        autoCapitalize="none"
                                    />
                                    <TextInput
                                        style={[styles.editInput, styles.bioInput]}
                                        value={editBio}
                                        onChangeText={setEditBio}
                                        placeholder="Tell us about yourself..."
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>
                            ) : (
                                <>
                                    <GalleryText type="heading" style={[styles.heroName, EVENT_FONTS.phosphate]}>
                                        {profile?.full_name || 'Anonymous'}
                                    </GalleryText>
                                    <GalleryText type="body" style={[styles.handle, EVENT_FONTS.digital]}>
                                        @{profile?.username || 'user'}
                                    </GalleryText>
                                    {profile?.bio && (
                                        <GalleryText type="body" style={styles.bioText}>
                                            {profile.bio}
                                        </GalleryText>
                                    )}

                                    <View style={styles.actionButtons}>
                                        <Pressable
                                            style={[styles.pillButton, { backgroundColor: COLORS.accents.bleuGrey, borderColor: COLORS.accents.bleuGrey }]}
                                            onPress={() => setIsEditing(true)}
                                        >
                                            <GalleryText type="body" style={[styles.pillText, { color: '#FFF' }]}>Edit Profile</GalleryText>
                                        </Pressable>
                                        <Pressable style={styles.pillButton} onPress={() => { }}>
                                            <GalleryText type="body" style={styles.pillText}>Share</GalleryText>
                                        </Pressable>
                                    </View>
                                </>
                            )}
                        </View>

                        {!isEditing && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <GalleryText type="heading" style={[styles.sectionTitle, EVENT_FONTS.sleek]}>My Plans</GalleryText>
                                    <ChevronRight color={COLORS.text.secondary} size={20} />
                                </View>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletScroll}>
                                    {/* Upcoming events first */}
                                    {upcomingEvents.map((event) => (
                                        <TicketCard
                                            key={event.id}
                                            event={event}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                onClose();
                                                onEventSelect?.(event);
                                            }}
                                        />
                                    ))}

                                    {/* Empty state if no events at all */}
                                    {upcomingEvents.length === 0 && pastEvents.length === 0 && (
                                        <View style={styles.emptyWallet}>
                                            <Ticket color={COLORS.text.secondary} size={32} />
                                            <GalleryText type="micro" style={{ marginTop: 12, color: COLORS.text.secondary }}>NO PLANS YET</GalleryText>
                                        </View>
                                    )}

                                    {/* Find Plans button */}
                                    <Pressable style={styles.findPlansTicket} onPress={onFindEvents}>
                                        <View style={[styles.findPlansNotch, styles.findPlansLeftNotch]} />
                                        <View style={styles.findPlansContent}>
                                            <Ticket size={24} color="#000" strokeWidth={2.5} />
                                            <GalleryText style={styles.findPlansText}>FIND</GalleryText>
                                            <GalleryText style={styles.findPlansText}>PLANS</GalleryText>
                                        </View>
                                        <View style={[styles.findPlansNotch, styles.findPlansRightNotch]} />
                                    </Pressable>

                                    {/* Past events - Collapsible Stack */}
                                    {pastEvents.length > 0 && (
                                        <>
                                            {isPastStackExpanded ? (
                                                // Expanded: show all past tickets with collapse button first
                                                <>
                                                    <Pressable
                                                        style={styles.collapseStackButton}
                                                        onPress={() => {
                                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                            setIsPastStackExpanded(false);
                                                        }}
                                                    >
                                                        <GalleryText style={styles.collapseStackText}>← COLLAPSE</GalleryText>
                                                    </Pressable>
                                                    {pastEvents.map((event) => (
                                                        <TicketCard
                                                            key={event.id}
                                                            event={event}
                                                            onPress={() => {
                                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                                onClose();
                                                                onEventSelect?.(event);
                                                            }}
                                                        />
                                                    ))}
                                                </>
                                            ) : (
                                                // Collapsed: compact stacked tickets
                                                <Pressable
                                                    style={styles.compactStackContainer}
                                                    onPress={() => {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                        setIsPastStackExpanded(true);
                                                    }}
                                                >
                                                    {/* Stacked cards behind */}
                                                    {pastEvents.length > 2 && (
                                                        <View style={[styles.compactStackCard, { top: 8, left: 8 }]} />
                                                    )}
                                                    {pastEvents.length > 1 && (
                                                        <View style={[styles.compactStackCard, { top: 4, left: 4 }]} />
                                                    )}

                                                    {/* Front card */}
                                                    <View style={styles.compactFrontCard}>
                                                        <View style={styles.compactNotchLeft} />
                                                        <View style={styles.compactCardContent}>
                                                            <GalleryText style={styles.compactPastLabel}>PAST</GalleryText>
                                                            <GalleryText style={styles.compactEventCount}>
                                                                {pastEvents.length} {pastEvents.length === 1 ? 'event' : 'events'}
                                                            </GalleryText>
                                                            <GalleryText style={styles.compactTapHint}>Tap to view</GalleryText>
                                                        </View>
                                                        <View style={styles.compactNotchRight} />
                                                    </View>
                                                </Pressable>
                                            )}
                                        </>
                                    )}
                                </ScrollView>
                            </View>
                        )}

                        {/* MAYBE SECTION */}
                        {!isEditing && maybeEvents.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <HelpCircle color={COLORS.accents.mint} size={20} strokeWidth={2.5} />
                                        <GalleryText type="heading" style={[styles.sectionTitle, EVENT_FONTS.sleek]}>Maybe</GalleryText>
                                    </View>
                                    <ChevronRight color={COLORS.text.secondary} size={20} />
                                </View>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletScroll}>
                                    {maybeEvents.map((event) => (
                                        <TicketCard
                                            key={event.id}
                                            event={event}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                onClose();
                                                onEventSelect?.(event);
                                            }}
                                        />
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* HOST AN EVENT */}
                        {!isEditing && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <GalleryText type="heading" style={[styles.sectionTitle, EVENT_FONTS.sleek]}>Host an Event</GalleryText>
                                </View>

                                <View style={styles.hostCard}>
                                    <View style={styles.hostIconContainer}>
                                        <Calendar size={32} color={COLORS.accents.hotPink} />
                                    </View>
                                    <View style={styles.hostContent}>
                                        <GalleryText style={styles.hostTitle}>Create Your Own Experience</GalleryText>
                                        <Pressable style={styles.getStartedButton} onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            onCreateEvent?.();
                                        }}>
                                            <GalleryText style={styles.getStartedText}>Get Started</GalleryText>
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        )}

                        <View style={{ height: 100 }} />
                    </ScrollView>
                </View>

                {/* Avatar Selection Overlay */}
                <Modal visible={isSelectingAvatar} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsSelectingAvatar(false)}>
                            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                        </Pressable>

                        <View style={styles.avatarPickerContainer}>
                            <View style={styles.pickerHeader}>
                                <GalleryText type="heading" style={styles.pickerTitle}>Choose Avatar</GalleryText>
                                <Pressable
                                    onPress={() => setIsSelectingAvatar(false)}
                                    style={styles.closePickerButton}
                                >
                                    <CloseIcon color="#FFF" size={20} />
                                </Pressable>
                            </View>

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.avatarGrid}
                            >
                                {CURATED_AVATARS.map((item, idx) => (
                                    <Pressable
                                        key={idx}
                                        style={[
                                            styles.avatarOption,
                                            selectedAvatar === item && styles.avatarOptionSelected
                                        ]}
                                        onPress={() => {
                                            setSelectedAvatar(item);
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                    >
                                        <Image source={{ uri: item }} style={styles.pickerImage} />
                                    </Pressable>
                                ))}
                            </ScrollView>

                            <Pressable
                                style={styles.applyButton}
                                onPress={async () => {
                                    setIsSelectingAvatar(false);
                                    if (selectedAvatar !== profile?.avatar_url) {
                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        await updateProfile({ avatar_url: selectedAvatar });
                                    }
                                }}
                            >
                                <GalleryText style={styles.applyButtonText}>Apply</GalleryText>
                            </Pressable>
                        </View>
                    </View>
                </Modal>
            </View>

            <SettingsView
                visible={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.canvas.porcelain,
    },
    safeArea: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        color: COLORS.text.primary,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    iconButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    hero: {
        alignItems: 'center',
        marginBottom: 48,
        paddingHorizontal: 24,
    },
    avatarContainer: {
        width: 140,
        height: 140,
        marginBottom: 24,
        position: 'relative',
    },
    avatarWrapper: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        borderColor: COLORS.accents.bleuGrey,
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        ...DESIGN.shadows.softHigh,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 65,
    },
    emojiAvatar: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    editBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: COLORS.accents.hotPink,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#1E0030',
        zIndex: 10,
    },
    heroName: {
        fontSize: 42,
        color: COLORS.text.primary,
        marginBottom: 4,
        textAlign: 'center',
    },
    handle: {
        color: COLORS.accents.hotPink,
        marginBottom: 16,
        fontSize: 16,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    bioText: {
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: 24,
        fontSize: 15,
        lineHeight: 22,
        paddingHorizontal: 30,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    pillButton: {
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    pillText: {
        color: COLORS.text.primary,
        fontSize: 15,
        fontWeight: '700',
    },

    // EDIT FORM
    editForm: {
        width: '100%',
        gap: 16,
    },
    editInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        color: '#FFF',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    nameInput: {
        fontSize: 24,
        textAlign: 'center',
    },
    handleInput: {
        fontSize: 16,
        textAlign: 'center',
        color: COLORS.accents.hotPink,
    },
    bioInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },

    // SECTIONS
    section: {
        marginBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 26,
        color: COLORS.text.primary,
    },
    walletScroll: {
        paddingHorizontal: 24,
        gap: 16,
    },
    emptyWallet: {
        width: 260,
        height: 160,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    addTicketCard: {
        paddingHorizontal: 24,
        height: 140,
        borderRadius: 16,
        backgroundColor: COLORS.accents.mint,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Find Plans Ticket Button - Clean symmetric design
    findPlansTicket: {
        width: 120,
        height: 140,
        backgroundColor: COLORS.accents.mint,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
        position: 'relative',
    },
    findPlansNotch: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#1E0030',
        top: (140 - 20) / 2,
    },
    findPlansLeftNotch: {
        left: -10,
    },
    findPlansRightNotch: {
        right: -10,
    },
    findPlansContent: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    findPlansText: {
        color: '#000',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    // Past Stack Styles
    pastStackContainer: {
        width: 310,
        height: 160,
        position: 'relative',
        marginLeft: 16,
    },
    // Compact Stack Styles
    compactStackContainer: {
        width: 130,
        height: 140,
        position: 'relative',
        marginLeft: 12,
    },
    compactStackCard: {
        position: 'absolute',
        width: 110,
        height: 120,
        backgroundColor: '#1a1a1a',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    compactFrontCard: {
        width: 110,
        height: 120,
        backgroundColor: '#2a2a2a',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'visible',
        position: 'relative',
    },
    compactNotchLeft: {
        position: 'absolute',
        left: -8,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#1E0030',
    },
    compactNotchRight: {
        position: 'absolute',
        right: -8,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#1E0030',
    },
    compactCardContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    compactPastLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 6,
    },
    compactEventCount: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    compactTapHint: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 9,
        fontWeight: '600',
    },
    // Old stack styles (keeping for reference)
    stackedBgCard: {
        position: 'absolute',
        width: 280,
        height: 130,
        backgroundColor: '#252525',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    stackCard2: {
        top: 6,
        left: 8,
        opacity: 0.7,
    },
    stackCard3: {
        top: 12,
        left: 16,
        opacity: 0.5,
    },
    dimmedTicket: {
        opacity: 0.85,
    },
    frontTicketWrapper: {
        position: 'relative',
    },
    pastBadgeOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
    },
    pastBadgeText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    pastBadgeCount: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 9,
        fontWeight: '600',
        marginTop: 2,
    },
    stackedTicket: {
        position: 'absolute',
        width: 100,
        height: 130,
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    stackedTicketInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    stackedTicketText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    stackedTicketCount: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
    },
    collapseStackButton: {
        width: 100,
        height: 140,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    collapseStackText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    ticketCard: {
        width: 260,
        height: 140,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#1E1E1E',
        flexDirection: 'row',
    },
    ticketImageSide: {
        width: 100,
        height: '100%',
        overflow: 'hidden',
    },
    ticketImage: {
        width: '100%',
        height: '100%',
    },
    ticketPerforation: {
        width: 16,
        backgroundColor: '#1E1E1E',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingVertical: 8,
    },
    perforationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#0a0a0a',
    },
    ticketDetails: {
        flex: 1,
        padding: 14,
        justifyContent: 'center',
    },
    ticketTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    ticketDate: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontWeight: '500',
    },

    // HOST SECTION
    hostCard: {
        marginHorizontal: 24,
        borderRadius: 20,
        overflow: 'hidden',
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#2a1520',
        borderWidth: 1,
        borderColor: 'rgba(255,0,127,0.3)',
    },
    hostIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    hostContent: {
        flex: 1,
        justifyContent: 'center',
    },
    hostTitle: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 12,
    },
    getStartedButton: {
        backgroundColor: COLORS.accents.hotPink,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    getStartedText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },

    // AVATAR PICKER
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    avatarPickerContainer: {
        backgroundColor: '#1E0030',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 24,
        paddingTop: 32,
        maxHeight: '85%',
        ...DESIGN.shadows.softHigh,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        paddingHorizontal: 8,
    },
    pickerTitle: {
        fontSize: 28,
        color: '#FFF',
        fontWeight: '800',
    },
    closePickerButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 12,
        paddingBottom: 100,
    },
    avatarOption: {
        width: (width - 48 - 36) / 4,
        aspectRatio: 1,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    avatarOptionSelected: {
        borderColor: '#FF007F',
        backgroundColor: 'rgba(255,0,127,0.15)',
        borderWidth: 3,
    },
    pickerImage: {
        width: '100%',
        height: '100%',
        borderRadius: 18,
    },
    applyButton: {
        position: 'absolute',
        bottom: 34,
        left: 24,
        right: 24,
        backgroundColor: '#FF007F',
        borderRadius: 24,
        paddingVertical: 20,
        alignItems: 'center',
        ...DESIGN.shadows.softHigh,
    },
    applyButtonText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
