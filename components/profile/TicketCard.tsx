import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { GalleryText } from '../GalleryPrimitives';
import { COLORS } from '../../constants/theme';
import { EventData } from '../../constants/events';

const TICKET_WIDTH = 290;
const TICKET_HEIGHT = 140;
const NOTCH_SIZE = 24;
const STUB_WIDTH = 110;
const PERFORATION_DOT_SIZE = 10;

interface TicketCardProps {
    event: EventData;
    onPress?: () => void;
    backgroundColor?: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({
    event,
    onPress,
    backgroundColor = '#1E0030'
}) => {
    // Determine if event is in the past
    const now = new Date();
    const isPastEvent = event.startTime ? event.startTime < now : false;

    // Create perforation dots for the edge
    const perforationDots = [...Array(9)].map((_, i) => (
        <View
            key={i}
            style={[styles.perforationDot, { backgroundColor }]}
        />
    ));

    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                isPastEvent && styles.pastContainer,
                pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
            ]}
            onPress={onPress}
        >
            {/* Main ticket body */}
            <View style={[styles.ticketBody, isPastEvent && styles.pastTicketBody]}>
                {/* Left stub section - Event Image */}
                <View style={styles.stubSection}>
                    <Image
                        source={{ uri: event.headerImage || `https://source.unsplash.com/random/200x200/?${event.category}` }}
                        style={[styles.eventImage, isPastEvent && styles.pastEventImage]}
                    />
                    {/* Overlay for depth / past event dimming */}
                    <View style={[
                        styles.stubOverlay,
                        isPastEvent && styles.pastStubOverlay
                    ]} />

                    {/* Past event badge */}
                    {isPastEvent && (
                        <View style={styles.pastBadge}>
                            <GalleryText style={styles.pastBadgeText}>PAST</GalleryText>
                        </View>
                    )}
                </View>

                {/* Perforated tear edge */}
                <View style={styles.perforationEdge}>
                    {perforationDots}
                </View>

                {/* Right section - Event Details */}
                <View style={styles.detailsSection}>
                    <View style={styles.detailsContent}>
                        {/* Upcoming indicator */}
                        {!isPastEvent && (
                            <View style={styles.upcomingBadge}>
                                <View style={styles.upcomingDot} />
                                <GalleryText style={styles.upcomingText}>UPCOMING</GalleryText>
                            </View>
                        )}

                        <GalleryText
                            style={[styles.eventTitle, isPastEvent && styles.pastEventTitle]}
                            numberOfLines={2}
                        >
                            {event.title}
                        </GalleryText>
                        <GalleryText style={[styles.eventDate, isPastEvent && styles.pastEventDate]}>
                            {event.startTime?.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </GalleryText>
                        <GalleryText style={styles.eventTime}>
                            {event.startTime?.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                            })}
                        </GalleryText>
                    </View>
                </View>
            </View>

            {/* Outer edge notches */}
            <View style={[styles.edgeNotch, styles.leftEdgeNotch, { backgroundColor }]} />
            <View style={[styles.edgeNotch, styles.rightEdgeNotch, { backgroundColor }]} />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        width: TICKET_WIDTH,
        height: TICKET_HEIGHT,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    pastContainer: {
        opacity: 0.7,
    },
    ticketBody: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#1C1C1C',
        borderRadius: 16,
        overflow: 'hidden',
    },
    pastTicketBody: {
        backgroundColor: '#151515',
    },
    stubSection: {
        width: STUB_WIDTH,
        height: '100%',
        position: 'relative',
    },
    eventImage: {
        width: '100%',
        height: '100%',
    },
    pastEventImage: {
        opacity: 0.6,
    },
    stubOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    pastStubOverlay: {
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    pastBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    pastBadgeText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
    },
    upcomingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    upcomingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.accents.hotPink,
        marginRight: 6,
    },
    upcomingText: {
        color: COLORS.accents.hotPink,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
    },
    perforationEdge: {
        width: PERFORATION_DOT_SIZE,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 2,
        backgroundColor: '#1C1C1C',
    },
    perforationDot: {
        width: PERFORATION_DOT_SIZE,
        height: PERFORATION_DOT_SIZE,
        borderRadius: PERFORATION_DOT_SIZE / 2,
    },
    detailsSection: {
        flex: 1,
        backgroundColor: '#1C1C1C',
    },
    detailsContent: {
        flex: 1,
        padding: 14,
        justifyContent: 'center',
    },
    eventTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 6,
        lineHeight: 20,
        letterSpacing: 0.3,
    },
    pastEventTitle: {
        color: 'rgba(255,255,255,0.6)',
    },
    eventDate: {
        color: COLORS.accents.mint,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    pastEventDate: {
        color: 'rgba(255,255,255,0.4)',
    },
    eventTime: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: '500',
    },
    edgeNotch: {
        position: 'absolute',
        width: NOTCH_SIZE,
        height: NOTCH_SIZE,
        borderRadius: NOTCH_SIZE / 2,
        top: (TICKET_HEIGHT - NOTCH_SIZE) / 2,
    },
    leftEdgeNotch: {
        left: -(NOTCH_SIZE / 2),
    },
    rightEdgeNotch: {
        right: -(NOTCH_SIZE / 2),
    },
});
