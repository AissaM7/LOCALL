import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { CircleLayer, SymbolLayer } from '@rnmapbox/maps';
import { COLORS } from '../../constants/theme';

interface PartifulMarkerProps {
    icon: string; // Emoji
    coordinates: [number, number];
    onPress?: () => void;
}

export const PartifulMarker: React.FC<PartifulMarkerProps> = ({ icon, coordinates }) => {
    // Create a feature for the emoji marker
    const markerFeature = {
        type: 'Feature' as const,
        geometry: {
            type: 'Point' as const,
            coordinates: coordinates,
        },
        properties: {
            icon: icon,
        },
    };

    const geojson = {
        type: 'FeatureCollection' as const,
        features: [markerFeature],
    };

    return (
        <>
            {/* Background Circle with Gradient-like Effect */}
            <CircleLayer
                id={`marker-bg-${coordinates.join('-')}`}
                sourceID="emoji-markers"
                style={{
                    circleRadius: 28,
                    circleColor: '#FF6B9D', // Partiful pink
                    circleOpacity: 0.9,
                    circleBlur: 0.5,
                    circleStrokeWidth: 3,
                    circleStrokeColor: '#FFF',
                    circleStrokeOpacity: 0.9,
                }}
            />

            {/* Emoji Symbol on Top */}
            <SymbolLayer
                id={`marker-emoji-${coordinates.join('-')}`}
                sourceID="emoji-markers"
                style={{
                    textField: icon,
                    textSize: 24,
                    textOffset: [0, 0],
                    textAnchor: 'center',
                }}
            />
        </>
    );
};

const styles = StyleSheet.create({
    // Kept for potential custom views later
});
