import React, { useEffect, useState, useMemo, useRef } from 'react';
import { StyleSheet, View, Pressable, Text as RNText } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { COLORS, DESIGN } from '../../constants/theme';
import * as Location from 'expo-location';
import { EventData } from '../../constants/events';
import { EventBottomSheet } from './EventBottomSheet';
import { EventPreviewCard } from './EventPreviewCard';
import { featureCollection, point } from '@turf/helpers';
import Supercluster from 'supercluster';
import { ZoomControls } from './ZoomControls';
import { useRouter } from 'expo-router';
// import { User } from 'lucide-react-native';
// import { ProfileMenu } from '../profile/ProfileMenu';
import * as Haptics from 'expo-haptics';
import { MeshBackground } from '../MeshBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuraCluster } from './AuraCluster';

Mapbox.setAccessToken('sk.eyJ1IjoiYWlzbWFtZCIsImEiOiJjbWo1MGR6cGIwczhpM2ZvZ2o0Mmc5c3d5In0.kTIbp9rweVCN_SFCjuiE3w');

const NEON_STREETS_STYLE = 'mapbox://styles/mapbox/light-v11';

interface MapScreenProps {
    onEventSelect?: (eventId: string | null) => void;
    onOpenFeed?: () => void;
    events: EventData[];
    newEventId?: string | null;
    showBridge?: boolean;
    cameraPosition?: [number, number] | null;
}

export const MapScreen: React.FC<MapScreenProps> = ({
    onEventSelect,
    onOpenFeed,
    events,
    newEventId,
    showBridge,
    cameraPosition,
}) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);


    // Sync isDetailOpen with parent - REMOVED

    const [initialBottomSheetTab, setInitialBottomSheetTab] = useState<'info' | 'chat'>('info');
    const [clusterPoints, setClusterPoints] = useState<any[]>([]);

    const [isMapReady, setIsMapReady] = useState(false);
    const cameraRef = React.useRef<Mapbox.Camera>(null);
    const mapRef = React.useRef<Mapbox.MapView>(null);

    // Supercluster for tracking which events are clustered
    const supercluster = useMemo(() => new Supercluster({
        radius: 50,
        maxZoom: 14
    }), []);



    const selectedEvent = useMemo(() =>
        events.find((e: EventData) => e.id === selectedEventId) || null
        , [selectedEventId, events]);

    // Initialize supercluster with events
    useEffect(() => {
        const features = events.map((e: EventData) => {
            // Pre-calculate color consistent with ID
            const color = ['#FF6B9D', '#A78BFA', '#06B6D4', '#84CC16', '#FB923C', '#F472B6'][e.id.charCodeAt(0) % 6];

            return point(e.coordinates, {
                eventId: e.id,
                category: e.category,
                title: e.title,
                icon: e.icon || '🎉',
                color: color
            });
        });
        supercluster.load(features as any);
        // Initial clustering will be triggered when map is ready
    }, [events]);

    // Fly to new event when posted
    const prevNewEventIdRef = useRef<string | null | undefined>(newEventId);

    // Sync external ID changes (e.g. from List or Closing Sheet)
    useEffect(() => {
        // Only act if newEventId actually changed (avoid clearing on random renders)
        if (newEventId !== prevNewEventIdRef.current) {
            if (newEventId) {
                // External Select (e.g. from List)
                const newEvent = events.find((e: EventData) => e.id === newEventId);
                if (newEvent && Array.isArray(newEvent.coordinates) && !isNaN(newEvent.coordinates[0])) {
                    cameraRef.current?.setCamera({
                        centerCoordinate: newEvent.coordinates,
                        zoomLevel: 15,
                        animationDuration: 1500,
                    });
                    setSelectedEventId(newEventId);
                }
            } else {
                // External Clear (e.g. closed sheet)
                // If the global focus is cleared, we should clear the map card too
                setSelectedEventId(null);
            }
            prevNewEventIdRef.current = newEventId;
        }
    }, [newEventId, events]);

    // Fly to searched location (e.g., "Boston")
    useEffect(() => {
        if (cameraPosition) {
            cameraRef.current?.setCamera({
                centerCoordinate: cameraPosition,
                zoomLevel: 12, // Zoom out a bit for city view
                animationDuration: 2000,
            });
        }
    }, [cameraPosition]);

    // Create GeoJSON for native cluster rendering (bubbles/numbers only)
    const clusterFeatures = useMemo(() => {
        return featureCollection(
            clusterPoints
                .filter(p => p.properties.cluster) // Only clusters
                .map(p => point(p.geometry.coordinates, p.properties))
        );
    }, [clusterPoints]);

    // Get list of unclustered event IDs
    const unclusteredEventIds = useMemo(() => {
        return new Set(
            clusterPoints
                .filter(p => !p.properties.cluster)
                .map(p => p.properties.eventId)
        );
    }, [clusterPoints]);

    useEffect(() => {
        (async () => {
            await Location.requestForegroundPermissionsAsync();
        })();
    }, []);

    const updateClusters = async (zoom?: number) => {
        if (!mapRef.current || !isMapReady) return;

        try {
            const bounds = await mapRef.current.getVisibleBounds();
            const currentZoom = zoom ?? await mapRef.current.getZoom();

            if (bounds && typeof currentZoom === 'number') {
                const bbox = [
                    bounds[1][0], // West
                    bounds[1][1], // South
                    bounds[0][0], // East
                    bounds[0][1]  // North
                ] as [number, number, number, number];

                const clusters = supercluster.getClusters(bbox, Math.floor(currentZoom));
                setClusterPoints(clusters);
            }
        } catch (error) {
            // Map view not ready yet, ignore error
            console.log('Map not ready for clustering');
        }
    };

    const handleZoom = async (delta: number) => {
        const zoom = await mapRef.current?.getZoom();
        if (typeof zoom === 'number') {
            cameraRef.current?.zoomTo(zoom + delta, 1000);
        }
    };

    const handleClusterPress = async (event: any) => {
        const feature = event.features[0];
        if (!feature || !feature.properties.cluster) return;

        const coordinates = feature.geometry.coordinates;
        const currentZoom = await mapRef.current?.getZoom();
        cameraRef.current?.setCamera({
            centerCoordinate: coordinates,
            zoomLevel: (currentZoom || 12) + 2,
            animationDuration: 500,
        });
    };

    return (
        <View style={styles.container}>
            <Mapbox.MapView
                ref={mapRef}
                style={styles.map}
                styleURL={NEON_STREETS_STYLE}
                logoEnabled={false}
                attributionEnabled={false}
                scaleBarEnabled={false}
                onPress={() => {
                    setSelectedEventId(null);
                    onEventSelect?.(null);
                }}
                onDidFinishLoadingMap={() => {
                    setIsMapReady(true);
                    updateClusters(12.5);
                }}
                onMapIdle={() => updateClusters()}
            >
                <Mapbox.Camera
                    ref={cameraRef}
                    defaultSettings={{
                        zoomLevel: 12.5,
                        centerCoordinate: [-73.9973, 40.7308],
                    }}
                    animationMode={'flyTo'}
                    animationDuration={2000}
                />

                <Mapbox.UserLocation androidRenderMode={'gps'} minDisplacement={5} />

                {/* Skinning Layers: Water & Parks */}
                <Mapbox.VectorSource id="skin-layer-light" url="mapbox://mapbox.mapbox-streets-v8">
                    {/* Water: Teal wash */}
                    <Mapbox.FillLayer
                        id="skin-water-light"
                        sourceLayerID="water"
                        style={{
                            fillColor: '#4ECDC4', // Teal (Restored)
                            fillOpacity: 0.15,
                        }}
                    />
                    {/* Parks: Mint wash */}
                    <Mapbox.FillLayer
                        id="skin-parks-light"
                        sourceLayerID="landuse"
                        filter={['==', 'class', 'park']}
                        style={{
                            fillColor: '#00B894', // Mint (Restored)
                            fillOpacity: 0.2,
                        }}
                    />
                </Mapbox.VectorSource>

                {/* Aura Bubble Clusters - React Native PointAnnotation for glassmorphism effect */}
                {clusterPoints
                    .filter(feature => feature.properties.cluster)
                    .map((feature) => {
                        const clusterId = feature.id || feature.properties.cluster_id;
                        const pointCount = feature.properties.point_count;
                        const coordinate = feature.geometry.coordinates;

                        return (
                            <Mapbox.PointAnnotation
                                key={`cluster-${clusterId}`}
                                id={`cluster-${clusterId}`}
                                coordinate={coordinate}
                                onSelected={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    handleClusterPress({ features: [feature] });
                                }}
                            >
                                <AuraCluster count={pointCount} />
                            </Mapbox.PointAnnotation>
                        );
                    })
                }

                {/* Individual Event Markers - EMOJI FIX ROLLBACK */}
                {events
                    .filter((event: EventData) => unclusteredEventIds.has(event.id))
                    .map((event: EventData) => {
                        return (
                            <Mapbox.PointAnnotation
                                key={event.id}
                                id={event.id}
                                coordinate={event.coordinates}
                                onSelected={() => {
                                    setSelectedEventId(event.id);
                                    // Don't auto-open sheet on simple tap? Or do we?
                                    // User flow: Tap Pin -> Show Preview Card?
                                    // Or Tap Pin -> Show Full Details?
                                    // For now, let's behave like Airbnb: Tap -> Card. Card Tap -> Details.
                                }}
                            >
                                <View
                                    style={{
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 50,
                                        height: 50,
                                        borderRadius: 25,
                                        backgroundColor: 'white',
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.25,
                                        shadowRadius: 3.84,
                                        elevation: 5,
                                    }}
                                >
                                    <RNText
                                        allowFontScaling={false}
                                        style={{ fontSize: 30, textAlign: 'center' }}
                                    >
                                        {event.icon || '📍'}
                                    </RNText>
                                </View>
                            </Mapbox.PointAnnotation>
                        );
                    })}
            </Mapbox.MapView>

            {/* Background Bridge - Fills the gap behind header/corners when sheet is open */}
            {/* Rendered before everything else to stay in back */}
            {showBridge && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: insets.top + 100, // Reduced height
                        overflow: 'hidden'
                    }}
                    pointerEvents="none"
                >
                    <MeshBackground />
                </View>
            )}

            {/* Show Zoom Controls only when no sheet/card is obstructing */}
            {!selectedEvent && !showBridge && (
                <ZoomControls
                    onZoomIn={() => handleZoom(1)}
                    onZoomOut={() => handleZoom(-1)}
                />
            )}

            {/* Airbnb-style Preview Card */}
            {selectedEvent && selectedEventId && !showBridge && (
                <EventPreviewCard
                    event={selectedEvent}
                    onPress={() => {
                        // Open full details (handled by parent now)
                        onEventSelect?.(selectedEventId);
                    }}
                    onOpenChat={() => {
                        // Chat logic
                        onEventSelect?.(selectedEventId);
                    }}
                    onClose={() => setSelectedEventId(null)}
                />
            )}

            {/* Original Bottom Sheet (Moved to app root) */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.canvas.porcelain,
    },
    map: {
        flex: 1,
    },
    profileButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 56, // Larger
        height: 56,
        backgroundColor: COLORS.canvas.fog, // Dark button
        borderRadius: DESIGN.borders.radius.squircle, // Squircle!
        borderWidth: 2, // Chunky
        borderColor: COLORS.canvas.white,
        alignItems: 'center',
        justifyContent: 'center',
        ...DESIGN.shadows.pop, // Pop shadow
        zIndex: 50
    }
});
