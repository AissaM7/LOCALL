export interface EventHost {
    name: string;
    avatarUrl: string;
}

export interface EventData {
    id: string;
    title: string;
    description: string;
    coordinates: [number, number]; // [lon, lat]
    category: 'party' | 'music' | 'food' | 'shop' | 'art' | 'coffee';
    icon: string;
    time: string; // Display string
    headerImage?: string; // Partiful-style header image
    fontStyle?: 'fancy' | 'literary' | 'digital' | 'elegant' | 'simple';
    startTime?: Date; // Actual start time
    endTime?: Date; // Actual end time
    fullAddress?: string; // Location address
    maxGuests?: number; // Capacity limit
    host: EventHost; // Event host info
    price?: number | 'free'; // Ticket price or 'free'
    isPopular?: boolean; // Show "POPULAR" badge
}

export const MOCK_EVENTS: EventData[] = [
    {
        id: '1',
        title: 'Neon Rooftop Rager',
        description: 'Underground house music & neon lights. BYOB.',
        coordinates: [-73.9973, 40.7308] as [number, number],
        category: 'party',
        icon: '🎉',
        time: 'Tonight, 10 PM',
        headerImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80',
        fontStyle: 'digital',
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 4 * 60 * 60 * 1000),
        fullAddress: '123 Broadway, New York, NY',
        maxGuests: 50,
        host: { name: 'Marcus Chen', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
        price: 'free',
        isPopular: true,
    },
    {
        id: '2',
        title: 'Midnight Jazz Club',
        description: 'Smooth jazz, dark corners, strong cocktails.',
        coordinates: [-74.0060, 40.7128] as [number, number],
        category: 'music',
        icon: '🎷',
        time: 'Tonight, 11 PM',
        headerImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80',
        fontStyle: 'elegant',
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 3 * 60 * 60 * 1000),
        fullAddress: '42 Blue Note Ln, New York, NY',
        maxGuests: 30,
        host: { name: 'Sophia Williams', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
        price: 15,
    },
    {
        id: '3',
        title: 'Pop-up Vintage Market',
        description: 'Curated 90s streetwear and vinyl records.',
        coordinates: [-73.9632, 40.7789] as [number, number],
        category: 'shop',
        icon: '🛍️',
        time: 'Tomorrow, 12 PM',
        headerImage: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=1920&auto=format&fit=crop',
        fontStyle: 'simple',
        fullAddress: 'Williamsburg Market, Brooklyn, NY',
        host: { name: 'Jaylen Brooks', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100' },
        price: 'free',
    },
    {
        id: '4',
        title: 'Latte Art Throwdown',
        description: 'Barista battle. Free espresso shots for spectators.',
        coordinates: [-73.9822, 40.7589] as [number, number],
        category: 'coffee',
        icon: '☕',
        time: 'Sat, 10 AM',
        headerImage: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1920&auto=format&fit=crop',
        fontStyle: 'fancy',
        fullAddress: 'Coffee Lab, Manhattan, NY',
        host: { name: 'Alice Nakamura', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
        price: 'free',
        isPopular: true,
    },
    {
        id: '5',
        title: 'Central Park Picnic',
        description: 'Chill vibes, frisbee, and good snacks.',
        coordinates: [-73.9665, 40.7812] as [number, number],
        category: 'food',
        icon: '🧺',
        time: 'Sun, 1 PM',
        headerImage: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=1920&auto=format&fit=crop',
        fontStyle: 'literary',
        fullAddress: 'Sheep Meadow, Central Park, NY',
        host: { name: 'Emma Rodriguez', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
        price: 'free',
    },
    {
        id: '6',
        title: 'Startup Pitch Night',
        description: 'Watch the next unicorn founders pitch to top VCs. Networking & drinks.',
        coordinates: [-71.0589, 42.3601] as [number, number],
        category: 'party',
        icon: '🚀',
        time: 'Tuesday, 6 PM',
        headerImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=1920&auto=format&fit=crop',
        fontStyle: 'digital',
        fullAddress: 'Innovation Lab, Boston, MA',
        host: { name: 'David Kim', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100' },
        price: 25,
        isPopular: true,
    },
    {
        id: '7',
        title: 'Smorgasburg WTC',
        description: 'The largest weekly open-air food market in America with 100 local vendors.',
        coordinates: [-74.0116, 40.7115] as [number, number],
        category: 'food',
        icon: '🌮',
        time: 'Friday, 11 AM',
        headerImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1920&auto=format&fit=crop',
        fontStyle: 'simple',
        fullAddress: 'The Oculus, New York, NY',
        host: { name: 'NYC Food Collective', avatarUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100' },
        price: 'free',
    }
];
