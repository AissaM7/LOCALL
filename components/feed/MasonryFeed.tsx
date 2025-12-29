import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, DESIGN, EVENT_FONTS } from '../../constants/theme';
import { EventData } from '../../constants/events';
import { GalleryText } from '../GalleryPrimitives';
import { MapPin, Clock, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { useEvents } from '../../context/EventsContext';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 10;
const PADDING = 16;
const COLUMN_WIDTH = (width - PADDING * 2 - COLUMN_GAP) / 2;

// Card heights for visual variety
const TALL_HEIGHT = 280;
const MEDIUM_HEIGHT = 220;
const SHORT_HEIGHT = 180;

interface MasonryFeedProps {
    events: EventData[];
    onEventPress: (event: EventData) => void;
}

interface MasonryCardProps {
    event: EventData;
    height: number;
    isSaved: boolean;
    onPress: () => void;
    onSave: () => void;
}

const MasonryCard: React.FC<MasonryCardProps> = ({ event, height, isSaved, onPress, onSave }) => {
    const heartScale = useSharedValue(1);

    const heartAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartScale.value }]
    }));

    const handleSave = () => {
        heartScale.value = withSequence(
            withSpring(1.4),
            withSpring(1)
        );
        onSave();
    };

    const handleLongPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        handleSave();
    };

    return (
        <Pressable
            style={[styles.card, { height }]}
            onPress={onPress}
            onLongPress={handleLongPress}
            delayLongPress={300}
        >
            {/* Cover Image */}
            <Image
                source={{ uri: event.headerImage || `https://source.unsplash.com/random/400x600/?${event.category},event` }}
                style={styles.cardImage}
                resizeMode="cover"
            />

            {/* Gradient Overlay */}
            <View style={styles.gradientOverlay}>
                <Svg height="100%" width="100%">
                    <Defs>
                        <LinearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor="transparent" stopOpacity="0" />
                            <Stop offset="0.5" stopColor="black" stopOpacity="0.3" />
                            <Stop offset="1" stopColor="black" stopOpacity="0.9" />
                        </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#cardGrad)" />
                </Svg>
            </View>

            {/* Category Tag (top left) */}
            <View style={styles.categoryTag}>
                <GalleryText style={styles.categoryText}>
                    {event.category.toUpperCase()}
                </GalleryText>
            </View>

            {/* RSVP Button (top right) */}
            <Pressable style={[styles.rsvpButton, isSaved && styles.rsvpButtonActive]} onPress={handleSave}>
                <Animated.View style={[heartAnimatedStyle, styles.rsvpContent]}>
                    {isSaved ? (
                        <Check size={14} color="#FFF" strokeWidth={3} />
                    ) : (
                        <GalleryText style={styles.rsvpText}>RSVP</GalleryText>
                    )}
                </Animated.View>
            </Pressable>

            {/* Content (bottom) */}
            <View style={styles.cardContent}>
                <GalleryText
                    style={[styles.cardTitle, event.fontStyle && EVENT_FONTS[event.fontStyle]]}
                    numberOfLines={2}
                >
                    {event.title}
                </GalleryText>

                <View style={styles.metaRow}>
                    <Clock size={12} color="rgba(255,255,255,0.7)" />
                    <GalleryText style={styles.metaText}>
                        {event.startTime?.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} • {event.time}
                    </GalleryText>
                </View>

                <View style={styles.metaRow}>
                    <MapPin size={12} color="rgba(255,255,255,0.7)" />
                    <GalleryText style={styles.metaText} numberOfLines={1}>
                        {event.fullAddress?.split(',')[0] || 'TBA'}
                    </GalleryText>
                </View>
            </View>
        </Pressable>
    );
};

export const MasonryFeed: React.FC<MasonryFeedProps> = ({
    events,
    onEventPress
}) => {
    const { toggleRSVP, isLockedIn } = useEvents();
    const { bottom } = useSafeAreaInsets();

    const handleSave = useCallback((event: EventData) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toggleRSVP(event);
    }, [toggleRSVP]);

    // Split events into two columns with varying heights
    const getCardHeight = (index: number): number => {
        const pattern = index % 4;
        switch (pattern) {
            case 0: return TALL_HEIGHT;
            case 1: return MEDIUM_HEIGHT;
            case 2: return SHORT_HEIGHT;
            case 3: return TALL_HEIGHT;
            default: return MEDIUM_HEIGHT;
        }
    };

    // Distribute events into two columns for masonry effect
    const leftColumn: { event: EventData; height: number }[] = [];
    const rightColumn: { event: EventData; height: number }[] = [];
    let leftHeight = 0;
    let rightHeight = 0;

    events.forEach((event, index) => {
        const cardHeight = getCardHeight(index);

        // Add to shorter column
        if (leftHeight <= rightHeight) {
            leftColumn.push({ event, height: cardHeight });
            leftHeight += cardHeight + COLUMN_GAP;
        } else {
            rightColumn.push({ event, height: cardHeight });
            rightHeight += cardHeight + COLUMN_GAP;
        }
    });

    if (events.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <GalleryText style={styles.emptyText}>No events found 😔</GalleryText>
                <GalleryText style={styles.emptySubtext}>Try a different date or category</GalleryText>
            </View>
        );
    }

    return (
        <BottomSheetScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.masonryContainer}>
                {/* Left Column */}
                <View style={styles.column}>
                    {leftColumn.map(({ event, height }) => (
                        <MasonryCard
                            key={event.id}
                            event={event}
                            height={height}
                            isSaved={isLockedIn(event.id)}
                            onPress={() => onEventPress(event)}
                            onSave={() => handleSave(event)}
                        />
                    ))}
                </View>

                {/* Right Column */}
                <View style={styles.column}>
                    {rightColumn.map(({ event, height }) => (
                        <MasonryCard
                            key={event.id}
                            event={event}
                            height={height}
                            isSaved={isLockedIn(event.id)}
                            onPress={() => onEventPress(event)}
                            onSave={() => handleSave(event)}
                        />
                    ))}
                </View>
            </View>

            {/* Footer Spacer - OUTSIDE the masonry row, ensures last items are scrollable */}
            <View style={{ height: 200, width: '100%' }} />
        </BottomSheetScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: PADDING,
    },
    masonryContainer: {
        flexDirection: 'row',
        gap: COLUMN_GAP,
    },
    column: {
        flex: 1,
        gap: COLUMN_GAP,
    },
    card: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
    },
    cardImage: {
        ...StyleSheet.absoluteFillObject,
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    categoryTag: {
        position: 'absolute',
        top: 10,
        left: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    categoryText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 1,
    },
    rsvpButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
        backgroundColor: '#FFF',
    },
    rsvpButtonActive: {
        backgroundColor: COLORS.accents.hotPink,
    },
    rsvpContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rsvpText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#000',
        letterSpacing: 0.5,
    },
    cardContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 6,
        lineHeight: 19,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    metaText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '500',
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.3)',
    },
});
