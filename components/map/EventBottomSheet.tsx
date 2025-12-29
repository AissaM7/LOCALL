import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Image, Pressable, Dimensions, Share, Linking, Platform } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MeshBackground } from '../MeshBackground';
import { COLORS, DESIGN, EVENT_FONTS } from '../../constants/theme';
import { GalleryText } from '../GalleryPrimitives';
import { useEvents } from '../../context/EventsContext';
import { EventData } from '../../constants/events';
import { MapPin, Calendar, Check, X as XIcon, HelpCircle, MessageSquare, Share as ShareIcon, Clock, ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { PublicLounge } from '../chat/PublicLounge';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EventBottomSheetProps {
    event: EventData | null;
    onClose: () => void;
    initialTab?: 'info' | 'chat';
    onBack?: () => void;
}

const RSVPButton = ({
    label,
    icon,
    isActive,
    onPress,
    activeColor,
    defaultColor = 'rgba(255,255,255,0.05)'
}: {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onPress: () => void;
    activeColor: string;
    defaultColor?: string;
}) => (
    <Pressable
        style={({ pressed }) => [
            styles.rsvpButton,
            { backgroundColor: isActive ? activeColor : defaultColor },
            isActive && { borderColor: activeColor },
            pressed && { transform: [{ scale: 0.96 }] }
        ]}
        onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
        }}
    >
        <View style={[styles.rsvpIcon, isActive && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            {icon}
        </View>
        <GalleryText style={[
            styles.rsvpLabel,
            isActive && { color: '#000', fontWeight: '800' }
        ]}>
            {label}
        </GalleryText>
    </Pressable>
);

export const EventBottomSheet: React.FC<EventBottomSheetProps> = ({ event, onClose, initialTab = 'info', onBack }) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['50%', '96%'], []);
    const insets = useSafeAreaInsets();

    const { toggleRSVP, toggleSaved, isLockedIn, isSaved } = useEvents();
    const lockedIn = event ? isLockedIn(event.id) : false;
    const saved = event ? isSaved(event.id) : false;

    const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');

    useEffect(() => {
        if (event) {
            // Re-snap to top on every new event select
            bottomSheetRef.current?.snapToIndex(1);
            setActiveTab(initialTab);
        } else {
            bottomSheetRef.current?.close();
        }
    }, [event?.id, initialTab]);

    // Auto-expand when switching to chat
    useEffect(() => {
        if (activeTab === 'chat') {
            bottomSheetRef.current?.snapToIndex(1);
        }
    }, [activeTab]);

    const handleSheetChanges = (index: number) => {
        if (index === -1) {
            // Animation complete - now we can safely unmount from parent
            onClose();
        }
    };

    if (!event) return null;

    // Use event font style or default to simple
    const TitleStyle = EVENT_FONTS[event.fontStyle || 'simple'];

    // Share event functionality
    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${event.title}!\n\n${event.description}\n\n📍 ${event.fullAddress || 'Location TBD'}\n🕐 ${event.time}`,
                title: event.title,
            });
        } catch (error) {
            console.log('Share error:', error);
        }
    };

    // Get directions functionality
    const handleGetDirections = () => {
        const address = encodeURIComponent(event.fullAddress || '');
        const [lon, lat] = event.coordinates;

        // Use Apple Maps on iOS, Google Maps on Android
        const url = Platform.select({
            ios: `maps://app?daddr=${lat},${lon}&q=${address}`,
            android: `google.navigation:q=${lat},${lon}`,
            default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
        });

        Linking.openURL(url!).catch(err => {
            console.log('Could not open maps:', err);
            // Fallback to web maps
            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);
        });
    };

    // Format price display
    const priceDisplay = event.price === 'free' || event.price === undefined
        ? 'FREE'
        : `$${event.price}`;

    return (
        <BottomSheet
            ref={bottomSheetRef}
            snapPoints={snapPoints}
            index={1} // Force open at 96%
            enablePanDownToClose
            onChange={handleSheetChanges}
            backgroundComponent={({ style }) => (
                <View style={[style, { overflow: 'hidden', borderRadius: 32 }]}>
                    <MeshBackground />
                </View>
            )}
            handleIndicatorStyle={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                width: 40,
                marginTop: 10
            }}
        >
            <View style={styles.contentContainer}>
                {/* Content Area */}
                <View style={{ flex: 1 }}>
                    {activeTab === 'info' ? (
                        <View style={{ flex: 1 }}>
                            <BottomSheetScrollView
                                contentContainerStyle={styles.scrollContent}
                                showsVerticalScrollIndicator={false}
                            >
                                {/* Header Image Section - Now scrollable */}
                                <View style={styles.headerImageContainer}>
                                    {/* Action Buttons (Back + Close) - Absolute over header */}
                                    <View style={{
                                        position: 'absolute',
                                        top: 24,
                                        left: 0,
                                        right: 0,
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        paddingHorizontal: 16,
                                        zIndex: 50
                                    }}>
                                        {/* Back Button - White Circle */}
                                        {onBack ? (
                                            <Pressable
                                                style={({ pressed }) => [
                                                    styles.headerCircleButton,
                                                    pressed && { transform: [{ scale: 0.9 }], opacity: 0.9 }
                                                ]}
                                                onPress={() => {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    bottomSheetRef.current?.close();
                                                }}
                                            >
                                                <ChevronLeft size={24} color="#000" strokeWidth={2.5} />
                                            </Pressable>
                                        ) : <View />}

                                        {/* Close Button - White Circle */}
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <Pressable
                                                style={({ pressed }) => [
                                                    styles.headerCircleButton,
                                                    pressed && { transform: [{ scale: 0.9 }], opacity: 0.9 }
                                                ]}
                                                onPress={() => {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    handleShare();
                                                }}
                                            >
                                                <ShareIcon size={20} color="#000" strokeWidth={2.5} />
                                            </Pressable>

                                            <Pressable
                                                style={({ pressed }) => [
                                                    styles.headerCircleButton,
                                                    pressed && { transform: [{ scale: 0.9 }], opacity: 0.9 }
                                                ]}
                                                onPress={() => {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    bottomSheetRef.current?.close();
                                                }}
                                            >
                                                <XIcon size={24} color="#000" strokeWidth={2.5} />
                                            </Pressable>
                                        </View>
                                    </View>

                                    <View style={styles.imageWrapper}>
                                        {event.headerImage ? (
                                            <Image
                                                source={{ uri: event.headerImage }}
                                                style={styles.headerImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={[styles.headerImage, { backgroundColor: '#2a2420', justifyContent: 'center', alignItems: 'center' }]}>
                                                <GalleryText style={{ fontSize: 48 }}>{event.icon}</GalleryText>
                                            </View>
                                        )}

                                        {/* Film Glaze Overlay */}
                                        <View style={styles.filmGlaze} />
                                        <View style={styles.darkOverlay} />

                                        {/* POPULAR Badge - Only show if event is popular */}
                                        {event.isPopular && (
                                            <View style={styles.popularBadge}>
                                                <GalleryText style={styles.popularBadgeText}>POPULAR</GalleryText>
                                            </View>
                                        )}
                                    </View>

                                    {/* Event Title Overlaid on Image */}
                                    <View style={styles.titleOverlay}>
                                        {event.host && (
                                            <View style={styles.hostPill}>
                                                <Image
                                                    source={{ uri: event.host.avatarUrl || 'https://api.dicebear.com/9.x/fun-emoji/png?seed=Host' }}
                                                    style={styles.hostAvatar}
                                                />
                                                <GalleryText style={styles.hostText}>Hosted by {event.host.name || 'Host'}</GalleryText>
                                            </View>
                                        )}

                                        <GalleryText style={[styles.title, TitleStyle]}>
                                            {event.title}
                                        </GalleryText>
                                    </View>
                                </View>

                                {/* Tab Switcher - Under photo */}
                                <View style={styles.tabContainer}>
                                    <Pressable
                                        style={[styles.tabButton, (activeTab as string) === 'info' && styles.activeTab]}
                                        onPress={() => setActiveTab('info')}
                                    >
                                        <GalleryText style={[styles.tabText, (activeTab as string) === 'info' && styles.activeTabText]}>DETAILS</GalleryText>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.tabButton, (activeTab as string) === 'chat' && styles.activeTab]}
                                        onPress={() => setActiveTab('chat')}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <GalleryText style={[styles.tabText, (activeTab as string) === 'chat' && styles.activeTabText]}>LOUNGE</GalleryText>
                                            {(activeTab as string) !== 'chat' && <View style={styles.notificationDot} />}
                                        </View>
                                    </Pressable>
                                </View>

                                <View style={styles.detailsContainer}>
                                    {/* Grid Metadata */}
                                    <View style={styles.metaGrid}>
                                        <View style={styles.metaCard}>
                                            <View style={styles.iconBox}>
                                                <Calendar size={18} color={COLORS.accents.bleuGrey} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <GalleryText style={styles.metaLabel}>DATE</GalleryText>
                                                <GalleryText style={styles.metaValue} numberOfLines={1}>
                                                    {event.startTime ? event.startTime.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' }) : 'Today'}
                                                </GalleryText>
                                            </View>
                                        </View>

                                        <View style={styles.metaCard}>
                                            <View style={styles.iconBox}>
                                                <Clock size={18} color={COLORS.accents.mint} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <GalleryText style={styles.metaLabel}>TIME</GalleryText>
                                                <GalleryText style={styles.metaValue} numberOfLines={1}>{event.time}</GalleryText>
                                            </View>
                                        </View>
                                    </View>

                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.metaCardFull,
                                            pressed && { opacity: 0.8 }
                                        ]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            handleGetDirections();
                                        }}
                                    >
                                        <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 255, 255, 0.1)' }]}>
                                            <MapPin size={18} color={COLORS.accents.internationalOrange} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <GalleryText style={styles.metaLabel}>LOCATION</GalleryText>
                                            <GalleryText style={styles.metaValue} numberOfLines={1}>
                                                {event.fullAddress || "Secret Location"}
                                            </GalleryText>
                                        </View>
                                        <View style={styles.directionsButton}>
                                            <GalleryText style={styles.directionsText}>Directions</GalleryText>
                                        </View>
                                    </Pressable>

                                    {/* Description */}
                                    {event.description ? (
                                        <View style={styles.descriptionBox}>
                                            <GalleryText style={styles.description}>
                                                {event.description}
                                            </GalleryText>
                                        </View>
                                    ) : null}

                                    {/* Price Badge */}
                                    <View style={[
                                        styles.priceBadge,
                                        event.price === 'free' || event.price === undefined
                                            ? { backgroundColor: COLORS.accents.mint }
                                            : {}
                                    ]}>
                                        <GalleryText style={[
                                            styles.priceBadgeText,
                                            event.price === 'free' || event.price === undefined
                                                ? { color: '#000' }
                                                : {}
                                        ]}>
                                            {priceDisplay}
                                        </GalleryText>
                                    </View>

                                    {/* RSVP Section */}
                                    <GalleryText style={styles.sectionHeader}>ARE YOU GOING?</GalleryText>
                                    <View style={styles.rsvpRow}>
                                        <RSVPButton
                                            label="I'M IN"
                                            icon={<Check size={20} color={lockedIn ? COLORS.canvas.pureBlack : COLORS.text.secondary} strokeWidth={2.5} />}
                                            isActive={lockedIn}
                                            activeColor={COLORS.accents.hotPink}
                                            onPress={() => toggleRSVP(event)}
                                        />
                                        <RSVPButton
                                            label="MAYBE"
                                            icon={<HelpCircle size={20} color={saved ? COLORS.canvas.pureBlack : COLORS.text.secondary} strokeWidth={2.5} />}
                                            isActive={saved}
                                            activeColor={COLORS.accents.mint}
                                            onPress={() => toggleSaved(event)}
                                        />
                                        <RSVPButton
                                            label="NOPE"
                                            icon={<XIcon size={20} color={COLORS.text.secondary} strokeWidth={2.5} />}
                                            isActive={!lockedIn && !saved}
                                            activeColor="#333"
                                            onPress={() => {
                                                if (lockedIn) toggleRSVP(event);
                                                if (saved) toggleSaved(event);
                                            }}
                                        />
                                    </View>

                                    {/* Guest List Preview */}
                                    <View style={styles.guestListPreview}>
                                        <View style={styles.guestAvatars}>
                                            {[1, 2, 3].map(i => (
                                                <View key={i} style={[styles.guestAvatar, { backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D'][i - 1] }]} />
                                            ))}
                                            <View style={[styles.guestAvatar, { backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }]}>
                                                <GalleryText style={{ fontSize: 10, color: '#fff' }}>+12</GalleryText>
                                            </View>
                                        </View>
                                        <GalleryText style={styles.guestText}>15 guests going</GalleryText>
                                    </View>
                                </View>
                                <View style={{ height: 40 }} />
                            </BottomSheetScrollView>
                        </View>
                    ) : (
                        <PublicLounge
                            eventId={event.id}
                            onBack={() => setActiveTab('info')}
                            onClose={onClose}
                        />
                    )}
                </View>
            </View>


        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 100, // Extra clearance for safe area and breathing room
    },
    headerImageContainer: {
        width: '100%',
        paddingHorizontal: 16,
        marginTop: 80, // Nudged up from 110
        marginBottom: 20,
    },
    imageWrapper: {
        width: '100%',
        height: 220, // Slightly taller for more presence
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#2a2420',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    filmGlaze: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 200, 150, 0.08)',
        mixBlendMode: 'multiply',
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    titleOverlay: {
        position: 'absolute',
        bottom: 24,
        left: 24 + 16,
        right: 24 + 16,
    },
    hostPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignSelf: 'flex-start',
        paddingRight: 12,
        paddingLeft: 4,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 12,
        gap: 8,
    },
    hostAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ccc',
    },
    hostText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '600',
    },
    title: {
        fontSize: 32, // Slightly smaller title
        color: COLORS.canvas.white,
        lineHeight: 36,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    // Tabs
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 0,
        marginBottom: 16,
        backgroundColor: '#2a2420',
        borderRadius: 100,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 100,
    },
    activeTab: {
        backgroundColor: '#3a3430',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#888',
        letterSpacing: 1,
    },
    activeTabText: {
        color: COLORS.canvas.white,
    },
    notificationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.accents.bleuGrey,
    },

    detailsContainer: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    metaGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    metaCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    metaCardFull: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 20,
        gap: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    metaLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 0,
    },
    metaValue: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
    descriptionBox: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 24,
        marginBottom: 24,
    },
    description: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 22,
    },
    sectionHeader: {
        fontSize: 12,
        color: '#888',
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 16,
        textAlign: 'center',
    },
    rsvpRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    rsvpButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    rsvpIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    rsvpLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 0.5,
    },
    guestListPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 20,
    },
    guestAvatars: {
        flexDirection: 'row',
    },
    guestAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#1a1410',
        marginLeft: -10,
    },
    guestText: {
        color: '#888',
        fontSize: 14,
    },
    headerControls: {
        position: 'absolute',
        top: 20,
        right: 20,
        flexDirection: 'row',
        gap: 12,
        zIndex: 100,
    },
    controlButton: {
        // Wrapper
    },
    controlButtonBlur: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: COLORS.text.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 0,
        elevation: 5,
        transform: [{ rotate: '3deg' }]
    },
    closeButton: {
        // Legacy/Unused if headerControls replaces it, but keeping to avoid breaking layout if referenced elsewhere
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 100,
    },
    closeButtonBlur: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: COLORS.text.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 0,
        elevation: 5,
        transform: [{ rotate: '3deg' }]
    },
    headerCircleButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    directionsButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    directionsText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.accents.internationalOrange,
    },
    popularBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: COLORS.accents.lavender,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        zIndex: 10,
    },
    popularBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#000',
        letterSpacing: 0.5,
    },
    priceBadge: {
        backgroundColor: COLORS.accents.hotPink,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    priceBadgeText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
