import React, { useEffect } from 'react';
import { StyleSheet, Pressable, Platform, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
    Easing,
    interpolate
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { COLORS, DESIGN } from '../../constants/theme';
import { GalleryText } from '../GalleryPrimitives';
import { MapPin, Bell, CloudMoon, Flame, User as UserIcon, Search, SlidersHorizontal } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MeshBackground } from '../MeshBackground';
import { useEvents } from '../../context/EventsContext';

const CATEGORIES = []; // Removed for now as requested

interface TopNavigationProps {
    onOpenProfile: () => void;
    currentLocation?: string;
    onSearch?: () => void;
    variant?: 'floating' | 'connected';
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
    onOpenProfile,
    currentLocation = "New York, NY",
    onSearch,
    variant = 'floating'
}) => {
    const insets = useSafeAreaInsets();
    const { searchQuery, selectedCategory, setSelectedCategory } = useEvents();

    // Reanimated Shared Values
    const progress = useSharedValue(variant === 'floating' ? 0 : 1);
    const profileScale = useSharedValue(1);

    useEffect(() => {
        progress.value = withTiming(variant === 'connected' ? 1 : 0, {
            duration: 400,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [variant]);

    // Reanimated Animated Style
    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            paddingTop: insets.top + 10,
            paddingBottom: interpolate(progress.value, [0, 1], [20, 16]),
            borderBottomLeftRadius: interpolate(progress.value, [0, 1], [24, 0]),
            borderBottomRightRadius: interpolate(progress.value, [0, 1], [24, 0]),
            borderBottomWidth: interpolate(progress.value, [0, 1], [1, 0]),
            // Stabilize shadow on Fabric
            shadowOpacity: interpolate(progress.value, [0, 1], [0.15, 0]),
        };
    });

    // Profile button animation
    const profileAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: profileScale.value }]
    }));

    const handleProfilePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        profileScale.value = withSequence(
            withSpring(0.85, { damping: 10, stiffness: 400 }),
            withSpring(1.1, { damping: 10, stiffness: 400 }),
            withSpring(1, { damping: 15, stiffness: 300 })
        );
        // Delay the actual open so animation plays
        setTimeout(() => onOpenProfile(), 150);
    };

    return (
        <Animated.View
            style={[
                styles.headerContainer,
                animatedContainerStyle
            ]}
            pointerEvents="box-none"
        >
            {/* Background Gradient */}
            <MeshBackground />

            {/* Search Input Area */}
            <Pressable
                style={styles.searchContainer}
                onPress={() => {
                    Haptics.selectionAsync();
                    onSearch?.();
                }}
            >
                <Search size={18} color="rgba(255,255,255,0.5)" />
                <View style={styles.textContainer}>
                    <GalleryText style={styles.searchTitle}>{currentLocation.split(',')[0]} Events</GalleryText>
                    <GalleryText style={styles.searchSubtitle}>
                        {searchQuery ? `Searching "${searchQuery}"` : 'Oct 26 • All Vibes'}
                    </GalleryText>
                </View>
            </Pressable>

            {/* Right Actions */}
            <View style={styles.rightActions}>
                {/* Profile Button with Animation */}
                <Pressable onPress={handleProfilePress}>
                    <Animated.View style={[styles.profileButton, profileAnimatedStyle]}>
                        <UserIcon size={20} color="#FFF" strokeWidth={2} />
                    </Animated.View>
                </Pressable>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,

        // Base Styling (Animated props handle radius/padding)
        borderBottomWidth: 1,
        // Borders colors handled inline or via simple style

        // Shadow (Can be animated too if needed, but fixed is fine)
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, // Reduced shadow
        shadowRadius: 16,
        elevation: 10,
    },
    searchContainer: {
        flex: 1,
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        paddingHorizontal: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    searchTitle: {
        color: COLORS.canvas.white,
        fontSize: 14,
        fontWeight: '700',
    },
    searchSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '500',
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        // backgroundColor: 'rgba(255,255,255,0.05)',
    },
    profileButton: {
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14, // Squircle
        backgroundColor: '#0a0a0a', // Deep black
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
});
