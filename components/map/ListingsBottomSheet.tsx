import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolation
} from 'react-native-reanimated';
import { MasonryFeed } from '../feed/MasonryFeed';
import { DateFilterStrip } from '../feed/DateFilterStripComp'
import { CategoryFilterStrip } from '../feed/CategoryFilterStrip';
import { MeshBackground } from '../MeshBackground';
import { EventData } from '../../constants/events';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ListingsBottomSheetProps {
    events: EventData[];
    isOpen: boolean;
    onClose: () => void;
    onEventPress: (event: EventData) => void;
}

export const ListingsBottomSheet = ({ events, isOpen, onClose, onEventPress }: ListingsBottomSheetProps) => {
    const insets = useSafeAreaInsets();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [shouldRender, setShouldRender] = useState(isOpen);

    // Animation values
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const opacity = useSharedValue(0);

    // Handle open/close animations
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            // Slide up with spring animation
            translateY.value = withSpring(0, {
                damping: 20,
                stiffness: 90,
                mass: 0.8,
            });
            opacity.value = withTiming(1, { duration: 300 });
        } else {
            // Slide down with timing animation
            translateY.value = withTiming(SCREEN_HEIGHT, { duration: 350 }, (finished) => {
                if (finished) {
                    runOnJS(setShouldRender)(false);
                }
            });
            opacity.value = withTiming(0, { duration: 250 });
        }
    }, [isOpen]);

    // Animated styles
    const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const animatedBackgroundStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateY.value,
            [SCREEN_HEIGHT, 0],
            [0, 1],
            Extrapolation.CLAMP
        ),
    }));

    // Filter events by date AND category
    const filteredEvents = useMemo(() => {
        return events.filter(e => {
            // Date filter
            if (selectedDate) {
                if (!e.startTime) return false;
                const sameDay = e.startTime.getDate() === selectedDate.getDate() &&
                    e.startTime.getMonth() === selectedDate.getMonth();
                if (!sameDay) return false;
            }

            // Category filter
            if (selectedCategory) {
                if (e.category !== selectedCategory) return false;
            }

            return true;
        });
    }, [events, selectedDate, selectedCategory]);

    // Don't render if not needed
    if (!shouldRender) return null;

    return (
        <Animated.View style={[styles.container, { paddingTop: insets.top + 100 }, animatedContainerStyle]}>
            {/* Mesh Background with fade */}
            <Animated.View style={[StyleSheet.absoluteFill, animatedBackgroundStyle]} pointerEvents="none">
                <MeshBackground />
                <View style={[StyleSheet.absoluteFill, styles.overlay]} />
            </Animated.View>

            {/* Fixed Header: Date & Category Filters */}
            <View style={styles.filterSection}>
                <DateFilterStrip
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                />
                <CategoryFilterStrip
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                />
            </View>

            {/* Scrollable Masonry Grid */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: 200 + insets.bottom }
                ]}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <MasonryFeedInline
                    events={filteredEvents}
                    onEventPress={onEventPress}
                />
            </ScrollView>
        </Animated.View>
    );
};

// Inline version of MasonryFeed without its own ScrollView
import { Pressable, Image } from 'react-native';
import { COLORS, EVENT_FONTS } from '../../constants/theme';
import { GalleryText } from '../GalleryPrimitives';
import { MapPin, Clock, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { withSequence } from 'react-native-reanimated';
import { useEvents } from '../../context/EventsContext';

const PADDING = 16;
const COLUMN_GAP = 10;
const TALL_HEIGHT = 280;
const MEDIUM_HEIGHT = 220;
const SHORT_HEIGHT = 180;

interface MasonryFeedInlineProps {
    events: EventData[];
    onEventPress: (event: EventData) => void;
}

const MasonryCardInline = ({ event, height, isSaved, onPress, onSave }: any) => {
    const heartScale = useSharedValue(1);
    const heartAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartScale.value }]
    }));

    const handleSave = () => {
        heartScale.value = withSequence(withSpring(1.4), withSpring(1));
        onSave();
    };

    return (
        <Pressable
            style={[cardStyles.card, { height }]}
            onPress={onPress}
            onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); handleSave(); }}
            delayLongPress={300}
        >
            <Image
                source={{ uri: event.headerImage || `https://source.unsplash.com/random/400x600/?${event.category},event` }}
                style={cardStyles.cardImage}
                resizeMode="cover"
            />
            <View style={cardStyles.gradientOverlay}>
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
            <View style={cardStyles.categoryTag}>
                <GalleryText style={cardStyles.categoryText}>{event.category.toUpperCase()}</GalleryText>
            </View>
            <Pressable style={[cardStyles.rsvpButton, isSaved && cardStyles.rsvpButtonActive]} onPress={handleSave}>
                <Animated.View style={[heartAnimatedStyle, cardStyles.rsvpContent]}>
                    {isSaved ? <Check size={14} color="#FFF" strokeWidth={3} /> : <GalleryText style={cardStyles.rsvpText}>RSVP</GalleryText>}
                </Animated.View>
            </Pressable>
            <View style={cardStyles.cardContent}>
                <GalleryText style={[cardStyles.cardTitle, event.fontStyle && EVENT_FONTS[event.fontStyle]]} numberOfLines={2}>
                    {event.title}
                </GalleryText>
                <View style={cardStyles.metaRow}>
                    <Clock size={12} color="rgba(255,255,255,0.7)" />
                    <GalleryText style={cardStyles.metaText}>
                        {event.startTime?.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} • {event.time}
                    </GalleryText>
                </View>
                <View style={cardStyles.metaRow}>
                    <MapPin size={12} color="rgba(255,255,255,0.7)" />
                    <GalleryText style={cardStyles.metaText} numberOfLines={1}>
                        {event.fullAddress?.split(',')[0] || 'TBA'}
                    </GalleryText>
                </View>
            </View>
        </Pressable>
    );
};

const MasonryFeedInline: React.FC<MasonryFeedInlineProps> = ({ events, onEventPress }) => {
    const { toggleRSVP, isLockedIn } = useEvents();

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

    const leftColumn: { event: EventData; height: number }[] = [];
    const rightColumn: { event: EventData; height: number }[] = [];
    let leftHeight = 0;
    let rightHeight = 0;

    events.forEach((event, index) => {
        const cardHeight = getCardHeight(index);
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
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <GalleryText style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>No events found 😔</GalleryText>
                <GalleryText style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Try a different date or category</GalleryText>
            </View>
        );
    }

    return (
        <View style={{ flexDirection: 'row', gap: COLUMN_GAP, paddingHorizontal: PADDING }}>
            <View style={{ flex: 1, gap: COLUMN_GAP }}>
                {leftColumn.map(({ event, height }) => (
                    <MasonryCardInline
                        key={event.id}
                        event={event}
                        height={height}
                        isSaved={isLockedIn(event.id)}
                        onPress={() => onEventPress(event)}
                        onSave={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); toggleRSVP(event); }}
                    />
                ))}
            </View>
            <View style={{ flex: 1, gap: COLUMN_GAP }}>
                {rightColumn.map(({ event, height }) => (
                    <MasonryCardInline
                        key={event.id}
                        event={event}
                        height={height}
                        isSaved={isLockedIn(event.id)}
                        onPress={() => onEventPress(event)}
                        onSave={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); toggleRSVP(event); }}
                    />
                ))}
            </View>
        </View>
    );
};

const cardStyles = StyleSheet.create({
    card: { width: '100%', borderRadius: 16, overflow: 'hidden', backgroundColor: '#1a1a1a' },
    cardImage: { ...StyleSheet.absoluteFillObject },
    gradientOverlay: { ...StyleSheet.absoluteFillObject },
    categoryTag: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.5)' },
    categoryText: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
    rsvpButton: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: '#FFF' },
    rsvpButtonActive: { backgroundColor: COLORS.accents.hotPink },
    rsvpContent: { flexDirection: 'row', alignItems: 'center' },
    rsvpText: { fontSize: 11, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
    cardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 6, lineHeight: 19 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    metaText: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500', flex: 1 },
});

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0a0a0a',
    },
    overlay: {
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    filterSection: {
        // Fixed at top, not scrollable
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        // paddingBottom set dynamically with insets
    },
});
