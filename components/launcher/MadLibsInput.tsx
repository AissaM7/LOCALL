import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Modal, KeyboardAvoidingView, Platform, Pressable, Keyboard, ScrollView } from 'react-native';
import { GalleryContainer, GalleryText, GalleryButton } from '../GalleryPrimitives';
import { COLORS, DESIGN, TYPOGRAPHY } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { AddressAutocomplete, AddressData } from './AddressAutocomplete';

export type EventCategory = 'party' | 'music' | 'food' | 'shop' | 'art' | 'coffee';

interface MadLibsInputProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: {
        task: string;
        place: string;
        count: string;
        description: string;
        coordinates: [number, number];
        fullAddress: string;
        category: EventCategory;
    }) => void;
}

export const MadLibsInput: React.FC<MadLibsInputProps> = ({ visible, onClose, onSubmit }) => {
    const [task, setTask] = useState('');
    const [place, setPlace] = useState('');
    const [count, setCount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<EventCategory>('party');
    const [addressData, setAddressData] = useState<AddressData | null>(null);

    const categories: { key: EventCategory; label: string; icon: string }[] = [
        { key: 'party', label: 'Party', icon: '🎉' },
        { key: 'music', label: 'Music', icon: '🎵' },
        { key: 'food', label: 'Food', icon: '🍕' },
        { key: 'coffee', label: 'Chill', icon: '☕' },
        { key: 'art', label: 'Art', icon: '🎨' },
        { key: 'shop', label: 'Shop', icon: '🛍️' },
    ];

    const handleCountChange = (text: string) => {
        const num = parseInt(text);
        if (num > 15) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setCount('15');
        } else {
            setCount(text);
        }
    };

    const handleSubmit = () => {
        if (!addressData) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        onSubmit({
            task,
            place,
            count,
            description,
            coordinates: addressData.coordinates,
            fullAddress: addressData.fullAddress,
            category,
        });

        // Reset form
        setTask('');
        setPlace('');
        setCount('');
        setDescription('');
        setCategory('party');
        setAddressData(null);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <Pressable style={styles.backdrop} onPress={onClose}>
                    <View />
                </Pressable>

                <GalleryContainer
                    variant="surface"
                    style={styles.sheet}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <GalleryText type="heading" style={styles.title}>What's the move?</GalleryText>

                        <View style={styles.sentenceContainer}>
                            <GalleryText type="heading" style={styles.text}>I am hosting a </GalleryText>
                            <TextInput
                                style={styles.input}
                                placeholder="[ Activity ]"
                                placeholderTextColor={COLORS.text.secondary}
                                value={task}
                                onChangeText={setTask}
                                autoFocus
                            />
                            <GalleryText type="heading" style={styles.text}> at </GalleryText>
                            <AddressAutocomplete
                                value={place}
                                onChangeText={setPlace}
                                onSelectAddress={setAddressData}
                                style={styles.input}
                            />
                            <GalleryText type="heading" style={styles.text}> for </GalleryText>
                            <TextInput
                                style={[styles.input, { width: 80, textAlign: 'center' }]}
                                placeholder="[ # ]"
                                placeholderTextColor={COLORS.text.secondary}
                                value={count}
                                onChangeText={handleCountChange}
                                keyboardType="number-pad"
                            />
                            <GalleryText type="heading" style={styles.text}> people.</GalleryText>
                        </View>

                        {/* Category Selector */}
                        <View style={styles.categoryContainer}>
                            <GalleryText type="micro" style={styles.label}>VIBE / CATEGORY</GalleryText>
                            <View style={styles.categoryPills}>
                                {categories.map((cat) => (
                                    <Pressable
                                        key={cat.key}
                                        style={[
                                            styles.categoryPill,
                                            category === cat.key && styles.categoryPillActive
                                        ]}
                                        onPress={() => {
                                            setCategory(cat.key);
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                    >
                                        <GalleryText style={StyleSheet.flatten([
                                            styles.categoryText,
                                            category === cat.key && styles.categoryTextActive
                                        ])}>
                                            {cat.icon} {cat.label}
                                        </GalleryText>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Gen Z Description Bubble */}
                        <View style={styles.descriptionContainer}>
                            <GalleryText type="micro" style={styles.label}>THE VIBE / DETAILS</GalleryText>
                            <TextInput
                                style={styles.textArea}
                                placeholder="What's the plan? What to bring? Spill the tea..."
                                placeholderTextColor={COLORS.text.secondary}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={3}
                                returnKeyType="default"
                            />
                        </View>

                        <GalleryButton
                            label="SEND IT ->"
                            onPress={handleSubmit}
                            style={{ marginTop: 24, width: '100%', backgroundColor: COLORS.accents.bleuGrey }}
                            textStyle={{ color: COLORS.canvas.white, fontWeight: '900' }}
                        />
                    </ScrollView>
                </GalleryContainer>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    sheet: {
        padding: 24,
        paddingBottom: 40,
        borderRadius: 40,
        margin: 12,
        maxHeight: '85%', // Allow more height for scrolling
        backgroundColor: COLORS.canvas.white,
        ...DESIGN.shadows.softHigh,
        borderWidth: 1,
        borderColor: COLORS.canvas.fog,
    },
    title: {
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
        color: COLORS.text.secondary,
        fontFamily: TYPOGRAPHY.micro.fontFamily,
        fontWeight: 'bold',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    sentenceContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    text: {
        fontSize: 24,
        marginVertical: 6,
        color: COLORS.text.primary,
        fontFamily: 'System',
        fontWeight: '800',
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
    categoryContainer: {
        width: '100%',
        marginTop: 8,
        marginBottom: 16,
    },
    categoryPills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryPill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: COLORS.canvas.fog,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    categoryPillActive: {
        backgroundColor: COLORS.accents.bleuGrey,
        borderColor: COLORS.accents.bleuGrey,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    categoryTextActive: {
        color: COLORS.canvas.white,
    },
    descriptionContainer: {
        width: '100%',
        marginTop: 8,
    },
    label: {
        marginBottom: 8,
        marginLeft: 12,
        color: COLORS.text.secondary,
        fontSize: 10,
    },
    textArea: {
        fontFamily: TYPOGRAPHY.body.fontFamily,
        fontSize: 16,
        color: COLORS.text.primary,
        backgroundColor: COLORS.canvas.fog,
        padding: 16,
        borderRadius: 24,
        height: 100,
        textAlignVertical: 'top',
    }
});
