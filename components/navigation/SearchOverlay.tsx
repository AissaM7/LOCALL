import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, Pressable, Modal, FlatList, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, DESIGN } from '../../constants/theme';
import { GalleryText } from '../GalleryPrimitives';
import { Search, MapPin, X, ArrowRight, TrendingUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useEvents } from '../../context/EventsContext';

interface SearchOverlayProps {
    visible: boolean;
    onClose: () => void;
    onSelectLocation: (location: string, coordinates?: [number, number]) => void;
    currentLocation: string;
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWlzbWFtZCIsImEiOiJjbWo1MGR6cGIwczhpM2ZvZ2o0Mmc5c3d5In0.kTIbp9rweVCN_SFCjuiE3w'; // Changed to public key for geocoding if possible, or use sk if needed. Wait, sk is secret. Let's use the one from MapScreen.


const SEARCH_SUGGESTIONS = [
    { id: '1', type: 'location', label: 'New York, NY', coordinates: [-73.9973, 40.7308] as [number, number] },
    { id: '2', type: 'location', label: 'Brooklyn, NY', coordinates: [-73.9632, 40.7789] as [number, number] },
    { id: '3', type: 'location', label: 'Los Angeles, CA', coordinates: [-118.2437, 34.0522] as [number, number] },
    { id: '4', type: 'trend', label: 'Rooftop Parties' },
    { id: '5', type: 'trend', label: 'Art Galleries' },
    { id: '6', type: 'trend', label: 'Tech Meetups' },
];
export const SearchOverlay: React.FC<SearchOverlayProps> = ({ visible, onClose, onSelectLocation, currentLocation }) => {
    const { searchQuery, setSearchQuery } = useEvents();
    const [query, setQuery] = useState(searchQuery);
    const [suggestions, setSuggestions] = useState<any[]>(SEARCH_SUGGESTIONS);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        setQuery(searchQuery);
    }, [searchQuery]);

    const handleSearch = async (text: string) => {
        setQuery(text);
        setSearchQuery(text);

        if (text.length > 2) {
            try {
                const response = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
                );
                const json = await response.json();

                if (json.features) {
                    const geocoded = json.features.map((f: any) => ({
                        id: f.id,
                        type: 'location',
                        label: f.place_name,
                        coordinates: f.center, // [lon, lat]
                    }));

                    setSuggestions([...geocoded, ...SEARCH_SUGGESTIONS]);
                }
            } catch (error) {
                console.error('Geocoding error:', error);
            }
        } else if (text.length === 0) {
            setSuggestions(SEARCH_SUGGESTIONS);
        }
    };

    const handleSubmit = () => {
        if (suggestions.length > 0) {
            const first = suggestions[0];
            onSelectLocation(first.label, first.coordinates);
        } else {
            onSelectLocation(query);
        }
        onClose();
    };

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <BlurView intensity={95} tint="dark" style={styles.container}>
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.searchBar}>
                            <Search size={20} color={COLORS.accents.bleuGrey} />
                            <TextInput
                                style={styles.input}
                                placeholder="Search city or event..."
                                placeholderTextColor="#666"
                                value={query}
                                onChangeText={handleSearch}
                                onSubmitEditing={handleSubmit}
                                returnKeyType="search"
                                autoFocus
                            />
                            {query.length > 0 && (
                                <Pressable onPress={() => handleSearch('')}>
                                    <View style={styles.clearButton}>
                                        <X size={12} color="#000" />
                                    </View>
                                </Pressable>
                            )}
                        </View>
                        <Pressable onPress={onClose} style={styles.cancelButton}>
                            <GalleryText style={styles.cancelText}>Cancel</GalleryText>
                        </Pressable>
                    </View>

                    {/* Content */}
                    <View style={styles.results}>
                        <GalleryText style={styles.sectionTitle}>SUGGESTED</GalleryText>

                        <FlatList
                            data={suggestions}
                            keyExtractor={item => item.id}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <Pressable
                                    style={styles.resultItem}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        onSelectLocation(item.label, item.coordinates);
                                        onClose();
                                    }}
                                >
                                    <View style={[styles.iconBox, item.type === 'trend' && styles.trendIcon]}>
                                        {item.type === 'location' ? (
                                            <MapPin size={18} color={COLORS.canvas.white} />
                                        ) : (
                                            <TrendingUp size={18} color={COLORS.canvas.pureBlack} />
                                        )}
                                    </View>
                                    <GalleryText style={styles.resultText}>{item.label}</GalleryText>
                                    <ArrowRight size={16} color="#666" style={{ marginLeft: 'auto' }} />
                                </Pressable>
                            )}
                        />
                    </View>

                </Animated.View>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 20,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        height: 50,
        backgroundColor: '#1a1a1a',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#333',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 10,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    clearButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#666',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    cancelText: {
        color: COLORS.canvas.white,
        fontSize: 16,
        fontWeight: '600',
    },
    results: {
        flex: 1,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 16,
        letterSpacing: 1,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    trendIcon: {
        backgroundColor: COLORS.accents.electricLime,
    },
    resultText: {
        fontSize: 16,
        color: COLORS.canvas.white,
        fontWeight: '500',
    }
});
