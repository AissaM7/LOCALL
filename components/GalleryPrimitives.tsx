import React from 'react';
import { Text, View, Pressable, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, DESIGN, TYPOGRAPHY } from '../constants/theme';

interface GalleryContainerProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'surface' | 'glass';
}

export const GalleryContainer: React.FC<GalleryContainerProps> = ({ children, style, variant = 'surface' }) => {
    // "Matte" Pivot: Glass variant is now just a softer solid surface
    if (variant === 'glass') {
        return (
            <View style={[styles.glassContainer, style]}>
                <View style={[styles.glassOverlay, style]}>
                    {children}
                </View>
            </View>
        );
    }
    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
};

// Inherit from standard Text Props to support numberOfLines, etc.
interface GalleryTextProps extends React.ComponentProps<typeof Text> {
    children: React.ReactNode;
    type?: 'heading' | 'body' | 'micro';
    color?: string;
}

export const GalleryText: React.FC<GalleryTextProps> = ({
    children,
    type = 'body',
    style,
    color = COLORS.text.primary,
    ...props
}) => {
    const baseStyle = type === 'heading' ? TYPOGRAPHY.headings :
        type === 'micro' ? TYPOGRAPHY.micro : TYPOGRAPHY.body;

    // Fallback for missing fonts
    const fontFamily = Platform.OS === 'ios' ? 'System' : 'Roboto';

    return (
        <Text style={[{
            color,
            fontFamily: fontFamily,
        }, baseStyle, style] as unknown as TextStyle} {...props}>
            {children}
        </Text>
    );
};

interface GalleryButtonProps {
    onPress: () => void;
    label: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const GalleryButton: React.FC<GalleryButtonProps> = ({
    onPress,
    label,
    variant = 'primary',
    style,
    textStyle,
    icon
}) => {
    const getBackgroundColor = () => {
        switch (variant) {
            case 'primary': return COLORS.accents.electricLime; // Neon Yellow
            case 'secondary': return 'transparent'; // Outlined style
            case 'ghost': return 'transparent';
            default: return COLORS.accents.electricLime;
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'primary': return COLORS.text.inverse; // Black text on Neon Button
            case 'secondary': return COLORS.text.primary; // White text on Dark Button
            default: return COLORS.text.primary;
        }
    };

    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onPress();
            }}
            style={({ pressed }) => [
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    transform: pressed ? [{ translateY: 4 }] : [{ translateY: 0 }], // 3D Press Effect
                    borderWidth: variant === 'secondary' ? 2 : 0, // Chunky border for secondary
                    borderColor: COLORS.canvas.fog,
                },
                pressed ? {} : (variant !== 'ghost' ? DESIGN.shadows.pop : {}), // Hide shadow on press to simulate depression
                style
            ]}
        >
            {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
            <GalleryText type="micro" style={StyleSheet.flatten([{ fontSize: 16, color: getTextColor() }, textStyle])}>{label}</GalleryText>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.canvas.fog, // Dark Chocolate (Card)
        borderRadius: DESIGN.borders.radius.squircle,
        padding: 24,
        ...DESIGN.shadows.softHigh, // Still useful for z-index feel
    },
    glassContainer: {
        borderRadius: DESIGN.borders.radius.squircle,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        ...DESIGN.shadows.softLow,
    },
    glassOverlay: {
        backgroundColor: 'rgba(20, 20, 20, 0.85)', // Dark Blur
        padding: 24,
    },
    button: {
        borderRadius: DESIGN.borders.radius.pill,
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    }
});
