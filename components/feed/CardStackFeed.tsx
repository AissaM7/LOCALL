import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Image, Pressable } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolation,
    SharedValue
} from 'react-native-reanimated';
import { COLORS, DESIGN, EVENT_FONTS } from '../../constants/theme';
import { EventData } from '../../constants/events';
import { GalleryText } from '../GalleryPrimitives';
import { MapPin, Calendar, Check, X as XIcon, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = height * 0.55;
const SWIPE_THRESHOLD = width * 0.3;

interface CardStackFeedProps {
    events: EventData[];
    onEventPress?: (event: EventData) => void;
}

// Separate component for animated card to avoid hooks-in-loop violation
interface AnimatedCardProps {
    item: EventData;
    isTopCard: boolean;
    translateX: SharedValue<number>;
    translateY: SharedValue<number>;
    rotation: SharedValue<number>;
    cardScale: SharedValue<number>;
    panGesture: ReturnType<typeof Gesture.Pan>;
    onPress?: () => void;
}

const AnimatedEventCard: React.FC<AnimatedCardProps> = ({
    item,
    isTopCard,
    translateX,
    translateY,
    rotation,
    cardScale,
    panGesture,
    onPress
}) => {
    const animatedStyle = useAnimatedStyle(() => {
        if (isTopCard) {
            return {
                transform: [
                    { translateX: translateX.value },
                    { translateY: translateY.value },
                    { rotate: `${rotation.value}deg` },
                    { scale: cardScale.value }
                ],
                zIndex: 10
            };
        } else {
            const swipeProgress = interpolate(
                Math.abs(translateX.value),
                [0, SWIPE_THRESHOLD],
                [0, 1],
                Extrapolation.CLAMP
            );

            const scale = interpolate(swipeProgress, [0, 1], [0.92, 1]);
            const opacity = interpolate(swipeProgress, [0, 1], [0.5, 1]);

            return {
                transform: [{ scale }],
                opacity,
                zIndex: 5
            };
        }
    });

    const cardContent = (
        <Animated.View style={[styles.card, animatedStyle]}>
            <EventCardContent item={item} onPress={onPress} />
        </Animated.View>
    );

    if (isTopCard) {
        return (
            <View style={styles.cardWrapper}>
                <GestureDetector gesture={panGesture}>
                    {cardContent}
                </GestureDetector>
            </View>
        );
    }

    return (
        <View style={styles.cardWrapper}>
            {cardContent}
        </View>
    );
};

export const CardStackFeed: React.FC<CardStackFeedProps> = ({ events, onEventPress }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [history, setHistory] = useState<number[]>([]);

    // Shared values for the ACTIVE card
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const rotation = useSharedValue(0);
    const cardScale = useSharedValue(1);

    // Reset shared values when index changes
    useEffect(() => {
        translateX.value = 0;
        translateY.value = 0;
        rotation.value = 0;
        cardScale.value = withSpring(1);
    }, [currentIndex]);

    const handleSwipeComplete = useCallback((direction: 'left' | 'right') => {
        if (currentIndex >= events.length) return;

        const item = events[currentIndex];
        console.log(`Swiped ${direction} on ${item?.title}`);

        setHistory(prev => [...prev, currentIndex]);
        setCurrentIndex(prev => prev + 1);

        if (direction === 'right') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [currentIndex, events]);

    const handleRewind = useCallback(() => {
        if (history.length === 0) return;

        const prevIndex = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        setCurrentIndex(prevIndex);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [history]);

    const panGesture = Gesture.Pan()
        .onBegin(() => {
            cardScale.value = withSpring(0.98);
        })
        .onUpdate((e) => {
            translateX.value = e.translationX;
            translateY.value = e.translationY;
            rotation.value = interpolate(e.translationX, [-width, width], [-15, 15]);
        })
        .onEnd((e) => {
            if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
                const direction = e.translationX > 0 ? 'right' : 'left';
                const destX = direction === 'right' ? width + 100 : -width - 100;

                translateX.value = withTiming(destX, { duration: 200 });
                runOnJS(handleSwipeComplete)(direction);
            } else {
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
                rotation.value = withSpring(0);
                cardScale.value = withSpring(1);
            }
        });

    // Empty State
    if (currentIndex >= events.length || events.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <GalleryText style={styles.emptyText}>
                    {events.length === 0 ? 'No events on this date 📅' : 'No more vibes for now ✌️'}
                </GalleryText>
                {events.length > 0 && (
                    <Pressable onPress={() => setCurrentIndex(0)} style={styles.resetButton}>
                        <RotateCcw color="#FFF" size={24} />
                        <GalleryText style={{ color: '#FFF', fontWeight: 'bold' }}>Start Over</GalleryText>
                    </Pressable>
                )}
            </View>
        );
    }

    // Get current and next card
    const topCard = events[currentIndex];
    const nextCard = currentIndex + 1 < events.length ? events[currentIndex + 1] : null;

    return (
        <View style={styles.container}>
            {/* Cards Stack */}
            <View style={styles.cardsArea}>
                {/* Render bottom card first (if exists) */}
                {nextCard && (
                    <AnimatedEventCard
                        key={`next-${nextCard.id}`}
                        item={nextCard}
                        isTopCard={false}
                        translateX={translateX}
                        translateY={translateY}
                        rotation={rotation}
                        cardScale={cardScale}
                        panGesture={panGesture}
                    />
                )}

                {/* Render top card */}
                <AnimatedEventCard
                    key={`top-${topCard.id}`}
                    item={topCard}
                    isTopCard={true}
                    translateX={translateX}
                    translateY={translateY}
                    rotation={rotation}
                    cardScale={cardScale}
                    panGesture={panGesture}
                    onPress={() => onEventPress?.(topCard)}
                />

                {/* Action Buttons - Overlaid at bottom of card area */}
                <View style={styles.controlsOverlay}>
                    {history.length > 0 && (
                        <Pressable style={styles.miniButton} onPress={handleRewind}>
                            <RotateCcw size={18} color="#FFF" />
                        </Pressable>
                    )}

                    <Pressable
                        style={[styles.actionButton, styles.passButton]}
                        onPress={() => {
                            translateX.value = withTiming(-width - 100);
                            runOnJS(handleSwipeComplete)('left');
                        }}
                    >
                        <XIcon size={24} color="#FF453A" />
                    </Pressable>

                    <Pressable
                        style={[styles.actionButton, styles.likeButton]}
                        onPress={() => {
                            translateX.value = withTiming(width + 100);
                            runOnJS(handleSwipeComplete)('right');
                        }}
                    >
                        <Check size={24} color="#FFF" />
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

// Static card content component
const EventCardContent = ({ item, onPress }: { item: EventData, onPress?: () => void }) => (
    <Pressable style={{ flex: 1 }} onPress={onPress}>
        <View style={styles.imageContainer}>
            <Image
                source={{ uri: item.headerImage || `https://source.unsplash.com/random/800x1000/?${item.category},party` }}
                style={styles.image}
                resizeMode="cover"
            />

            <View style={styles.gradientContainer}>
                <Svg height="100%" width="100%">
                    <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor="black" stopOpacity="0" />
                            <Stop offset="0.5" stopColor="black" stopOpacity="0.7" />
                            <Stop offset="1" stopColor="black" stopOpacity="0.95" />
                        </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
                </Svg>
            </View>

            <View style={styles.topRow}>
                <BlurView intensity={20} tint="dark" style={styles.categoryPill}>
                    <GalleryText style={styles.categoryText}>{item.category.toUpperCase()}</GalleryText>
                </BlurView>
            </View>

            <View style={styles.bottomContent}>
                <GalleryText type="heading" style={[styles.title, item.fontStyle && EVENT_FONTS[item.fontStyle]]}>
                    {item.title}
                </GalleryText>

                <View style={styles.metaRow}>
                    <Calendar size={16} color="rgba(255,255,255,0.7)" />
                    <GalleryText style={styles.metaText}>
                        {item.startTime ? item.startTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : 'Today'} • {item.time}
                    </GalleryText>
                </View>

                <View style={[styles.metaRow, { marginTop: 4 }]}>
                    <MapPin size={16} color="rgba(255,255,255,0.7)" />
                    <GalleryText style={styles.metaText} numberOfLines={1}>
                        {item.fullAddress || 'Secret Location'}
                    </GalleryText>
                </View>
            </View>
        </View>
    </Pressable>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    cardsArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 10,
    },
    cardWrapper: {
        position: 'absolute',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
    },
    card: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        backgroundColor: COLORS.canvas.fog,
        ...DESIGN.shadows.pop,
        overflow: 'hidden',
    },
    imageContainer: {
        flex: 1,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradientContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    title: {
        fontSize: 26,
        color: '#FFF',
        marginBottom: 8,
        lineHeight: 30,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    topRow: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    categoryPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        overflow: 'hidden',
    },
    categoryText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    bottomContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    controlsOverlay: {
        position: 'absolute',
        bottom: 100, // Above the tab bar
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        zIndex: 20,
    },
    actionButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        ...DESIGN.shadows.softHigh,
    },
    passButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 2,
        borderColor: '#FF453A',
    },
    likeButton: {
        backgroundColor: COLORS.accents.hotPink,
    },
    miniButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 18,
        textAlign: 'center',
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.accents.mint,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 100,
    }
});
