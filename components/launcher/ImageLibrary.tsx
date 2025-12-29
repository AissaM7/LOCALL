import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, FlatList, Pressable, Image, Modal, ActivityIndicator } from 'react-native';
import { GalleryText } from '../GalleryPrimitives';
import { COLORS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import axios from 'axios';

const PEXELS_API_KEY = 'zolBeHXcqKCfgu0vdmTvqQ3Fl3srHefA2XGrtfnr7s2qaca4Q7ZE2dbl';

// The "Chaos" Variable - Random vibe keywords to make it feel authentic
const VIBE_KEYWORDS = [
    'flash photography',
    'film grain',
    'motion blur',
    'lo-fi',
    'polaroid',
    'disposable camera',
    'direct flash',
    'neon lights',
    'vintage filter',
    '35mm film',
];

// Category base queries (before modification)
const CATEGORY_BASE_QUERIES: Record<string, string> = {
    trending: 'party celebration',
    party: 'party friends gathering',
    aesthetic: 'aesthetic pastel dreamy',
    y2k: 'y2k retro 2000s',
    coquette: 'pink feminine flowers',
    vibey: 'moody night city',
};

interface PexelsPhoto {
    id: number;
    src: {
        original: string;
        large2x: string;
        large: string;
        medium: string;
        small: string;
    };
    photographer: string;
    alt: string;
}

interface ImageLibraryProps {
    visible: boolean;
    onClose: () => void;
    onSelectImage: (imageUrl: string) => void;
}

export const ImageLibrary: React.FC<ImageLibraryProps> = ({ visible, onClose, onSelectImage }) => {
    const [selectedCategory, setSelectedCategory] = useState('trending');
    const [searchQuery, setSearchQuery] = useState('');
    const [images, setImages] = useState<PexelsPhoto[]>([]);
    const [loading, setLoading] = useState(false);

    const IMAGE_CATEGORIES = [
        { key: 'trending', label: 'Trending' },
        { key: 'party', label: 'Party' },
        { key: 'aesthetic', label: 'Aesthetic' },
        { key: 'y2k', label: 'Y2K' },
        { key: 'coquette', label: 'Coquette' },
        { key: 'vibey', label: 'Vibey' },
    ];

    useEffect(() => {
        if (visible) {
            fetchImages();
        }
    }, [selectedCategory, visible]);

    // The "Keyword Injection" - Add random vibe modifier
    const getRandomVibeKeyword = (): string => {
        return VIBE_KEYWORDS[Math.floor(Math.random() * VIBE_KEYWORDS.length)];
    };

    // The "Search Interception" - Transform user query
    const interceptSearch = (userQuery: string): string => {
        const vibeModifier = getRandomVibeKeyword();
        return `${userQuery} ${vibeModifier}`;
    };

    const fetchImages = async (customQuery?: string) => {
        setLoading(true);
        try {
            // Get base query from category or custom search
            const baseQuery = customQuery || CATEGORY_BASE_QUERIES[selectedCategory] || 'party';

            // Apply "Search Interception" - add vibe modifier
            const interceptedQuery = interceptSearch(baseQuery);

            console.log('🎨 Vibe Generator:', { original: baseQuery, intercepted: interceptedQuery });

            const response = await axios.get('https://api.pexels.com/v1/search', {
                params: {
                    query: interceptedQuery,
                    per_page: 20,
                    orientation: 'landscape',
                },
                headers: {
                    Authorization: PEXELS_API_KEY,
                },
            });

            setImages(response.data.photos);
        } catch (error) {
            console.error('Pexels fetch error:', error);
            setImages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            fetchImages(searchQuery);
        }
    };

    const handleSelectImage = (url: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSelectImage(url);
        onClose();
    };

    if (!visible) return null;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={onClose} style={styles.closeButton}>
                    <X color={COLORS.canvas.white} size={24} />
                </Pressable>
                <GalleryText style={styles.title}>Find an image</GalleryText>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search vibes..."
                    placeholderTextColor="#666"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
            </View>

            {/* Category Tabs */}
            <View style={styles.categoryTabs}>
                {IMAGE_CATEGORIES.map((cat) => (
                    <Pressable
                        key={cat.key}
                        style={[
                            styles.categoryTab,
                            selectedCategory === cat.key && styles.categoryTabActive
                        ]}
                        onPress={() => {
                            setSelectedCategory(cat.key);
                            setSearchQuery('');
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    >
                        <GalleryText style={StyleSheet.flatten([
                            styles.categoryTabText,
                            selectedCategory === cat.key && styles.categoryTabTextActive
                        ])}>
                            {cat.label}
                        </GalleryText>
                    </Pressable>
                ))}
            </View>

            {/* Image Grid with "Film Glaze" Filter */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.accents.bleuGrey} />
                    <GalleryText style={styles.loadingText}>Loading vibes...</GalleryText>
                </View>
            ) : (
                <FlatList
                    data={images}
                    numColumns={2}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.gridContainer}
                    renderItem={({ item }) => (
                        <Pressable
                            style={styles.imageCard}
                            onPress={() => handleSelectImage(item.src.large)}
                        >
                            {/* The "Visual Glaze" - Image with film effect */}
                            <Image
                                source={{ uri: item.src.medium }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                            <View style={styles.filmGlaze} />
                        </Pressable>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <GalleryText style={styles.emptyText}>
                                No vibes found. Try searching!
                            </GalleryText>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#1a1410',
        zIndex: 2000, // Ensure it's on top of everything
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 16,
    },
    closeButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.canvas.white,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    searchInput: {
        backgroundColor: '#2a2420',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: COLORS.canvas.white,
    },
    categoryTabs: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 8,
        flexWrap: 'wrap',
    },
    categoryTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#2a2420',
    },
    categoryTabActive: {
        backgroundColor: '#444',
    },
    categoryTabText: {
        fontSize: 14,
        color: '#999',
    },
    categoryTabTextActive: {
        color: COLORS.canvas.white,
        fontWeight: '600',
    },
    gridContainer: {
        padding: 8,
    },
    imageCard: {
        flex: 1,
        margin: 8,
        aspectRatio: 2,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#2a2420',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    // The "Visual Glaze" - CSS filter overlay for film look
    filmGlaze: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 200, 150, 0.08)', // Warm film tint
        opacity: 1,
        mixBlendMode: 'multiply',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        color: '#999',
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        marginTop: 60,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
        textAlign: 'center',
    },
});
