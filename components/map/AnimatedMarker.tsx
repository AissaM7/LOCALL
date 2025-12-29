import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { COLORS, DESIGN } from '../../constants/theme';
import { BlurView } from 'expo-blur';

interface AnimatedMarkerProps {
    icon: string;
    isSelected?: boolean;
}

export const AnimatedMarker: React.FC<AnimatedMarkerProps> = ({ icon, isSelected }) => {
    const scale = isSelected ? 1.2 : 1;

    return (
        <View style={[styles.container, { transform: [{ scale }] }]}>
            {/* 3D Sticker Look */}
            <View style={styles.shadowLayer} />
            <View style={[styles.marker, isSelected && styles.selectedMarker]}>
                <Svg height="48" width="48" viewBox="0 0 48 48">
                    {/* White Stroke Circle */}
                    <Circle cx="24" cy="24" r="23" fill={COLORS.canvas.white} />
                    {/* Inner color if selected */}
                    {isSelected && <Circle cx="24" cy="24" r="23" fill={COLORS.accents.bleuGrey} opacity={0.2} />}
                    <SvgText
                        x="24"
                        y="32" // Adjusted for middle alignment
                        fontSize="24"
                        textAnchor="middle"
                        fill="black" // Fallback
                    >
                        {icon}
                    </SvgText>
                </Svg>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shadowLayer: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'black',
        opacity: 0.15,
        transform: [{ translateY: 4 }],
        zIndex: 0,
    },
    marker: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    selectedMarker: {
        // Additional highlight if selected
        shadowColor: COLORS.accents.bleuGrey,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
    }
});
