import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export const MeshBackground = () => {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Base Background */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#100515' }]} />

            {/* Orb 1: Top Left - Deep Purple */}
            <View style={{
                position: 'absolute',
                top: -width * 0.5,
                left: -width * 0.5,
                width: width * 1.5,
                height: width * 1.5,
                borderRadius: width * 0.75,
                backgroundColor: '#2A003D',
                opacity: 0.6
            }} />

            {/* Orb 2: Center Right - Vibrant Pink/Purple */}
            <View style={{
                position: 'absolute',
                top: height * 0.1,
                right: -width * 0.4,
                width: width,
                height: width,
                borderRadius: width / 2,
                backgroundColor: '#5D0085',
                opacity: 0.4
            }} />

            {/* Orb 3: Bottom Left - Accent BleuGrey (Hot Pinkish) */}
            <View style={{
                position: 'absolute',
                bottom: -width * 0.2,
                left: -width * 0.3,
                width: width * 1.2,
                height: width * 1.2,
                borderRadius: width * 0.6,
                backgroundColor: COLORS.accents.bleuGrey,
                opacity: 0.2
            }} />

            {/* Orb 4: Top Right - Subtle Blue */}
            <View style={{
                position: 'absolute',
                top: -100,
                right: -100,
                width: 400,
                height: 400,
                borderRadius: 200,
                backgroundColor: '#001F3F',
                opacity: 0.4
            }} />

            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        </View>
    );
};
