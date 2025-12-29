import { View, Text, StyleSheet, Pressable, FlatList, Image } from 'react-native';
import { useState } from 'react';
import { COLORS, DESIGN } from '../constants/theme';
import { GalleryContainer, GalleryText, GalleryButton } from '../components/GalleryPrimitives';
import { useEvents } from '../context/EventsContext';

export const MyMovesView = () => {
    const [activeTab, setActiveTab] = useState<'locked_in' | 'saved'>('locked_in');

    const { myMoves, savedEvents, toggleRSVP, toggleSaved } = useEvents();

    // Determine which list to show
    const displayList = activeTab === 'locked_in' ? myMoves : savedEvents;

    // Helper to remove item (un-RSVP or un-save)
    const handleRemove = (item: any) => {
        if (activeTab === 'locked_in') {
            toggleRSVP(item);
        } else {
            toggleSaved(item);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <GalleryText type="heading" style={styles.headerTitle}>My Moves</GalleryText>
            </View>

            {/* View Toggle */}
            <GalleryContainer variant="surface" style={styles.toggleContainer}>
                <Pressable
                    style={[styles.toggleButton, activeTab === 'locked_in' && styles.activeToggle]}
                    onPress={() => setActiveTab('locked_in')}
                >
                    <GalleryText
                        type="micro"
                        style={{ color: activeTab === 'locked_in' ? COLORS.text.inverse : COLORS.text.secondary }}
                    >
                        Locked In
                    </GalleryText>
                </Pressable>
                <Pressable
                    style={[styles.toggleButton, activeTab === 'saved' && styles.activeToggle]}
                    onPress={() => setActiveTab('saved')}
                >
                    <GalleryText
                        type="micro"
                        style={{ color: activeTab === 'saved' ? COLORS.text.inverse : COLORS.text.secondary }}
                    >
                        Saved
                    </GalleryText>
                </Pressable>
            </GalleryContainer>

            {/* List or Empty State */}
            <View style={styles.content}>
                {displayList.length > 0 ? (
                    <FlatList
                        data={displayList}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <GalleryContainer style={styles.ticketCard}>
                                <View style={styles.ticketContent}>
                                    <View style={[styles.ticketImagePlaceholder, { backgroundColor: COLORS.accents.lavender }]}>
                                        <Text style={{ fontSize: 32 }}>{item.icon || '🎟️'}</Text>
                                    </View>

                                    <View style={styles.ticketInfo}>
                                        <GalleryText type="heading" style={styles.ticketTitle} numberOfLines={1}>{item.title}</GalleryText>
                                        <GalleryText type="micro" style={[styles.ticketMeta, { fontFamily: 'Courier' }]}>
                                            {item.time} • {item.fullAddress || 'Secret Location'}
                                        </GalleryText>
                                    </View>
                                </View>

                                <Pressable style={styles.removeButton} onPress={() => handleRemove(item)}>
                                    <GalleryText type="micro" style={styles.removeButtonText}>Remove</GalleryText>
                                </Pressable>
                            </GalleryContainer>
                        )}
                        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 120 }} // Extra padding for TabBar
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.emptyState}>
                        <GalleryText type="heading" style={{ fontSize: 40, color: COLORS.accents.bleuGrey }}>Nothing here.</GalleryText>
                        <GalleryText type="body" style={styles.emptyText}>
                            Check the map for moves.
                        </GalleryText>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.canvas.porcelain,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 32, // Bigger title since no back button
        color: COLORS.text.primary,
    },
    toggleContainer: {
        flexDirection: 'row',
        marginHorizontal: 24,
        padding: 4,
        borderRadius: 999,
        backgroundColor: COLORS.canvas.fog,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
    },
    activeToggle: {
        backgroundColor: COLORS.accents.bleuGrey,
        ...DESIGN.shadows.pop,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        transform: [{ translateY: -2 }],
    },
    content: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.8,
        paddingBottom: 100,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        marginTop: 8,
        color: COLORS.text.secondary,
    },
    ticketCard: {
        borderRadius: 24,
        padding: 16,
        backgroundColor: COLORS.canvas.fog,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...DESIGN.shadows.pop,
    },
    ticketContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 16,
    },
    ticketImagePlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderCurve: 'continuous',
    },
    ticketInfo: {
        flex: 1,
    },
    ticketTitle: {
        fontSize: 18,
        color: COLORS.text.primary,
        marginBottom: 4,
    },
    ticketMeta: {
        fontSize: 12,
        color: COLORS.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    removeButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(255, 46, 147, 0.1)',
        borderRadius: 12,
        marginLeft: 8,
    },
    removeButtonText: {
        fontSize: 11,
        color: COLORS.accents.bleuGrey,
    }
});
