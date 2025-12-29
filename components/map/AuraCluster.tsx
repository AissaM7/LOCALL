import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AuraClusterProps {
    count: number;
}

export const AuraCluster = ({ count }: AuraClusterProps) => {
    const size = count > 50 ? 68 : count > 10 ? 58 : 48;
    const radius = size / 2;
    const fontSize = count > 50 ? 18 : 16;

    return (
        <View style={[
            styles.container,
            {
                width: size,
                height: size,
                borderRadius: radius,
            }
        ]}>
            {/* Gradient background as an absolutely positioned layer */}
            <LinearGradient
                colors={['#A2D2FF', '#F472B6', '#C084FC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
            />

            {/* Shine effect */}
            <View style={styles.shine} />

            {/* Text on top */}
            <Text style={[styles.text, { fontSize }]}>
                {count}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        overflow: 'hidden',
        // Glow shadow
        shadowColor: '#F472B6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
        backgroundColor: '#F472B6', // Fallback for shadow
    },
    shine: {
        position: 'absolute',
        top: 4,
        left: 6,
        width: '35%',
        height: '35%',
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        transform: [{ rotate: '-45deg' }],
    },
    text: {
        color: '#FFFFFF',
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        zIndex: 10,
    },
});
