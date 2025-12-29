import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { GalleryText, GalleryContainer } from '../components/GalleryPrimitives';
import { COLORS, DESIGN } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

interface EventChitProps {
    title: string;
    icon: string;
    isSelected?: boolean;
    onPress: () => void;
}

export const EventChit: React.FC<EventChitProps> = ({ title, icon, isSelected, onPress }) => {
    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onPress();
            }}
        >
            <GalleryContainer
                style={[
                    styles.chit,
                    isSelected && styles.selectedChit
                ]}
            >
                <View style={[styles.iconSection, isSelected && styles.selectedIconSection]}>
                    <GalleryText style={{ fontSize: 16 }}>{icon}</GalleryText>
                </View>
                <View style={styles.textSection}>
                    <GalleryText
                        type="micro"
                        style={{ fontSize: 12, color: isSelected ? COLORS.canvas.white : COLORS.text.secondary }}
                    >
                        {isSelected ? title : (title.length > 8 ? title.substring(0, 8) + '...' : title)}
                    </GalleryText>
                </View>
            </GalleryContainer>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    chit: {
        flexDirection: 'row',
        height: 40,
        backgroundColor: COLORS.canvas.white,
        alignItems: 'center',
        padding: 0,
        borderRadius: 999, // Pill
    },
    selectedChit: {
        transform: [{ scale: 1.05 }],
        backgroundColor: COLORS.accents.bleuGrey,
        ...DESIGN.shadows.softHigh,
    },
    iconSection: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        backgroundColor: COLORS.canvas.fog,
        marginLeft: 2,
    },
    selectedIconSection: {
        backgroundColor: COLORS.canvas.white,
    },
    textSection: {
        paddingHorizontal: 12,
        justifyContent: 'center',
    }
});
