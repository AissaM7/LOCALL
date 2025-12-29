// Image categories for Unsplash-powered image library
export type ImageCategory = 'trending' | 'party' | 'aesthetic' | 'y2k' | 'coquette' | 'vibey';

export const IMAGE_CATEGORIES: { key: ImageCategory; label: string }[] = [
    { key: 'trending', label: 'Trending' },
    { key: 'party', label: 'Party' },
    { key: 'aesthetic', label: 'Aesthetic' },
    { key: 'y2k', label: 'Y2K' },
    { key: 'coquette', label: 'Coquette' },
    { key: 'vibey', label: 'Vibey' },
];

// Search queries for each category
export const CATEGORY_QUERIES: Record<ImageCategory, string> = {
    trending: 'party aesthetic neon vibrant',
    party: 'party celebration fun colorful balloons',
    aesthetic: 'aesthetic pastel dreamy cute soft',
    y2k: 'y2k 2000s retro vintage nostalgia',
    coquette: 'coquette pink bows ribbons feminine',
    vibey: 'moody vibes night city neon lights',
};
