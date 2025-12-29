import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { GalleryText } from '../GalleryPrimitives';
import { COLORS, EVENT_FONTS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

export type FontStyle = 'fancy' | 'literary' | 'digital' | 'elegant' | 'simple';

interface StyleSelectorProps {
    selectedStyle: FontStyle;
    onSelectStyle: (style: FontStyle) => void;
    previewText: string;
}

const FONT_STYLES: { key: FontStyle; label: string }[] = [
    { key: 'fancy', label: 'Fancy' },
    { key: 'literary', label: 'Literary' },
    { key: 'digital', label: 'Digital' },
    { key: 'elegant', label: 'Elegant' },
    { key: 'simple', label: 'Simple' },
];

export const StyleSelector: React.FC<StyleSelectorProps> = ({
    selectedStyle,
    onSelectStyle,
    previewText,
}) => {
    return (
        <View style={styles.container}>
            <GalleryText style={styles.label}>FONT STYLE</GalleryText>

            {/* Font Style Pills */}
            <View style={styles.pillsContainer}>
                {FONT_STYLES.map((style) => (
                    <Pressable
                        key={style.key}
                        style={[
                            styles.pill,
                            selectedStyle === style.key && styles.pillActive
                        ]}
                        onPress={() => {
                            onSelectStyle(style.key);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    >
                        <Text style={[
                            styles.pillText,
                            selectedStyle === style.key && styles.pillTextActive
                        ]}>
                            {style.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Live Preview */}
            {previewText && (
                <View style={styles.previewContainer}>
                    <Text style={[
                        styles.previewText,
                        EVENT_FONTS[selectedStyle],
                    ]}>
                        {previewText}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    label: {
        fontSize: 11,
        color: '#999',
        marginBottom: 12,
        letterSpacing: 1,
    },
    pillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#2a2420',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    pillActive: {
        backgroundColor: '#3a3430',
        borderColor: '#555',
    },
    pillText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#999',
    },
    pillTextActive: {
        color: COLORS.canvas.white,
        fontWeight: '600',
    },
    previewContainer: {
        marginTop: 20,
        padding: 20,
        backgroundColor: '#2a2420',
        borderRadius: 12,
        alignItems: 'center',
    },
    previewText: {
        fontSize: 24,
        color: COLORS.canvas.white,
        textAlign: 'center',
    },
});
