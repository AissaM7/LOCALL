import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, DESIGN } from '../../constants/theme';
import { Plus, Minus } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

interface ZoomControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ onZoomIn, onZoomOut }) => {
    const handlePress = (action: 'in' | 'out') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (action === 'in') onZoomIn();
        else onZoomOut();
    };

    return (
        <View style={styles.container}>
            <View style={styles.shadowWrapper}>
                <BlurView intensity={30} tint="light" style={styles.glassContainer}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => handlePress('in')}
                        activeOpacity={0.6}
                    >
                        <Plus size={24} color="#333333" />
                    </TouchableOpacity>

                    <View style={styles.separator} />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => handlePress('out')}
                        activeOpacity={0.6}
                    >
                        <Minus size={24} color="#333333" />
                    </TouchableOpacity>
                </BlurView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 16,
        top: 160, // Pushed down to avoid clash
        zIndex: 10,
    },
    shadowWrapper: {
        borderRadius: DESIGN.borders.radius.squircle,
        // Glass Shadow (matching LiquidTabBar)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    glassContainer: {
        borderRadius: DESIGN.borders.radius.squircle,
        overflow: 'hidden',
        width: 48,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)', // Frosty border
        backgroundColor: 'rgba(255, 255, 255, 0.15)', // More transparent fill
    },
    button: {
        width: 48,
        height: 48, // Taller buttons for hit area
        alignItems: 'center',
        justifyContent: 'center',
    },
    separator: {
        height: 1,
        width: '60%',
        backgroundColor: 'rgba(0,0,0,0.1)', // Subtle dark divider for light glass
    }
});
