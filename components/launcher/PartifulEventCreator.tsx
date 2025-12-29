import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Modal, KeyboardAvoidingView, Platform, Pressable, ScrollView, Image, Text as RNText } from 'react-native';
import { GalleryText, GalleryButton } from '../GalleryPrimitives';
import { COLORS, EVENT_FONTS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { AddressAutocomplete, AddressData } from './AddressAutocomplete';
import { ImageLibrary } from './ImageLibrary';
import { StyleSelector, FontStyle } from './StyleSelector';
import { PartifulDateTimePicker } from './PartifulDateTimePicker';
import { EmojiPicker } from './EmojiPicker';
import { Edit2, X, Calendar, Clock, MapPin, Users, FileText, Sparkles } from 'lucide-react-native';

export type EventCategory = 'party' | 'music' | 'food' | 'shop' | 'art' | 'coffee' | 'sports' | 'coworking';

// Category options - clean text only
const CATEGORY_OPTIONS: { id: EventCategory; label: string }[] = [
    { id: 'party', label: 'Party' },
    { id: 'music', label: 'Music' },
    { id: 'food', label: 'Food' },
    { id: 'shop', label: 'Shopping' },
    { id: 'art', label: 'Art' },
    { id: 'coffee', label: 'Chill' },
    { id: 'sports', label: 'Sports' },
    { id: 'coworking', label: 'Coworking' },
];

interface PartifulEventCreatorProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: {
        title: string;
        description: string;
        coordinates: [number, number];
        fullAddress: string;
        category: EventCategory;
        icon: string;
        headerImage: string;
        fontStyle: FontStyle;
        startTime: Date;
        endTime: Date;
        maxGuests?: number;
    }) => void;
}

export const PartifulEventCreator: React.FC<PartifulEventCreatorProps> = ({ visible, onClose, onSubmit }) => {
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [place, setPlace] = useState('');
    const [addressData, setAddressData] = useState<AddressData | null>(null);
    const [category, setCategory] = useState<EventCategory>('party');

    // Partiful-specific state
    const [headerImage, setHeaderImage] = useState('https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?w=800');
    const [fontStyle, setFontStyle] = useState<FontStyle>('simple');
    const [maxGuests, setMaxGuests] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('🎉');
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(() => {
        const end = new Date();
        end.setHours(end.getHours() + 3);
        return end;
    });
    const [showImageLibrary, setShowImageLibrary] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    const handleSubmit = () => {
        if (!addressData || !title) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            alert('Please add a title and location');
            return;
        }

        if (endTime <= startTime) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            alert('End time must be after start time');
            return;
        }

        onSubmit({
            title,
            description,
            coordinates: addressData.coordinates,
            fullAddress: addressData.fullAddress,
            category,
            icon: selectedIcon,
            headerImage,
            fontStyle,
            startTime,
            endTime,
            maxGuests: maxGuests ? parseInt(maxGuests, 10) : undefined,
        });

        // Reset form
        setTitle('');
        setDescription('');
        setPlace('');
        setAddressData(null);
        setCategory('party');
        setSelectedIcon('🎉');
        setHeaderImage('https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?w=800');
        setFontStyle('simple');
        setMaxGuests('');
        setStartTime(new Date());
        const newEnd = new Date();
        newEnd.setHours(newEnd.getHours() + 3);
        setEndTime(newEnd);
    };

    const formatDateTime = (d: Date) => {
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
            ' • ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <>
            <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <X color="#FFF" size={24} />
                        </Pressable>
                        <GalleryText style={styles.headerTitle}>New Event</GalleryText>
                        <Pressable onPress={handleSubmit} style={styles.saveButton}>
                            <GalleryText style={styles.saveText}>Create</GalleryText>
                        </Pressable>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        scrollEventThrottle={16}
                    >
                        {/* Header Image with Pencil Button */}
                        <View style={styles.headerImageContainer}>
                            <Image
                                source={{ uri: headerImage }}
                                style={styles.headerImage}
                                resizeMode="cover"
                            />
                            <Pressable
                                style={styles.editImageButton}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    setShowImageLibrary(true);
                                }}
                            >
                                <Edit2 color="#FFF" size={18} />
                            </Pressable>
                        </View>

                        {/* Event Title */}
                        <View style={styles.titleSection}>
                            <TextInput
                                style={[styles.titleInput, EVENT_FONTS[fontStyle]]}
                                placeholder="Event Name"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={title}
                                onChangeText={setTitle}
                                autoCapitalize="words"
                                returnKeyType="done"
                            />
                        </View>

                        {/* Font Style Selector */}
                        <View style={styles.section}>
                            <StyleSelector
                                selectedStyle={fontStyle}
                                onSelectStyle={setFontStyle}
                                previewText={title || 'Event Name'}
                            />
                        </View>

                        {/* Category Selection - NEW */}
                        <View style={styles.section}>
                            <GalleryText style={styles.sectionLabel}>CATEGORY</GalleryText>
                            <View style={styles.categoryGrid}>
                                {CATEGORY_OPTIONS.map((cat) => (
                                    <Pressable
                                        key={cat.id}
                                        style={[
                                            styles.categoryPill,
                                            category === cat.id && styles.categoryPillActive
                                        ]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setCategory(cat.id);
                                        }}
                                    >
                                        <GalleryText style={[
                                            styles.categoryLabel,
                                            category === cat.id && styles.categoryLabelActive
                                        ]}>
                                            {cat.label}
                                        </GalleryText>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Date & Time Section */}
                        <View style={styles.section}>
                            <GalleryText style={styles.sectionLabel}>WHEN</GalleryText>

                            <Pressable
                                style={styles.inputCard}
                                onPress={() => setShowStartDatePicker(true)}
                            >
                                <Calendar color={COLORS.accents.hotPink} size={20} />
                                <View style={styles.inputCardContent}>
                                    <GalleryText style={styles.inputCardLabel}>Starts</GalleryText>
                                    <GalleryText style={styles.inputCardValue}>
                                        {formatDateTime(startTime)}
                                    </GalleryText>
                                </View>
                            </Pressable>

                            <Pressable
                                style={styles.inputCard}
                                onPress={() => setShowEndTimePicker(true)}
                            >
                                <Clock color={COLORS.accents.mint} size={20} />
                                <View style={styles.inputCardContent}>
                                    <GalleryText style={styles.inputCardLabel}>Ends</GalleryText>
                                    <GalleryText style={styles.inputCardValue}>
                                        {formatDateTime(endTime)}
                                    </GalleryText>
                                </View>
                            </Pressable>
                        </View>

                        {/* Location */}
                        <View style={styles.section}>
                            <GalleryText style={styles.sectionLabel}>WHERE</GalleryText>
                            <View style={styles.inputCard}>
                                <MapPin color={COLORS.accents.coral} size={20} />
                                <View style={styles.inputCardContent}>
                                    <AddressAutocomplete
                                        value={place}
                                        onChangeText={setPlace}
                                        onSelectAddress={setAddressData}
                                        style={styles.locationInputInline}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Event Icon */}
                        <View style={styles.section}>
                            <GalleryText style={styles.sectionLabel}>MAP ICON</GalleryText>
                            <Pressable
                                style={styles.emojiCard}
                                onPress={() => setShowEmojiPicker(true)}
                            >
                                <RNText style={styles.selectedEmojiLarge}>{selectedIcon}</RNText>
                                <GalleryText style={styles.emojiHint}>Tap to change</GalleryText>
                            </Pressable>
                        </View>

                        {/* Details */}
                        <View style={styles.section}>
                            <GalleryText style={styles.sectionLabel}>DETAILS</GalleryText>
                            <TextInput
                                style={styles.descriptionInput}
                                placeholder="What's the plan? What should guests bring?"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                            />

                            <View style={styles.inputCard}>
                                <Users color="rgba(255,255,255,0.5)" size={20} />
                                <View style={styles.inputCardContent}>
                                    <GalleryText style={styles.inputCardLabel}>Max Guests</GalleryText>
                                </View>
                                <TextInput
                                    style={styles.guestInput}
                                    placeholder="∞"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={maxGuests}
                                    onChangeText={(text) => setMaxGuests(text.replace(/[^0-9]/g, ''))}
                                    keyboardType="number-pad"
                                    maxLength={4}
                                />
                            </View>
                        </View>

                        <View style={{ height: 60 }} />
                    </ScrollView>

                    {/* Date Pickers */}
                    <PartifulDateTimePicker
                        visible={showStartDatePicker}
                        value={startTime}
                        onSelect={(date) => {
                            setStartTime(date);
                            if (date >= endTime) {
                                const newEnd = new Date(date);
                                newEnd.setHours(newEnd.getHours() + 3);
                                setEndTime(newEnd);
                            }
                            setShowStartDatePicker(false);
                        }}
                        onClose={() => setShowStartDatePicker(false)}
                    />

                    <PartifulDateTimePicker
                        visible={showEndTimePicker}
                        value={endTime}
                        minimumDate={startTime}
                        onSelect={(date) => {
                            setEndTime(date);
                            setShowEndTimePicker(false);
                        }}
                        onClose={() => setShowEndTimePicker(false)}
                    />

                    <ImageLibrary
                        visible={showImageLibrary}
                        onClose={() => setShowImageLibrary(false)}
                        onSelectImage={(url) => setHeaderImage(url)}
                    />

                    <EmojiPicker
                        visible={showEmojiPicker}
                        currentEmoji={selectedIcon}
                        onSelect={(emoji) => setSelectedIcon(emoji)}
                        onClose={() => setShowEmojiPicker(false)}
                    />
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 16,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFF',
    },
    saveButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: COLORS.accents.hotPink,
        borderRadius: 20,
    },
    saveText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    headerImageContainer: {
        marginHorizontal: 16,
        marginTop: 8,
        aspectRatio: 1,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    editImageButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
        padding: 10,
    },
    titleSection: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 8,
    },
    titleInput: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFF',
        paddingVertical: 8,
    },
    section: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    sectionLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    // Category Grid
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 6,
    },
    categoryPillActive: {
        backgroundColor: COLORS.accents.hotPink,
        borderColor: COLORS.accents.hotPink,
    },
    categoryIcon: {
        fontSize: 16,
    },
    categoryLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
    },
    categoryLabelActive: {
        color: '#FFF',
    },
    // Input Cards
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 8,
        gap: 14,
    },
    inputCardContent: {
        flex: 1,
    },
    inputCardLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '600',
        marginBottom: 2,
    },
    inputCardValue: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '500',
    },
    locationInputInline: {
        color: '#FFF',
        fontSize: 16,
        padding: 0,
        margin: 0,
    },
    // Emoji Card
    emojiCard: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        gap: 8,
    },
    selectedEmojiLarge: {
        fontSize: 48,
    },
    emojiHint: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },
    // Description
    descriptionInput: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        color: '#FFF',
        padding: 16,
        borderRadius: 14,
        fontSize: 15,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 8,
    },
    guestInput: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'right',
        minWidth: 60,
    },
});
