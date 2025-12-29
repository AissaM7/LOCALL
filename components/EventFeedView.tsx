import { View, StyleSheet, FlatList, Image, Pressable, Dimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { COLORS, DESIGN, EVENT_FONTS } from '../constants/theme';
import { GalleryText } from './GalleryPrimitives';
import { EventData } from '../constants/events';
import { Heart, User, Calendar, MapPin } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { MeshBackground } from './MeshBackground';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';

interface EventFeedViewProps {
    events: EventData[];
    onEventPress?: (event: EventData) => void;
    asBottomSheet?: boolean;
}

const { width } = Dimensions.get('window');

import { TouchableOpacity } from 'react-native-gesture-handler';

export const EventFeedView = ({ events, onEventPress, asBottomSheet = false }: EventFeedViewProps) => {

    const handleAction = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const renderItem = ({ item }: { item: EventData }) => (
        <TouchableOpacity
            style={styles.cardContainer}
            activeOpacity={0.95}
            onPress={() => onEventPress?.(item)}
        >
            {/* Main Image Layer */}
            <View style={styles.imageContainer}>
                {/* Fallback color/gradient if no image, or the actual image */}
                <View style={[styles.imagePlaceholder, { backgroundColor: item.fontStyle === 'digital' ? '#000' : '#2a2420' }]}>
                    <Image
                        source={{ uri: item.headerImage || `https://source.unsplash.com/random/800x1000/?${item.category},party` }}
                        style={styles.image}
                        resizeMode="cover"
                    />

                    {/* Big Emoji Backdrop (Only visible if image fails or is transparent, or adds tint) 
                        Actually, with cover image, this is hidden. 
                        Let's hide it if we have an image, or keep it as a fallback visual? 
                        The opacity logic in styles makes it an overlay?
                        Style says absoluteFillObject.
                        Refined: Only show if NO headerImage is present to avoid clutter? 
                        User wants "images ... translated". 
                    */}
                    {!item.headerImage && (
                        <View style={styles.emojiBackdrop}>
                            <GalleryText type="heading" style={{ fontSize: 120, opacity: 0.2 }}>{item.icon}</GalleryText>
                        </View>
                    )}
                </View>

                {/* Smooth Gradient Overlay (SVG) */}
                <View style={styles.gradientContainer}>
                    <Svg height="100%" width="100%">
                        <Defs>
                            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor="black" stopOpacity="0" />
                                <Stop offset="0.5" stopColor="black" stopOpacity="0.6" />
                                <Stop offset="1" stopColor="black" stopOpacity="0.95" />
                            </LinearGradient>
                        </Defs>
                        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
                    </Svg>
                </View>

                {/* Top Overlay: Host Info */}
                <View style={styles.hostRow}>
                    <BlurView intensity={20} tint="light" style={styles.hostPill}>
                        <View style={styles.hostAvatar}>
                            <User size={12} color={COLORS.text.inverse} />
                        </View>
                        <GalleryText type="micro" style={styles.hostName}>Hosted by You</GalleryText>
                    </BlurView>
                    <Pressable onPress={handleAction} style={styles.iconButton}>
                        <Heart color="white" size={24} />
                    </Pressable>
                </View>

                {/* Bottom Content */}
                <View style={styles.cardContent}>
                    {/* Vibe Tags */}
                    <View style={styles.tagRow}>
                        <View style={styles.tag}>
                            <GalleryText type="micro" style={styles.tagText}>{item.category.toUpperCase()}</GalleryText>
                        </View>
                        <View style={[styles.tag, { backgroundColor: COLORS.accents.electricLime }]}>
                            <GalleryText type="micro" style={[styles.tagText, { color: COLORS.text.inverse }]}>POPULAR</GalleryText>
                        </View>
                    </View>

                    {/* Title */}
                    <GalleryText
                        type="heading"
                        style={[
                            styles.title,
                            // Apply custom font style from event data
                            item.fontStyle && EVENT_FONTS[item.fontStyle],
                            // Override font size to ensure it's large in the feed, unless specifically desired small?
                            // Let's keep the base size unless the font style is drastically different.
                            // The mix might be tricky. Let's explicitly force the size 36 back if we want uniformity,
                            // or trust the designer. 
                            // But EVENT_FONTS.literary has size 28. That's small.
                            // I will simply apply the object. If it looks off, we adjust.
                        ]}
                    >
                        {item.title}
                    </GalleryText>

                    {/* Meta Data Row */}
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Calendar size={14} color={COLORS.accents.lavender} />
                            <GalleryText type="body" style={styles.metaText}>{item.time}</GalleryText>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.metaItem}>
                            <MapPin size={14} color={COLORS.accents.lavender} />
                            <GalleryText type="body" style={styles.metaText}>{item.fullAddress || 'Secret Location'}</GalleryText>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const ListComponent = asBottomSheet ? BottomSheetFlatList : FlatList;

    // Only apply snap props if NOT in bottom sheet mode
    const snapProps = asBottomSheet ? {} : {
        decelerationRate: 'fast' as 'fast',
        snapToInterval: width * 1.3,
        disableIntervalMomentum: true,
    };

    if (asBottomSheet) {
        return (
            <ListComponent
                data={events}
                renderItem={renderItem}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={[styles.listContainer, { paddingTop: 130 }]}
                showsVerticalScrollIndicator={false}
                {...snapProps}
            />
        );
    }

    return (
        <View style={styles.container}>
            <MeshBackground />
            <ListComponent
                data={events}
                renderItem={renderItem}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                {...snapProps}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Fallback
    },
    listContainer: {
        paddingTop: 60,
        paddingBottom: 120, // Space for Liquid Nav
        gap: 24,
    },
    cardContainer: {
        width: width,
        height: width * 1.25, // 4:5 Aspect Ratio (Insta style)
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageContainer: {
        width: width - 24, // Slight margin
        height: '100%',
        borderRadius: 32, // Squircle equivalent
        overflow: 'hidden',
        backgroundColor: COLORS.canvas.fog,
        ...DESIGN.shadows.pop, // Pop shadow
    },
    imagePlaceholder: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.6, // Darken it a bit
    },
    emojiBackdrop: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradientContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%', // Taller for smoother fade
    },
    hostRow: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    hostPill: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        paddingRight: 12,
        borderRadius: 999,
        gap: 8,
        overflow: 'hidden',
    },
    hostAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.accents.bleuGrey,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hostName: {
        color: 'white',
        fontWeight: '600',
    },
    iconButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 22,
    },
    cardContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        gap: 12,
    },
    tagRow: {
        flexDirection: 'row',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tagText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: 1,
    },
    title: {
        fontSize: 36,
        lineHeight: 38,
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        color: COLORS.accents.lavender,
        fontWeight: '600',
    },
    separator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
});
