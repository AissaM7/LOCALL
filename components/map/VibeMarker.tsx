import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface VibeMarkerProps {
    icon: string;
    size?: number;
}

// Vibrant solid colors
const VIBE_COLORS = [
    '#FF6B9D', '#A78BFA', '#06B6D4', '#84CC16',
    '#FB923C', '#8B5CF6', '#34D399', '#F87171',
];

const getColorForEmoji = (emoji: string): string => {
    const hash = emoji.codePointAt(0) || 0;
    return VIBE_COLORS[hash % VIBE_COLORS.length];
};

export const VibeMarker: React.FC<VibeMarkerProps> = ({ icon, size = 60 }) => {
    const color = getColorForEmoji(icon);
    const containerSize = size * 1.5;
    const centerOffset = (containerSize - size) / 2;

    return (
        <View style={[styles.markerContainer, { width: containerSize, height: containerSize }]}>
            {/* Layer 1: Glow */}
            <View style={[
                styles.absoluteLayer,
                {
                    width: size * 1.2,
                    height: size * 1.2,
                    borderRadius: size * 0.6,
                    backgroundColor: color,
                    opacity: 0.25,
                    top: (containerSize - size * 1.2) / 2,
                    left: (containerSize - size * 1.2) / 2,
                }
            ]} />

            {/* Layer 2: Main Circle */}
            <View style={[
                styles.absoluteLayer,
                styles.mainCircle,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    top: centerOffset,
                    left: centerOffset,
                }
            ]} />

            {/* Layer 3: Shine */}
            <View style={[
                styles.absoluteLayer,
                {
                    width: size * 0.3,
                    height: size * 0.3,
                    borderRadius: size * 0.15,
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                    top: centerOffset + size * 0.15,
                    left: centerOffset + size * 0.15,
                }
            ]} />

            {/* Layer 4: Emoji */}
            <Text style={[
                styles.emojiText,
                {
                    fontSize: size * 0.45,
                    lineHeight: size,
                    width: size,
                    height: size,
                    top: centerOffset,
                    left: centerOffset,
                }
            ]}>
                {icon}
            </Text>

            {/* Layer 5: Shadow */}
            <View style={[
                styles.absoluteLayer,
                {
                    width: size * 0.6,
                    height: size * 0.12,
                    borderRadius: size * 0.3,
                    backgroundColor: '#000',
                    opacity: 0.15,
                    bottom: containerSize * 0.15,
                    left: (containerSize - size * 0.6) / 2,
                }
            ]} />
        </View>
    );
};

const styles = StyleSheet.create({
    markerContainer: {
        position: 'relative',
    },
    absoluteLayer: {
        position: 'absolute',
    },
    mainCircle: {
        borderWidth: 3,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 6,
    },
    emojiText: {
        position: 'absolute',
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
});
