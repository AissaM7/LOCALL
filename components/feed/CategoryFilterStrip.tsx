import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { COLORS } from '../../constants/theme';
import { GalleryText } from '../GalleryPrimitives';
import * as Haptics from 'expo-haptics';

interface CategoryFilterStripProps {
    selectedCategory: string | null;
    onSelectCategory: (category: string | null) => void;
}

// Chic, minimal category labels
const CATEGORIES = [
    { id: null, label: 'All' },
    { id: 'shop', label: 'Shopping' },
    { id: 'music', label: 'Live Music' },
    { id: 'art', label: 'Art' },
    { id: 'food', label: 'Food' },
    { id: 'coffee', label: 'Chill' },
    { id: 'coworking', label: 'Coworking' },
    { id: 'sports', label: 'Sports' },
];

export const CategoryFilterStrip: React.FC<CategoryFilterStripProps> = ({
    selectedCategory,
    onSelectCategory
}) => {
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;

                    return (
                        <Pressable
                            key={cat.id || 'all'}
                            style={[
                                styles.pill,
                                isSelected && styles.selectedPill
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                onSelectCategory(cat.id);
                            }}
                        >
                            <GalleryText
                                style={[
                                    styles.pillText,
                                    isSelected && styles.selectedText
                                ]}
                            >
                                {cat.label}
                            </GalleryText>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    selectedPill: {
        backgroundColor: '#FFF',
        borderColor: '#FFF',
    },
    pillText: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 0.3,
    },
    selectedText: {
        color: '#000',
        fontWeight: '600',
    },
});
