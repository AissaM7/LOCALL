import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';

interface AvatarSpriteProps {
    index: number;
    size?: number;
    style?: any;
    source: ImageSourcePropType;
    totalColumns?: number;
    totalRows?: number;
    sheetWidth: number;
    sheetHeight: number;
}

export const AvatarSprite: React.FC<AvatarSpriteProps> = ({
    index,
    size = 100,
    style,
    source,
    totalColumns = 4,
    totalRows = 10,
    sheetWidth,
    sheetHeight
}) => {
    // Calculate sprite dimensions (unscaled)
    const spriteWidth = sheetWidth / totalColumns;
    const spriteHeight = sheetHeight / totalRows;

    // Calculate position in grid
    const col = index % totalColumns;
    const row = Math.floor(index / totalColumns);

    // Scale to COVER the container size (Aspect Fill)
    // We scale such that the smaller dimension of the sprite fills the container
    const scale = Math.max(size / spriteWidth, size / spriteHeight);

    // Calculate the dimensions of the specific sprite after scaling
    const renderedSpriteWidth = spriteWidth * scale;
    const renderedSpriteHeight = spriteHeight * scale;

    // Calculate centering offsets (to center the sprite in the container)
    // If the sprite is wider than the container, this will be negative (centering the crop)
    const offsetX = (size - renderedSpriteWidth) / 2;
    const offsetY = (size - renderedSpriteHeight) / 2;

    // Calculate how much we need to shift the whole sheet to bring the desired sprite to (0,0)
    // The sprite is at (col * spriteWidth, row * spriteHeight) in unscaled coordinates
    const sheetShiftX = -col * spriteWidth * scale;
    const sheetShiftY = -row * spriteHeight * scale;

    // Total translation = Move sprite to 0,0 + Center sprite in container
    const totalX = sheetShiftX + offsetX;
    const totalY = sheetShiftY + offsetY;

    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            <Image
                source={source}
                style={{
                    width: sheetWidth * scale,
                    height: sheetHeight * scale,
                    transform: [
                        { translateX: totalX },
                        { translateY: totalY }
                    ],
                    position: 'absolute',
                    left: 0,
                    top: 0
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        backgroundColor: '#1E0030', // Background color for loading/gaps
    }
});
