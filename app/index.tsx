import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { MapScreen } from '../components/map/MapScreen';
import { LauncherFAB } from '../components/launcher/LauncherFAB';
import { LiquidTabBar } from '../components/LiquidTabBar';
import { EventFeedView } from '../components/EventFeedView';
import { EventBottomSheet } from '../components/map/EventBottomSheet';
import { ListingsBottomSheet } from '../components/map/ListingsBottomSheet';
import { PartifulEventCreator } from '../components/launcher/PartifulEventCreator';
import { TopNavigation } from '../components/navigation/TopNavigation';
import { ProfileMenu } from '../components/profile/ProfileMenu';
import { SearchOverlay } from '../components/navigation/SearchOverlay';
import { COLORS } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';
import { MOCK_EVENTS, EventData } from '../constants/events';
import * as Haptics from 'expo-haptics';
import { useEvents } from '../context/EventsContext';
import { supabase } from '../lib/supabase';

export default function Index() {
    const [isLauncherOpen, setIsLauncherOpen] = useState(false);
    const { events, refreshEvents, filteredEvents, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = useEvents();
    const [newEventId, setNewEventId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [cameraPosition, setCameraPosition] = useState<[number, number] | null>(null);
    const [backRoute, setBackRoute] = useState<'list' | null>(null);
    // [lon, lat]
    const [currentAddress, setCurrentAddress] = useState("New York, NY");

    // Handle Deep Links
    useEffect(() => {
        const handleDeepLink = (event: { url: string }) => {
            const { path, queryParams } = Linking.parse(event.url);
            if (path && path.startsWith('event/')) {
                const eventId = path.split('/')[1];
                if (eventId) {
                    setNewEventId(eventId);
                    setActiveTab('map');
                }
            }
        };

        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink({ url });
        });

        const subscription = Linking.addEventListener('url', handleDeepLink);
        return () => subscription.remove();
    }, []);

    const handleLaunch = async (data: {
        title: string;
        description: string;
        coordinates: [number, number];
        fullAddress: string;
        category: string;
        icon: string;
        headerImage: string;
        fontStyle: 'fancy' | 'literary' | 'digital' | 'elegant' | 'simple';
        startTime: Date;
        endTime: Date;
    }) => {
        // 1. Ensure User
        let { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
            if (anonError) {
                console.error("Anonymous sign-in failed:", anonError);
                // Alert the user (in dev) or fail gracefully
                alert(`Auth Error: ${anonError.message}`);
            }
            user = anonData?.user || null;
        }

        if (!user) {
            console.error("Failed to sign in - User is null");
            return;
        }

        // 2. Insert into DB
        // Note: Postgres Point format is often strictly checked.
        // We use string representation `(x,y)` for safety.
        const pointStr = `(${data.coordinates[0]},${data.coordinates[1]})`;

        const { data: inserted, error } = await supabase.from('events').insert({
            creator_id: user.id,
            title: data.title || 'Untitled Event',
            description: data.description,
            coordinates: pointStr as any,
            full_address: data.fullAddress,
            category: data.category as any,
            icon: data.icon, // Save the custom emoji
            start_time: data.startTime.toISOString(),
            end_time: data.endTime.toISOString(),
            header_image_url: data.headerImage,
            font_style: data.fontStyle,
        } as any).select().single();

        if (error) {
            console.error("Error creating event:", error);
            return;
        }

        if (inserted) {
            setNewEventId((inserted as any).id);
            await refreshEvents(); // Refresh context

            setIsLauncherOpen(false);
            setActiveTab('map');

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => setNewEventId(null), 2000);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Top Navigation - Always Visible */}
            <TopNavigation
                onOpenProfile={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setIsProfileOpen(true);
                }}
                currentLocation={currentAddress}
                onSearch={() => setIsSearchOpen(true)}
                variant={activeTab === 'list' || isSheetOpen ? 'connected' : 'floating'}
            />

            {/* Main Content Area */}
            <View style={{ flex: 1 }}>
                <MapScreen
                    events={filteredEvents}
                    newEventId={newEventId}
                    onOpenFeed={() => setActiveTab('list')}
                    showBridge={activeTab === 'list' || isSheetOpen}
                    cameraPosition={cameraPosition}
                    onEventSelect={(eventId) => {
                        // When map pin is clicked, update global selection (opens sheet)
                        if (eventId) {
                            setNewEventId(eventId);
                            setIsSheetOpen(true);
                        }
                    }}
                // We will replace MapScreen internal logic.
                // For now, let's just coordinate via newEventId.
                />

                <ListingsBottomSheet
                    events={filteredEvents}
                    isOpen={activeTab === 'list'}
                    onClose={() => setActiveTab('map')}
                    onEventPress={(event) => {
                        // Just open details, keep List in background
                        setNewEventId(event.id);
                        setIsSheetOpen(true);

                        if (event.coordinates) {
                            setCameraPosition(event.coordinates);
                        }
                    }}
                />
            </View>

            {/* Liquid Glass Navigation - Hidden only when EventBottomSheet is open */}
            {!isSheetOpen && (
                <LiquidTabBar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onPost={() => setIsLauncherOpen(true)}
                />
            )}

            <PartifulEventCreator
                visible={isLauncherOpen}
                onClose={() => setIsLauncherOpen(false)}
                onSubmit={handleLaunch}
            />

            <ProfileMenu
                visible={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                onFindEvents={() => {
                    setIsProfileOpen(false);
                    setActiveTab('list');
                }}
                onCreateEvent={() => {
                    setIsProfileOpen(false);
                    setIsLauncherOpen(true);
                }}
                onEventSelect={(event) => {
                    setNewEventId(event.id);
                    setIsSheetOpen(true);
                    // Don't change activeTab - overlay on whatever we are on
                    if (event.coordinates) {
                        setCameraPosition(event.coordinates);
                    }
                }}
            />

            <SearchOverlay
                onSelectLocation={(loc, coords) => {
                    setIsSearchOpen(false);
                    if (coords) {
                        setCameraPosition(coords);
                        setCurrentAddress(loc);
                    } else {
                        setSearchQuery(loc);
                    }
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                visible={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                currentLocation={currentAddress}
            />

            {/* Global Event Details Sheet - Renders ON TOP of everything */}
            {isSheetOpen && (
                <EventBottomSheet
                    event={events.find(e => e.id === newEventId) || null}
                    onBack={activeTab === 'list' ? () => setIsSheetOpen(false) : undefined}
                    onClose={() => {
                        setIsSheetOpen(false);
                        setNewEventId(null);
                    }}
                />
            )}
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.canvas.porcelain,
    }
});
