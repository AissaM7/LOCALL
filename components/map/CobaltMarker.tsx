import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { Zap, Mic2, UtensilsCrossed, ShoppingBag, Ticket, MapPin, Coffee, PartyPopper } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, DESIGN } from '../../constants/theme';

interface CobaltMarkerProps {
    category: string;
    isSelected: boolean;
    onPress: () => void;
}

// "Gamified" Color System
const CATEGORY_STYLES: Record<string, { bg: string; icon: string }> = {
    party: { bg: COLORS.accents.bleuGrey, icon: COLORS.canvas.white }, // Salmon
    music: { bg: COLORS.accents.lavender, icon: COLORS.canvas.white }, // Lavender
    food: { bg: COLORS.accents.electricLime, icon: COLORS.text.primary },  // Yellow + Dark Text
    coffee: { bg: COLORS.accents.mint, icon: COLORS.canvas.white }, // Mint
    shop: { bg: COLORS.accents.internationalOrange, icon: COLORS.canvas.white },   // Teal
    art: { bg: COLORS.accents.lavender, icon: COLORS.canvas.white },
    default: { bg: COLORS.canvas.white, icon: COLORS.text.primary }
};

export const CobaltMarker: React.FC<CobaltMarkerProps> = ({ category, isSelected, onPress }) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        if (isSelected) {
            scale.value = withSequence(
                withSpring(1.2, { damping: 8, stiffness: 150 }), // Bouncier
                withSpring(1.1)
            );
        } else {
            scale.value = withSpring(1);
        }
    }, [isSelected]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }, { translateY: isSelected ? -10 : 0 }], // Float up when selected
            zIndex: isSelected ? 10 : 1
        };
    });

    const stylesForCategory = CATEGORY_STYLES[category.toLowerCase()] || CATEGORY_STYLES.default;

    const getIcon = () => {
        // Chunky Icons: 24px, 2.5px stroke
        const props = { color: stylesForCategory.icon, size: 24, strokeWidth: 2.5 };

        switch (category.toLowerCase()) {
            case 'party': return <PartyPopper {...props} />;
            case 'music': return <PartyPopper {...props} />;
            case 'food': return <UtensilsCrossed {...props} />;
            case 'coffee': return <Coffee {...props} />;
            case 'shop': return <ShoppingBag {...props} />;
            case 'art': return <Ticket {...props} />;
            default: return <MapPin {...props} />;
        }
    };

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <Pressable
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); // Heavier impact
                    onPress();
                }}
            >
                <View style={[
                    styles.marker,
                    { backgroundColor: stylesForCategory.bg }
                ]}>
                    {getIcon()}
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 56, // Slightly larger touch target
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    marker: {
        width: 48,
        height: 48,
        borderRadius: 24, // Full Circle
        borderWidth: 3, // Chunky Border
        borderColor: '#FFFFFF',

        // Critical Layout
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',

        // "Pop" 3D Shadow
        ...DESIGN.shadows.pop,
        opacity: 1, // Force solid
        backfaceVisibility: 'hidden',
    }
});
