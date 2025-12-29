import React, { useState } from 'react';
import { View, StyleSheet, Image, Pressable, Dimensions, Linking, Share, Alert, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, DESIGN, EVENT_FONTS } from '../../constants/theme';
import { GalleryText } from '../GalleryPrimitives';
import { EventData } from '../../constants/events';
import { Heart, X, Star, Clock, MapPin, MessageSquare } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // Slightly wider margins
const CARD_HEIGHT = 580; // Taller to fit all the info

export const EventPreviewCard = ({ event, onPress, onClose, onOpenChat }: {
    event: EventData;
    onPress: () => void;
    onClose: () => void;
    onOpenChat: () => void;
}) => {
    // Local state for immediate UI feedback. In production, sync with API.
    const [isGoing, setIsGoing] = useState(false);

    // Helper to determine price display
    const getPriceDisplay = () => {
        const price = (event as any).price;
        if (!price || price === 0) return 'FREE';
        return `$${price}`;
    };

    const handleDirections = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const [lon, lat] = event.coordinates;
        const label = encodeURIComponent(event.title);
        // Apple Maps schema for directed navigation
        const url = Platform.select({
            ios: `maps:0,0?q=${label}@${lat},${lon}`,
            android: `geo:0,0?q=${lat},${lon}(${label})`,
            default: `https://maps.google.com/?q=${lat},${lon}`
        });

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert("Error", "Could not open Maps.");
            }
        });
    };

    const handleShare = async () => {
        Haptics.selectionAsync();
        try {
            await Share.share({
                message: `Check out ${event.title} happening ${event.time} at ${event.fullAddress || 'Secret Location'}!`,
                // In production, this would be a real deep link
                url: 'https://local.app/event/' + event.id,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleRSVP = () => {
        Haptics.notificationAsync(
            isGoing ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
        );
        setIsGoing(!isGoing);

        if (!isGoing) {
            Alert.alert(
                "You're In! 🎟️",
                "We've added you to the guest list."
            );
        }
    };

    return (
        <Animated.View
            entering={FadeInDown.springify().damping(14).mass(1).stiffness(100)}
            exiting={FadeOutDown.duration(200)}
            style={styles.container}
        >
            <Pressable
                onPress={() => {
                    Haptics.selectionAsync();
                    onPress();
                }}
                style={styles.cardContent}
            >
                {/* Image Section (Top 40%) */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: event.headerImage || `https://source.unsplash.com/random/800x800/?${event.category}` }}
                        style={styles.image}
                        resizeMode="cover"
                        onError={(e) => {
                            // Worst case fallback to a solid color or pattern if even this wrapper fails,
                            // but usually we can try another URL here if needed.
                            // For now, let's trust the prop, but maybe log it.
                            console.log("Image load error", e.nativeEvent.error);
                        }}
                    />

                    {/* Header Overlays */}
                    <View style={styles.overlayHeader}>
                        <Pressable
                            style={styles.iconButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                        >
                            <X size={20} color={COLORS.canvas.pureBlack} strokeWidth={2.5} />
                        </Pressable>

                        <View style={[styles.badge, { backgroundColor: COLORS.accents.lavender }]}>
                            <GalleryText type="micro" style={styles.badgeText}>POPULAR</GalleryText>
                        </View>
                    </View>

                    <Pressable
                        style={styles.heartButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            if (isGoing) {
                                onOpenChat();
                            } else {
                                Alert.alert("RSVP First", "Lock in your RSVP to join the lounge chat! 💬");
                            }
                        }}
                    >
                        <MessageSquare size={20} color={COLORS.canvas.white} />
                    </Pressable>
                </View>

                {/* Info Section */}
                <View style={styles.infoContainer}>
                    {/* Title */}
                    <GalleryText numberOfLines={1} style={[styles.title, event.fontStyle && EVENT_FONTS[event.fontStyle]]}>
                        {event.title}
                    </GalleryText>

                    {/* Hosted By - Mocked for now */}
                    <View style={styles.hostRow}>
                        <Image
                            source={{ uri: 'https://i.pravatar.cc/100?img=5' }}
                            style={styles.hostAvatar}
                        />
                        <GalleryText type="body" style={styles.hostText}>Hosted by <GalleryText type="body" style={{ color: COLORS.text.primary }}>Alice</GalleryText></GalleryText>
                    </View>

                    {/* Details Grid */}
                    <View style={styles.detailsGrid}>
                        {/* Time */}
                        <View style={styles.detailRow}>
                            <Clock size={16} color={COLORS.text.secondary} />
                            <GalleryText type="body" style={styles.detailText}>{event.time}</GalleryText>
                        </View>

                        {/* Location + Directions Btn */}
                        <View style={styles.detailRow}>
                            <MapPin size={16} color={COLORS.accents.coral} />
                            <GalleryText numberOfLines={1} type="body" style={[styles.detailText, { flex: 1 }]}>
                                {event.fullAddress ? event.fullAddress.split(',')[0] : 'Secret Location'}
                                <GalleryText type="body" style={{ color: COLORS.text.secondary }}> • 0.4 mi</GalleryText>
                            </GalleryText>

                            {/* Get Directions Pill */}
                            <Pressable
                                style={styles.directionsButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleDirections();
                                }}
                            >
                                <GalleryText type="micro" style={styles.directionsText}>Get Directions</GalleryText>
                            </Pressable>
                        </View>
                    </View>

                    {/* Description */}
                    <GalleryText type="body" numberOfLines={2} style={styles.description}>
                        {event.description || "Come join us for an amazing time! Good vibes only."}
                    </GalleryText>

                    {/* Price & Rating Row */}
                    <View style={styles.priceRatingRow}>
                        <GalleryText style={styles.price}>{getPriceDisplay()}</GalleryText>

                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsRow}>
                        <Pressable
                            style={[
                                styles.rsvpButton,
                                isGoing && { backgroundColor: COLORS.accents.mint } // Toggle Color!
                            ]}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleRSVP();
                            }}
                        >
                            <GalleryText type="heading" style={[
                                styles.rsvpText,
                                isGoing && { color: COLORS.text.inverse } // Dark text on light mint
                            ]}>
                                {isGoing ? 'GOING! ✓' : 'RSVP'}
                            </GalleryText>
                        </Pressable>

                        <Pressable
                            style={styles.shareButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleShare();
                            }}
                        >
                            <GalleryText type="heading" style={styles.shareText}>Share</GalleryText>
                        </Pressable>
                    </View>

                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 130, // Lifted up
        alignSelf: 'center',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 32,
        ...DESIGN.shadows.pop,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 25,
        elevation: 10,
    },
    cardContent: {
        flex: 1,
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: '#1C1C1E',
    },
    imageContainer: {
        height: '40%',
        width: '100%',
        backgroundColor: '#333',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlayHeader: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
    },
    badgeText: {
        color: COLORS.text.inverse,
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 12, // Squircle
        backgroundColor: COLORS.text.primary, // Chill Off-White
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 4,
        transform: [{ rotate: '-6deg' }] // A little attitude
    },
    heartButton: {
        position: 'absolute',
        bottom: 12,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContainer: {
        flex: 1,
        padding: 24, // Increased overall padding
        paddingBottom: 32, // Extra padding at bottom
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 24,
        color: COLORS.text.primary,
        fontWeight: '600',
        marginBottom: 8,
    },
    hostRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    hostAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    hostText: {
        color: COLORS.text.secondary,
        fontSize: 14,
    },
    detailsGrid: {
        gap: 12,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    detailText: {
        color: COLORS.text.primary,
        fontSize: 15,
    },
    directionsButton: {
        backgroundColor: '#3A3A3C',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
    },
    directionsText: {
        color: COLORS.text.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    description: {
        color: COLORS.text.secondary,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    priceRatingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    price: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.text.primary,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ratingText: {
        color: COLORS.text.primary,
        fontWeight: '700',
        fontSize: 15,
    },
    reviewCount: {
        color: COLORS.text.secondary,
        fontSize: 13,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    rsvpButton: {
        flex: 2,
        backgroundColor: COLORS.accents.hotPink,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rsvpText: {
        color: COLORS.text.inverse,
        fontSize: 16,
        fontWeight: '700',
    },
    shareButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: COLORS.text.secondary,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shareText: {
        color: COLORS.text.primary,
        fontSize: 16,
        fontWeight: '600',
    },
});
