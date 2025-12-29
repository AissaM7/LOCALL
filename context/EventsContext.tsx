import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { EventData, MOCK_EVENTS } from '../constants/events';
import { Alert } from 'react-native';
import { point } from '@turf/helpers';
import distance from '@turf/distance';

interface EventsContextType {
    events: EventData[]; // All events from DB
    myMoves: EventData[]; // "LOCKED IN" (going)
    savedEvents: EventData[]; // "INTERESTED" (maybe)
    loading: boolean;
    refreshEvents: () => Promise<void>;
    toggleRSVP: (event: EventData) => Promise<void>;
    toggleSaved: (event: EventData) => Promise<void>;
    isLockedIn: (eventId: string) => boolean;
    isSaved: (eventId: string) => boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedCategory: string | null;
    setSelectedCategory: (category: string | null) => void;
    filteredEvents: EventData[];
    searchRadius: number;
    setSearchRadius: (radius: number) => void;
    searchLocation: { lat: number; lon: number; name: string } | null;
    setSearchLocation: (location: { lat: number; lon: number; name: string } | null) => void;
}


const EventsContext = createContext<EventsContextType | undefined>(undefined);

export default function EventsProvider({ children }: { children: React.ReactNode }) {
    const [events, setEvents] = useState<EventData[]>(MOCK_EVENTS);
    const [myMoves, setMyMoves] = useState<EventData[]>([]);     // status = 'going'
    const [savedEvents, setSavedMoves] = useState<EventData[]>([]); // status = 'maybe'
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('start_time', { ascending: true });

            if (error) throw error;

            // Map DB shape to App shape
            const formattedEvents: EventData[] = (data as any[] || []).map(e => {
                // Parse coordinates from Postgres POINT string "(x,y)" or other formats
                let coords: [number, number] = [0, 0];
                try {
                    if (typeof e.coordinates === 'string') {
                        // Handle "(lat, lon)", "(lon, lat)", "POINT(lon lat)", "lon, lat"
                        const cleaned = e.coordinates.replace(/[()POINT]/g, '').trim();
                        const parts = cleaned.includes(',') ? cleaned.split(',') : cleaned.split(/\s+/);

                        let val1 = parseFloat(parts[0]);
                        let val2 = parseFloat(parts[1]);

                        if (!isNaN(val1) && !isNaN(val2)) {
                            // NYC logic: Lon ~ -74, Lat ~ 40
                            // If val1 is positive (~40) and val2 is negative (~-74), they are definitely [lat, lon]
                            // Mapbox expects [lon, lat]
                            if (val1 > 0 && val2 < 0) {
                                coords = [val2, val1];
                            } else {
                                coords = [val1, val2];
                            }
                        }
                    } else if (typeof e.coordinates === 'object' && e.coordinates !== null) {
                        const x = e.coordinates.x ?? e.coordinates.lon ?? e.coordinates.longitude;
                        const y = e.coordinates.y ?? e.coordinates.lat ?? e.coordinates.latitude;

                        if (typeof x === 'number' && typeof y === 'number') {
                            // Apply same swap logic for objects if they are definitely [lat, lon]
                            if (x > 0 && y < 0) {
                                coords = [y, x];
                            } else {
                                coords = [x, y];
                            }
                        }
                    }
                } catch (err) {
                    console.error('Coordinate parsing failed for event', e.id, err);
                }

                return {
                    id: e.id,
                    title: e.title,
                    description: e.description || '',
                    coordinates: coords,
                    category: (e.category as any) || 'party',
                    icon: (e.icon as string) || '📍', // Use DB icon or fallback
                    time: new Date(e.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
                    headerImage: e.header_image_url || undefined,
                    fontStyle: (e.font_style as any) || 'simple',
                    startTime: new Date(e.start_time),
                    endTime: e.end_time ? new Date(e.end_time) : undefined,
                    fullAddress: e.full_address || '',
                };
            });

            // Merge MOCK_EVENTS with DB events, ensuring uniqueness by ID
            let allEvents = [...formattedEvents];
            MOCK_EVENTS.forEach(mock => {
                if (!allEvents.find(e => e.id === mock.id)) {
                    allEvents.push(mock);
                }
            });

            // FINAL SAFETY: Deduplicate by ID
            // (In case DB returns duplicates or mock logic fails)
            allEvents = Array.from(new Map(allEvents.map(item => [item.id, item])).values());

            setEvents(allEvents);
        } catch (e) {
            console.error('Error fetching events:', e);
        }
    };

    const fetchMyRSVPs = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Anonymous users see nothing for now

        const { data, error } = await supabase
            .from('rsvps')
            .select('event_id, status')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching RSVPs:', error);
            return;
        }

        // We need to filter 'events' based on these IDs.
        // Dependent on 'events' being loaded. 
        // Better pattern: Store just IDs or fetch relations? 
        // For simplicity: We will filter from the already loaded 'events' state in the effect, 
        // OR we can just store the IDs here if performance is a concern.
        // Let's rely on 'events' availability.
    };

    // Combined fetch for startup
    const refreshEvents = async () => {
        setLoading(true);
        await fetchEvents();

        // Fetch RSVPs
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: rsvps } = await supabase
                .from('rsvps')
                .select('event_id, status')
                .eq('user_id', user.id);

            if (rsvps) {
                // We need to match these IDs to the full event objects we just fetched.
                // Since state updates are async, we can't read 'events' immediately.
                // We should return them from fetchEvents or wait.
                // Let's simplify: fetchEvents sets state. We can derived myMoves/saved in a specific useEffect or use a Selector.
                // BUT, to keep the context API clean 'myMoves: EventData[]', we need to compute it.

                // Let's re-query the events for these IDs? No, wasteful.
                // Let's allow the UI to derive it or store IDs locally and compute in render?
                // Actually, storing just IDs is safer for consistency.
                // But the interface says `EventData[]`.

                // Hacky but works: We will just wait for the next render cycle or use the data we got from step 1 if we chained it.
                // Let's try to do it all in one go if possible, or use a `useEffect` dependency.
            }
        }
        setLoading(false);
    };

    const [searchRadius, setSearchRadius] = useState<number>(10); // Default 10 miles/km
    const [searchLocation, setSearchLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const matchesSearch = !searchQuery ||
                event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.fullAddress?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = !selectedCategory || event.category === selectedCategory;

            // Geospatial Filter
            let matchesLocation = true;
            if (searchLocation && event.coordinates) {
                // event.coordinates is [lon, lat]
                // turf/distance takes [lon, lat]
                const from = point([searchLocation.lon, searchLocation.lat]);
                const to = point(event.coordinates);
                const dist = distance(from, to, { units: 'miles' });

                if (dist > searchRadius) {
                    matchesLocation = false;
                }
            }

            return matchesSearch && matchesCategory && matchesLocation;
        });
    }, [events, searchQuery, selectedCategory, searchRadius, searchLocation]);

    // Effect: Sync RSVPs whenever 'events' or 'user' changes
    useEffect(() => {
        const syncRSVPs = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || events.length === 0) {
                setMyMoves([]);
                setSavedMoves([]);
                return;
            }

            const { data } = await supabase
                .from('rsvps')
                .select('event_id, status')
                .eq('user_id', user.id);

            const rsvps = data as any[]; // Cast to bypass TS error

            if (rsvps) {
                const goingIds = new Set(rsvps.filter((r: any) => r.status === 'going').map((r: any) => r.event_id));
                const maybeIds = new Set(rsvps.filter((r: any) => r.status === 'maybe').map((r: any) => r.event_id));

                setMyMoves(events.filter(e => goingIds.has(e.id)));
                setSavedMoves(events.filter(e => maybeIds.has(e.id)));
            }
        };

        syncRSVPs();
    }, [events]);

    useEffect(() => {
        refreshEvents();

        // Realtime Subscription for new Events
        const subscription = supabase
            .channel('public:events')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
                fetchEvents(); // Simple re-fetch strategy
            })
            .subscribe();

        return () => { subscription.unsubscribe(); };
    }, []);

    // Toggle Logic
    const toggleRSVP = async (event: EventData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            Alert.alert("Sign In Needed", "You need to be signed in to RSVP.");
            // Ideally trigger auth flow here
            // await signInAnonymously() or similar? 
            // For Phase 1, assume anonymous auth isn't set up yet, but let's just create an anon user automatically?
            // Actually, we should probably auto-sign-in anonymously if they aren't.
            const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
            if (anonError) {
                Alert.alert("Error", "Could not sign in.");
                return;
            }
            // Retry after sign in
            if (anonData.user) {
                // proceed
            }
        }

        // Re-check user
        const { data: { user: authedUser } } = await supabase.auth.getUser();
        if (!authedUser) return;

        const isGoing = myMoves.find(m => m.id === event.id);

        if (isGoing) {
            setMyMoves(prev => prev.filter(m => m.id !== event.id));
            await supabase.from('rsvps').delete().eq('event_id', event.id).eq('user_id', authedUser.id);
        } else {
            setMyMoves(prev => [...prev, event]);
            // If saved, remove from saved
            if (savedEvents.find(s => s.id === event.id)) {
                setSavedMoves(prev => prev.filter(s => s.id !== event.id));
            }

            await supabase.from('rsvps').upsert({
                event_id: event.id,
                user_id: authedUser.id,
                status: 'going'
            } as any);
        }
    };

    const toggleSaved = async (event: EventData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            const { error } = await supabase.auth.signInAnonymously();
            if (error) { Alert.alert("Error", "Could not sign in."); return; }
        }
        const { data: { user: authedUser } } = await supabase.auth.getUser();
        if (!authedUser) return;

        const isSaved = savedEvents.find(s => s.id === event.id);

        if (isSaved) {
            setSavedMoves(prev => prev.filter(s => s.id !== event.id));
            await supabase.from('rsvps').delete().eq('event_id', event.id).eq('user_id', authedUser.id);
        } else {
            setSavedMoves(prev => [...prev, event]);
            // Remove from going if there
            if (myMoves.find(m => m.id === event.id)) {
                setMyMoves(prev => prev.filter(m => m.id !== event.id));
            }

            await supabase.from('rsvps').upsert({
                event_id: event.id,
                user_id: authedUser.id,
                status: 'maybe'
            } as any);
        }
    };

    const isLockedIn = (eventId: string) => !!myMoves.find(m => m.id === eventId);
    const isSaved = (eventId: string) => !!savedEvents.find(s => s.id === eventId);

    return (
        <EventsContext.Provider value={{
            events,
            myMoves,
            savedEvents,
            loading,
            refreshEvents,
            toggleRSVP,
            toggleSaved,
            isLockedIn,
            isSaved,
            searchQuery,
            setSearchQuery,
            selectedCategory,
            setSelectedCategory,
            filteredEvents,
            searchRadius,
            setSearchRadius,
            searchLocation,
            setSearchLocation
        }}>
            {children}
        </EventsContext.Provider>
    );
};

export const useEvents = () => {
    const context = useContext(EventsContext);
    if (!context) {
        throw new Error('useEvents must be used within an EventsProvider');
    }
    return context;
};
