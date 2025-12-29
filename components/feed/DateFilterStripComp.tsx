import React, { useRef, useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions, NativeSyntheticEvent, NativeScrollEvent, Modal } from 'react-native';
import { COLORS, DESIGN } from '../../constants/theme';
import { GalleryText } from '../GalleryPrimitives';
import { ChevronDown, MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useEvents } from '../../context/EventsContext';
import { LocationFilterModal } from './LocationFilterModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PILL_WIDTH = 60;
const PILL_GAP = 8;

// Generate months for the next year
const generateMonths = (): { date: Date; label: string }[] => {
    const months = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.push({
            date,
            label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        });
    }
    return months;
};

interface DateFilterStripProps {
    selectedDate: Date | null;
    onSelectDate: (date: Date | null) => void;
}

export const DateFilterStrip: React.FC<DateFilterStripProps> = ({ selectedDate, onSelectDate }) => {
    const { searchLocation } = useEvents();
    const scrollRef = useRef<ScrollView>(null);
    const [currentMonth, setCurrentMonth] = useState<string>('');
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [showLocationModal, setShowLocationModal] = useState(false);

    // Generate next 90 days from start date
    const dates = useMemo(() => {
        return Array.from({ length: 90 }, (_, i) => {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            return d;
        });
    }, [startDate]);

    // Available months for picker
    const availableMonths = useMemo(() => generateMonths(), []);

    // Set initial month
    useEffect(() => {
        const now = new Date();
        setCurrentMonth(now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    }, []);

    // Update month header on scroll
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollX = event.nativeEvent.contentOffset.x;
        const approximateDateIndex = Math.floor(scrollX / (PILL_WIDTH + PILL_GAP));

        if (dates[approximateDateIndex]) {
            const month = dates[approximateDateIndex].toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            if (month !== currentMonth) {
                setCurrentMonth(month);
            }
        }
    };

    const handleMonthSelect = (monthDate: Date) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setStartDate(monthDate);
        setCurrentMonth(monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        setShowMonthPicker(false);

        // Scroll to beginning
        setTimeout(() => {
            scrollRef.current?.scrollTo({ x: 0, animated: true });
        }, 100);

        // Select first day of that month
        onSelectDate(monthDate);
    };

    const isDateSelected = (date: Date) => {
        if (!selectedDate) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const isToday = (date: Date) => {
        return date.toDateString() === new Date().toDateString();
    };

    return (
        <View style={styles.container}>
            <LocationFilterModal
                visible={showLocationModal}
                onClose={() => setShowLocationModal(false)}
            />

            {/* Month Header - Tappable */}
            <View style={styles.monthHeader}>
                <Pressable
                    style={styles.monthButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowMonthPicker(true);
                    }}
                >
                    <GalleryText style={styles.monthText}>{currentMonth}</GalleryText>
                    <ChevronDown size={18} color="rgba(255,255,255,0.5)" />
                </Pressable>
                <View style={styles.monthActions}>
                    <Pressable
                        style={styles.locationButton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowLocationModal(true);
                        }}
                    >
                        <MapPin size={14} color={COLORS.accents.mint} />
                        <GalleryText style={styles.locationButtonText} numberOfLines={1}>
                            {searchLocation ? searchLocation.name.split(',')[0] : 'Location'}
                        </GalleryText>
                    </Pressable>
                </View>
            </View>

            {/* Date Pills */}
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {/* "All" Option */}
                <Pressable
                    style={[
                        styles.datePill,
                        styles.allPill,
                        !selectedDate && styles.selectedPill
                    ]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onSelectDate(null);
                    }}
                >
                    <GalleryText style={[styles.allText, !selectedDate && styles.selectedText]}>
                        ALL
                    </GalleryText>
                    <GalleryText style={[styles.allIcon, !selectedDate && styles.selectedText]}>
                        ∞
                    </GalleryText>
                </Pressable>

                {dates.map((date, index) => {
                    const selected = isDateSelected(date);
                    const today = isToday(date);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                    const dayNumber = date.getDate();
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                    // Show month separator when month changes
                    const showMonthSeparator = index > 0 &&
                        date.getMonth() !== dates[index - 1].getMonth();

                    return (
                        <React.Fragment key={index}>
                            {showMonthSeparator && (
                                <View style={styles.monthSeparator}>
                                    <GalleryText style={styles.monthSeparatorText}>
                                        {date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                                    </GalleryText>
                                </View>
                            )}
                            <Pressable
                                style={[
                                    styles.datePill,
                                    today && styles.todayPill,
                                    isWeekend && styles.weekendPill,
                                    selected && styles.selectedPill
                                ]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    onSelectDate(date);
                                }}
                            >
                                <GalleryText
                                    style={[
                                        styles.dayNumber,
                                        today && styles.todayText,
                                        selected && styles.selectedText
                                    ]}
                                >
                                    {dayNumber}
                                </GalleryText>
                                <GalleryText
                                    style={[
                                        styles.dayName,
                                        today && styles.todayText,
                                        selected && styles.selectedText
                                    ]}
                                >
                                    {today ? 'TODAY' : dayName}
                                </GalleryText>
                            </Pressable>
                        </React.Fragment>
                    );
                })}
            </ScrollView>

            {/* Month Picker Modal */}
            <Modal
                visible={showMonthPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMonthPicker(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowMonthPicker(false)}
                >
                    <View style={styles.monthPickerContainer}>
                        <GalleryText style={styles.monthPickerTitle}>Jump to Month</GalleryText>
                        <ScrollView
                            style={styles.monthList}
                            showsVerticalScrollIndicator={false}
                        >
                            {availableMonths.map((month, index) => {
                                const isCurrentMonth = month.label === currentMonth;
                                return (
                                    <Pressable
                                        key={index}
                                        style={[
                                            styles.monthOption,
                                            isCurrentMonth && styles.monthOptionActive
                                        ]}
                                        onPress={() => handleMonthSelect(month.date)}
                                    >
                                        <GalleryText style={[
                                            styles.monthOptionText,
                                            isCurrentMonth && styles.monthOptionTextActive
                                        ]}>
                                            {month.label}
                                        </GalleryText>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 8,
    },
    monthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    monthButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    monthText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    monthActions: {
        flexDirection: 'row',
        gap: 8,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(102, 255, 178, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.accents.mint,
        gap: 6,
        maxWidth: 160,
    },
    locationButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.accents.mint,
    },
    scrollContent: {
        paddingHorizontal: 16,
        alignItems: 'flex-end',
        gap: PILL_GAP,
        paddingBottom: 8,
    },
    datePill: {
        width: PILL_WIDTH,
        height: 76,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        gap: 4,
    },
    allPill: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.12)',
    },
    todayPill: {
        borderColor: COLORS.accents.mint,
        borderWidth: 2,
    },
    weekendPill: {
        backgroundColor: 'rgba(255,0,127,0.08)',
    },
    selectedPill: {
        backgroundColor: COLORS.accents.hotPink,
        borderColor: COLORS.accents.hotPink,
        transform: [{ scale: 1.05 }],
        ...DESIGN.shadows.softHigh,
    },
    dayNumber: {
        fontSize: 22,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.9)',
    },
    dayName: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 0.5,
    },
    allText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.8)',
    },
    allIcon: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.6)',
    },
    todayText: {
        color: COLORS.accents.mint,
    },
    selectedText: {
        color: '#FFF',
    },
    monthSeparator: {
        width: 40,
        height: 76,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
    },
    monthSeparatorText: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.4)',
        transform: [{ rotate: '-90deg' }],
        letterSpacing: 1,
    },
    // Month Picker Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthPickerContainer: {
        width: '80%',
        maxHeight: '60%',
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    monthPickerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 16,
    },
    monthList: {
        maxHeight: 300,
    },
    monthOption: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 4,
    },
    monthOptionActive: {
        backgroundColor: COLORS.accents.hotPink,
    },
    monthOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
    },
    monthOptionTextActive: {
        color: '#FFF',
    },
});
