import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Modal, Pressable, Dimensions, TextInput, PanResponder, PanResponderInstance, GestureResponderEvent, Keyboard } from 'react-native';
import { COLORS, DESIGN } from '../../constants/theme';
import { GalleryText } from '../GalleryPrimitives';
import { X, Navigation, MapPin, Search } from 'lucide-react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import * as turf from '@turf/helpers';
import circle from '@turf/circle';
import { useEvents } from '../../context/EventsContext';
import * as Haptics from 'expo-haptics';

// Mapbox access token - using secret key for geocoding
const MAPBOX_ACCESS_TOKEN = 'sk.eyJ1IjoiYWlzbWFtZCIsImEiOiJjbWo1MGR6cGIwczhpM2ZvZ2o0Mmc5c3d5In0.kTIbp9rweVCN_SFCjuiE3w';

interface LocationFilterModalProps {
    visible: boolean;
    onClose: () => void;
}

interface SearchSuggestion {
    id: string;
    place_name: string;
    center: [number, number];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DEFAULT_CENTER: [number, number] = [-73.935242, 40.730610];

// Custom Slider Component to avoid native dependencies
interface CustomSliderProps {
    value: number;
    onValueChange: (value: number) => void;
    minimumValue: number;
    maximumValue: number;
}

const CustomSlider: React.FC<CustomSliderProps> = ({ value, onValueChange, minimumValue, maximumValue }) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const widthRef = useRef(0);
    const propsRef = useRef({ value, onValueChange, minimumValue, maximumValue });

    // Update refs on every render
    propsRef.current = { value, onValueChange, minimumValue, maximumValue };

    const handleTouch = (evt: GestureResponderEvent) => {
        const width = widthRef.current;
        if (width === 0) return;

        const { locationX } = evt.nativeEvent;
        // locationX is relative to the target. If target is thumb, it messes up. 
        // We should ideally use moveX and pageX, but layout measurement is async.
        // Simple fix: If pointerEvents is 'box-only' on container? No, we need thumb to be visible.
        // Alternative: Use the Slider track as the responder target, or just trust locationX if strict.

        // Better: Clamping percentage based on locationX relative to the view
        const percentage = Math.max(0, Math.min(1, locationX / width));

        const { minimumValue, maximumValue, onValueChange } = propsRef.current;
        const newValue = minimumValue + percentage * (maximumValue - minimumValue);
        onValueChange(Math.round(newValue));
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => handleTouch(evt),
            onPanResponderMove: (evt) => handleTouch(evt),
        })
    ).current;

    const percentage = (value - minimumValue) / (maximumValue - minimumValue);

    return (
        <View
            style={styles.sliderContainer}
            onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                setContainerWidth(w);
                widthRef.current = w;
            }}
            {...panResponder.panHandlers}
        >
            {/* Background Track - PointerEvents none to let Container handle touch */}
            <View style={styles.trackBackground} pointerEvents="none" />

            {/* Active Track */}
            <View style={[styles.trackActive, { width: `${percentage * 100}%` }]} pointerEvents="none" />

            {/* Thumb */}
            <View
                style={[styles.thumb, { left: `${percentage * 100}%`, marginLeft: -12 }]}
                pointerEvents="none"
            />
        </View>
    );
};

export const LocationFilterModal: React.FC<LocationFilterModalProps> = ({ visible, onClose }) => {
    const { searchRadius, setSearchRadius, searchLocation, setSearchLocation } = useEvents();
    const [localRadius, setLocalRadius] = useState(searchRadius);
    const [centerCoordinate, setCenterCoordinate] = useState<[number, number]>(
        searchLocation ? [searchLocation.lon, searchLocation.lat] : DEFAULT_CENTER
    );
    const [locationName, setLocationName] = useState(searchLocation?.name || 'New York, NY');
    const [searchText, setSearchText] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const mapRef = useRef<MapboxGL.MapView>(null);
    const cameraRef = useRef<MapboxGL.Camera>(null);

    // Sync local state when modal opens
    useEffect(() => {
        if (visible) {
            setLocalRadius(searchRadius);
            if (searchLocation) {
                setCenterCoordinate([searchLocation.lon, searchLocation.lat]);
                setLocationName(searchLocation.name);
            }
            setSearchText('');
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [visible, searchRadius, searchLocation]);

    // Debounced search function
    const searchPlaces = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        console.log('[LocationSearch] Searching for:', query);

        try {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&autocomplete=true&types=place,locality,neighborhood&limit=5`;
            console.log('[LocationSearch] Fetching:', url);

            const response = await fetch(url);
            const data = await response.json();

            console.log('[LocationSearch] Response:', data);

            if (data.features && data.features.length > 0) {
                const results: SearchSuggestion[] = data.features.map((feature: any) => ({
                    id: feature.id,
                    place_name: feature.place_name,
                    center: feature.center as [number, number],
                }));
                console.log('[LocationSearch] Setting suggestions:', results);
                setSuggestions(results);
                setShowSuggestions(true);
            } else {
                console.log('[LocationSearch] No features found');
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } catch (error) {
            console.error('[LocationSearch] Geocoding error:', error);
        }
    }, []);

    // Handle search text change with debouncing
    const handleSearchChange = (text: string) => {
        setSearchText(text);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            searchPlaces(text);
        }, 300);
    };

    // Handle suggestion selection
    const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Keyboard.dismiss();

        setCenterCoordinate(suggestion.center);
        setLocationName(suggestion.place_name.split(',')[0] + ', ' + (suggestion.place_name.split(',')[1] || '').trim());
        setSearchText('');
        setSuggestions([]);
        setShowSuggestions(false);

        // Animate camera to new location
        cameraRef.current?.setCamera({
            centerCoordinate: suggestion.center,
            zoomLevel: 11,
            animationDuration: 1000
        });
    };

    // Generate circle polygon for visualization
    const radiusCircle = circle(centerCoordinate, localRadius, {
        steps: 64,
        units: 'miles'
    });

    const handleApply = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setSearchRadius(localRadius);
        setSearchLocation({
            lon: centerCoordinate[0],
            lat: centerCoordinate[1],
            name: locationName
        });

        onClose();
    };

    // Debounce reverse geocoding
    const reverseGeocodeTimeout = useRef<NodeJS.Timeout>();

    const updateLocationFromMap = async (coords: [number, number]) => {
        setCenterCoordinate(coords);

        // Clear pending timeout
        if (reverseGeocodeTimeout.current) {
            clearTimeout(reverseGeocodeTimeout.current);
        }

        // Debounce API call
        reverseGeocodeTimeout.current = setTimeout(async () => {
            try {
                const reverse = await Location.reverseGeocodeAsync({
                    latitude: coords[1],
                    longitude: coords[0]
                });

                if (reverse[0]) {
                    // Prioritize neighborhood/district for more specific context
                    const name = reverse[0].district || reverse[0].city || reverse[0].region || 'Unknown Location';
                    const region = reverse[0].city && reverse[0].city !== name ? reverse[0].city : reverse[0].region;
                    setLocationName(region ? `${name}, ${region}` : name);
                }
            } catch (e) {
                console.log('Reverse geocode failed', e);
            }
        }, 500);
    };

    const handleZoom = async (delta: number) => {
        if (!cameraRef.current) return;
        const currentZoom = await mapRef.current?.getZoom();
        if (currentZoom !== undefined) {
            cameraRef.current.zoomTo(currentZoom + delta, 300);
        }
    };

    const handleUseCurrentLocation = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            const newCoords: [number, number] = [longitude, latitude];

            setCenterCoordinate(newCoords);
            cameraRef.current?.setCamera({
                centerCoordinate: newCoords,
                zoomLevel: 11,
                animationDuration: 1000
            });

            // Reverse geocode for name
            const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (reverse[0]) {
                const name = `${reverse[0].city || reverse[0].district || ''}, ${reverse[0].region || ''}`;
                setLocationName(name);
            }

        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <X color="#FFF" size={24} />
                        </Pressable>
                        <GalleryText style={styles.title}>Choose location</GalleryText>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Search size={18} color="rgba(255,255,255,0.5)" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by city, neighborhood or ZIP"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={searchText}
                                onChangeText={handleSearchChange}
                                returnKeyType="search"
                                autoCapitalize="words"
                                autoCorrect={false}
                            />
                            {searchText.length > 0 && (
                                <Pressable onPress={() => { setSearchText(''); setSuggestions([]); setShowSuggestions(false); }}>
                                    <X size={18} color="rgba(255,255,255,0.5)" />
                                </Pressable>
                            )}
                        </View>

                        {/* Suggestions Dropdown - Inside searchContainer for proper z-index */}
                        {showSuggestions && suggestions.length > 0 && (
                            <View style={styles.suggestionsContainer}>
                                {suggestions.map((suggestion, index) => (
                                    <Pressable
                                        key={suggestion.id}
                                        style={[
                                            styles.suggestionItem,
                                            index === suggestions.length - 1 && styles.suggestionItemLast
                                        ]}
                                        onPress={() => handleSelectSuggestion(suggestion)}
                                    >
                                        <MapPin size={16} color={COLORS.accents.mint} />
                                        <GalleryText style={styles.suggestionText} numberOfLines={1}>
                                            {suggestion.place_name}
                                        </GalleryText>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Map View */}
                    <View style={styles.mapContainer}>
                        <MapboxGL.MapView
                            ref={mapRef}
                            style={styles.map}
                            styleURL="mapbox://styles/mapbox/dark-v11"
                            scrollEnabled={true}
                            zoomEnabled={true}
                            logoEnabled={false}
                            attributionEnabled={false}
                            onMapIdle={(state) => {
                                const centerCoords = state.properties.center as [number, number];
                                updateLocationFromMap(centerCoords);
                            }}
                        >
                            <MapboxGL.Camera
                                ref={cameraRef}
                                zoomLevel={10}
                                centerCoordinate={centerCoordinate}
                                animationMode="flyTo"
                                animationDuration={1000}
                            />

                            {/* Radius Circle */}
                            <MapboxGL.ShapeSource id="radiusSource" shape={radiusCircle}>
                                <MapboxGL.FillLayer
                                    id="radiusFill"
                                    style={{
                                        fillColor: '#FFFFFF',
                                        fillOpacity: 0.08
                                    }}
                                />
                                <MapboxGL.LineLayer
                                    id="radiusStroke"
                                    style={{
                                        lineColor: COLORS.accents.mint,
                                        lineWidth: 2,
                                        lineOpacity: 0.7,
                                        lineDasharray: [4, 2]
                                    }}
                                />
                            </MapboxGL.ShapeSource>



                        </MapboxGL.MapView>

                        {/* Static Center Dot Overlay */}
                        <View style={styles.centerDotOverlay} pointerEvents="none">
                            <View style={styles.centerDot} />
                        </View>

                        {/* Zoom Controls */}
                        <View style={styles.zoomControls}>
                            <Pressable
                                style={[styles.zoomButton, styles.zoomButtonTop]}
                                onPress={() => handleZoom(1)}
                            >
                                <GalleryText style={styles.zoomText}>+</GalleryText>
                            </Pressable>
                            <Pressable
                                style={[styles.zoomButton, styles.zoomButtonBottom]}
                                onPress={() => handleZoom(-1)}
                            >
                                <GalleryText style={styles.zoomText}>-</GalleryText>
                            </Pressable>
                        </View>

                        <View style={styles.locationOverlay}>
                            <GalleryText style={styles.locationName}>{locationName}</GalleryText>
                            <GalleryText style={styles.radiusLabel}>
                                {localRadius < 1 ? 'Just here' : `Within ${localRadius.toFixed(0)} miles`}
                            </GalleryText>
                        </View>

                        <Pressable style={styles.locateMeButton} onPress={handleUseCurrentLocation}>
                            <Navigation color="#FFF" size={20} fill={COLORS.accents.internationalOrange} />
                            <GalleryText style={styles.locateMeText}>Locate me</GalleryText>
                        </Pressable>
                    </View>

                    {/* Controls */}
                    <View style={styles.controls}>
                        <View style={styles.sliderHeader}>
                            <GalleryText style={styles.sliderLabel}>Custom radius</GalleryText>
                            <GalleryText style={styles.sliderValue}>{localRadius.toFixed(0)} mi</GalleryText>
                        </View>

                        <CustomSlider
                            value={localRadius}
                            minimumValue={1}
                            maximumValue={50}
                            onValueChange={setLocalRadius}
                        />

                        <Pressable style={styles.applyButton} onPress={handleApply}>
                            <GalleryText style={styles.applyButtonText}>Apply</GalleryText>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    content: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        height: '85%',
        ...DESIGN.shadows.softHigh,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    searchContainer: {
        position: 'relative',
        paddingHorizontal: 20,
        paddingVertical: 12,
        zIndex: 1000,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#FFF',
        padding: 0,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 58,
        left: 0,
        right: 0,
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 15,
        zIndex: 1001,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    suggestionItemLast: {
        borderBottomWidth: 0,
    },
    suggestionText: {
        flex: 1,
        fontSize: 14,
        color: '#FFF',
    },
    mapContainer: {
        height: 300,
        width: '100%',
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    centerDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FFF',
        borderWidth: 3,
        borderColor: COLORS.accents.mint,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    locationOverlay: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    locationName: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
    radiusLabel: {
        color: '#ccc',
        fontSize: 12,
        marginTop: 2,
    },
    locateMeButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: COLORS.accents.mint,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 5,
    },
    locateMeText: {
        color: '#0a0a0a',
        fontWeight: '700',
        fontSize: 14,
    },
    controls: {
        padding: 24,
    },
    sliderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sliderLabel: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    sliderValue: {
        color: COLORS.accents.mint,
        fontSize: 16,
        fontWeight: '700',
    },
    sliderContainer: {
        height: 40,
        marginBottom: 32,
        justifyContent: 'center',
    },
    trackBackground: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        width: '100%',
        position: 'absolute',
    },
    trackActive: {
        height: 4,
        backgroundColor: COLORS.accents.mint,
        borderRadius: 2,
        position: 'absolute',
    },
    thumb: {
        position: 'absolute',
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FFF',
        borderWidth: 3,
        borderColor: COLORS.accents.mint,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    centerDotOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    zoomControls: {
        position: 'absolute',
        top: 20,
        right: 12,
        backgroundColor: 'rgba(28, 28, 30, 0.9)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        width: 44,
        alignItems: 'center',
        overflow: 'hidden',
    },
    zoomButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    zoomButtonTop: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    zoomButtonBottom: {},
    zoomText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '300',
    },
    applyButton: {
        backgroundColor: COLORS.accents.mint,
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 'auto',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    applyButtonText: {
        color: '#0a0a0a',
        fontSize: 17,
        fontWeight: '700',
    }
});
