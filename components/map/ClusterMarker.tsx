
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { COLORS, DESIGN } from '../../constants/theme';
import { GalleryText } from '../GalleryPrimitives';
import * as Haptics from 'expo-haptics';

interface ClusterMarkerProps {
    count: number;
    onPress: () => void;
}

export const ClusterMarker: React.FC<ClusterMarkerProps> = ({ count, onPress }) => {
    // Color logic same as MapScreen Native
    const getColor = (c: number) => {
        if (c >= 50) return COLORS.accents.bleuGrey; // Salmon
        if (c >= 10) return COLORS.accents.internationalOrange; // Teal
        return COLORS.accents.electricLime; // Yellow
    };

    const bg = getColor(count);
    const textColor = count < 10 ? COLORS.text.primary : COLORS.canvas.white;

    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onPress();
            }}
            style={styles.container}
        >
            <View style={[styles.bubble, { backgroundColor: bg }]}>
                <GalleryText
                    type="heading"
                    style={{
                        color: textColor,
                        fontSize: 18,
                        // "Quirky" Font Tweaks
                        fontFamily: 'System',
                        fontWeight: '900', // Extra Black
                    }}
                >
                    {count}
                </GalleryText>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bubble: {
        minWidth: 56,
        height: 56,
        paddingHorizontal: 12,
        borderRadius: 28, // Fully rounded
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: COLORS.canvas.white,
        ...DESIGN.shadows.pop,
    }
});
