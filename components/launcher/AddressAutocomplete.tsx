import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { GalleryText } from '../GalleryPrimitives';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

const MAPBOX_ACCESS_TOKEN = 'sk.eyJ1IjoiYWlzbWFtZCIsImEiOiJjbWo1MGR6cGIwczhpM2ZvZ2o0Mmc5c3d5In0.kTIbp9rweVCN_SFCjuiE3w';

export interface AddressData {
    fullAddress: string;
    coordinates: [number, number]; // [lon, lat]
    placeName: string;
}

interface AddressSuggestion {
    id: string;
    place_name: string;
    center: [number, number];
    text: string;
}

interface AddressAutocompleteProps {
    value: string;
    onChangeText: (text: string) => void;
    onSelectAddress: (data: AddressData) => void;
    placeholder?: string;
    style?: any;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
    value,
    onChangeText,
    onSelectAddress,
    placeholder = '[ Place ]',
    style
}) => {
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [justSelected, setJustSelected] = useState(false);

    useEffect(() => {
        // Don't search if we just selected an address
        if (justSelected) {
            setJustSelected(false);
            return;
        }

        const timer = setTimeout(() => {
            if (value.length > 2) {
                fetchSuggestions(value);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300); // Debounce

        return () => clearTimeout(timer);
    }, [value]);

    const fetchSuggestions = async (query: string) => {
        setLoading(true);
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&autocomplete=true&limit=5&types=address,place,poi`
            );
            const data = await response.json();

            if (data.features) {
                setSuggestions(data.features);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
        const addressData: AddressData = {
            fullAddress: suggestion.place_name,
            coordinates: suggestion.center,
            placeName: suggestion.text,
        };

        // Set flag to prevent re-searching
        setJustSelected(true);
        onChangeText(suggestion.text);
        onSelectAddress(addressData);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={[styles.input, style]}
                placeholder={placeholder}
                placeholderTextColor={COLORS.text.secondary}
                value={value}
                onChangeText={onChangeText}
                autoCapitalize="words"
            />

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={COLORS.accents.bleuGrey} />
                </View>
            )}

            {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    <FlatList
                        data={suggestions}
                        keyExtractor={(item, index) => `${item.id}-${index}`}
                        scrollEnabled={false}
                        renderItem={({ item, index }) => (
                            <Pressable
                                style={[
                                    styles.suggestionItem,
                                    index === suggestions.length - 1 && styles.suggestionItemLast
                                ]}
                                onPress={() => handleSelectSuggestion(item)}
                            >
                                <GalleryText type="body" style={styles.suggestionText}>
                                    {item.place_name}
                                </GalleryText>
                            </Pressable>
                        )}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 1000,
    },
    input: {
        fontFamily: 'System',
        fontWeight: '800',
        fontSize: 22,
        color: COLORS.accents.bleuGrey,
        backgroundColor: COLORS.canvas.fog,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        marginHorizontal: 4,
        marginVertical: 4,
        minWidth: 120,
        textAlign: 'center',
        height: 50,
    },
    loadingContainer: {
        position: 'absolute',
        right: 16,
        top: 16,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 58,
        left: 4,
        right: 4,
        backgroundColor: COLORS.canvas.fog, // Dark background
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#3a3430', // Slightly lighter border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, // Darker shadow
        shadowRadius: 12,
        elevation: 8,
        maxHeight: 250,
        zIndex: 1001,
    },
    suggestionItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#3a3430',
    },
    suggestionItemLast: {
        borderBottomWidth: 0,
    },
    suggestionText: {
        fontSize: 14,
        color: COLORS.text.primary, // White text
    },
});
