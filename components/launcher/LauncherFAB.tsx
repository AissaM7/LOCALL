import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, DESIGN, TYPOGRAPHY } from '../../constants/theme';
import { GalleryText } from '../GalleryPrimitives';

interface LauncherFABProps {
    onPress: () => void;
}

export const LauncherFAB: React.FC<LauncherFABProps> = ({ onPress }) => {
    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onPress();
            }}
            style={({ pressed }) => [
                styles.fab,
                pressed && styles.fabPressed
            ]}
        >
            <GalleryText
                type="heading"
                style={styles.label}
            >
                post
            </GalleryText>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 20,
        height: 54,
        paddingHorizontal: 28,
        borderRadius: 20, // Soft Squircle "Chic"
        backgroundColor: COLORS.accents.bleuGrey,
        alignItems: 'center',
        justifyContent: 'center',
        // Modern diffuse shadow
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 10,
        zIndex: 100,
        borderCurve: 'continuous', // iOS smooth corners
    },
    fabPressed: {
        transform: [{ scale: 0.96 }],
        opacity: 0.9,
    },
    label: {
        color: COLORS.canvas.white,
        fontSize: 20, // Slightly larger
        fontWeight: '600',
        letterSpacing: -0.5, // Tight and cool
        // Lowercase handled in render
    }
});
