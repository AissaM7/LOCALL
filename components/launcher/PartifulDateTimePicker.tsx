import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, Pressable, ScrollView, Text } from 'react-native';
import { GalleryText } from '../GalleryPrimitives';
import { COLORS } from '../../constants/theme';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface PartifulDateTimePickerProps {
    visible: boolean;
    value: Date;
    minimumDate?: Date;
    onSelect: (date: Date) => void;
    onClose: () => void;
}

export const PartifulDateTimePicker: React.FC<PartifulDateTimePickerProps> = ({
    visible,
    value,
    minimumDate,
    onSelect,
    onClose,
}) => {
    const [selectedDate, setSelectedDate] = useState(value);
    const [displayMonth, setDisplayMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));
    const [selectedTime, setSelectedTime] = useState<string>('');

    useEffect(() => {
        if (visible) {
            setSelectedDate(value);
            setDisplayMonth(new Date(value.getFullYear(), value.getMonth(), 1));
            // Format initial time
            const hours = value.getHours();
            const minutes = value.getMinutes();
            const period = hours >= 12 ? 'pm' : 'am';
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, '0');
            setSelectedTime(`${displayHours}:${displayMinutes}${period}`);
        }
    }, [visible, value]);

    const generateTimeSlots = () => {
        const times: string[] = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const period = hour >= 12 ? 'pm' : 'am';
                const displayHour = hour % 12 || 12;
                const displayMinute = minute.toString().padStart(2, '0');
                times.push(`${displayHour}:${displayMinute}${period}`);
            }
        }
        return times;
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (number | null)[] = [];

        // Add empty slots for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const handleDayPress = (day: number) => {
        const newDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);

        // Copy time from selected time
        const [timeStr, period] = selectedTime.split(/(?=[ap]m)/);
        const [hourStr, minuteStr] = timeStr.split(':');
        let hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        if (period === 'pm' && hour !== 12) hour += 12;
        if (period === 'am' && hour === 12) hour = 0;

        newDate.setHours(hour, minute, 0, 0);

        if (minimumDate && newDate < minimumDate) {
            return; // Don't allow selecting dates before minimum
        }

        setSelectedDate(newDate);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleTimePress = (time: string) => {
        setSelectedTime(time);

        // Update selected date with new time
        const [timeStr, period] = time.split(/(?=[ap]m)/);
        const [hourStr, minuteStr] = timeStr.split(':');
        let hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        if (period === 'pm' && hour !== 12) hour += 12;
        if (period === 'am' && hour === 12) hour = 0;

        const newDate = new Date(selectedDate);
        newDate.setHours(hour, minute, 0, 0);
        setSelectedDate(newDate);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleDone = () => {
        onSelect(selectedDate);
        onClose();
    };

    const handleClear = () => {
        onClose();
    };

    const changeMonth = (direction: 'prev' | 'next') => {
        const newMonth = new Date(displayMonth);
        if (direction === 'prev') {
            newMonth.setMonth(newMonth.getMonth() - 1);
        } else {
            newMonth.setMonth(newMonth.getMonth() + 1);
        }
        setDisplayMonth(newMonth);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const formatDateDisplay = () => {
        const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${dayName} ${monthDay}`;
    };

    const monthName = displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const days = getDaysInMonth(displayMonth);
    const timeSlots = generateTimeSlots();
    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={handleClear}>
                        <GalleryText style={styles.headerButton}>Clear</GalleryText>
                    </Pressable>
                    <GalleryText style={styles.headerTitle}>Date & Time</GalleryText>
                    <Pressable onPress={handleDone}>
                        <GalleryText style={styles.saveButton}>Save</GalleryText>
                    </Pressable>
                </View>

                {/* Selected Date Display */}
                <View style={styles.selectedDateDisplay}>
                    <View style={styles.dateBox}>
                        <GalleryText style={styles.selectedDateText}>{formatDateDisplay()}</GalleryText>
                        <GalleryText style={styles.selectedTimeText}>{selectedTime}</GalleryText>
                    </View>
                    <ChevronRight color="#666" size={20} />
                    <View style={styles.endDatePlaceholder}>
                        <GalleryText style={styles.endDateLabel}>Optional</GalleryText>
                        <GalleryText style={styles.endDateText}>End Date</GalleryText>
                    </View>
                </View>

                {/* Month Navigation */}
                <View style={styles.monthHeader}>
                    <Pressable onPress={() => changeMonth('prev')} style={styles.monthArrow}>
                        <ChevronLeft color={COLORS.canvas.white} size={20} />
                    </Pressable>
                    <GalleryText style={styles.monthName}>{monthName}</GalleryText>
                    <Pressable onPress={() => changeMonth('next')} style={styles.monthArrow}>
                        <ChevronRight color={COLORS.canvas.white} size={20} />
                    </Pressable>
                </View>

                <View style={styles.content}>
                    {/* Calendar Grid */}
                    <View style={styles.calendarSection}>
                        {/* Week day headers */}
                        <View style={styles.weekDaysRow}>
                            {weekDays.map(day => (
                                <View key={day} style={styles.weekDayCell}>
                                    <GalleryText style={styles.weekDayText}>{day}</GalleryText>
                                </View>
                            ))}
                        </View>

                        {/* Calendar days */}
                        <View style={styles.daysGrid}>
                            {days.map((day, index) => {
                                if (day === null) {
                                    return <View key={`empty-${index}`} style={styles.dayCell} />;
                                }

                                const isSelected =
                                    day === selectedDate.getDate() &&
                                    displayMonth.getMonth() === selectedDate.getMonth() &&
                                    displayMonth.getFullYear() === selectedDate.getFullYear();

                                const dayDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
                                const isDisabled = minimumDate && dayDate < minimumDate;

                                return (
                                    <Pressable
                                        key={day}
                                        style={[
                                            styles.dayCell,
                                            isSelected && styles.selectedDayCell,
                                            isDisabled && styles.disabledDayCell,
                                        ]}
                                        onPress={() => !isDisabled && handleDayPress(day)}
                                        disabled={isDisabled}
                                    >
                                        <GalleryText
                                            style={[
                                                styles.dayText,
                                                isSelected && styles.selectedDayText,
                                                isDisabled && styles.disabledDayText,
                                            ]}
                                        >
                                            {day}
                                        </GalleryText>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Time Scroll List */}
                    <ScrollView style={styles.timeSection} showsVerticalScrollIndicator={false}>
                        {timeSlots.map(time => {
                            const isSelected = time === selectedTime;
                            return (
                                <Pressable
                                    key={time}
                                    style={[styles.timeSlot, isSelected && styles.selectedTimeSlot]}
                                    onPress={() => handleTimePress(time)}
                                >
                                    <GalleryText style={[styles.timeText, isSelected && styles.selectedTimeText]}>
                                        {time}
                                    </GalleryText>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Footer - Done Button */}
                <View style={styles.footer}>
                    <Pressable style={styles.doneButton} onPress={handleDone}>
                        <GalleryText style={styles.doneButtonText}>Done</GalleryText>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
    },
    headerButton: {
        fontSize: 16,
        color: COLORS.canvas.white,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.canvas.white,
    },
    saveButton: {
        fontSize: 16,
        color: COLORS.canvas.white,
        fontWeight: '600',
    },
    selectedDateDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
    },
    dateBox: {
        flex: 1,
    },
    selectedDateText: {
        fontSize: 14,
        color: '#999',
        marginBottom: 4,
    },
    selectedTimeText: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.canvas.white,
    },
    endDatePlaceholder: {
        alignItems: 'flex-end',
    },
    endDateLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    endDateText: {
        fontSize: 16,
        color: '#666',
    },
    monthHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    monthArrow: {
        padding: 8,
    },
    monthName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.canvas.white,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: 20,
    },
    calendarSection: {
        flex: 2,
        marginRight: 12,
    },
    weekDaysRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    weekDayCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    weekDayText: {
        fontSize: 11,
        color: '#666',
        fontWeight: '600',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%', // 7 days per week
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    selectedDayCell: {
        backgroundColor: COLORS.canvas.white,
        borderRadius: 20,
    },
    disabledDayCell: {
        opacity: 0.3,
    },
    dayText: {
        fontSize: 16,
        color: COLORS.canvas.white,
    },
    selectedDayText: {
        color: '#000',
        fontWeight: '700',
    },
    disabledDayText: {
        color: '#444',
    },
    timeSection: {
        flex: 1,
    },
    timeSlot: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 4,
        borderRadius: 8,
    },
    selectedTimeSlot: {
        backgroundColor: '#1a1a1a',
    },
    timeText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },
    selectedTimeText: {
        color: COLORS.canvas.white,
        fontWeight: '600',
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 16,
    },
    doneButton: {
        backgroundColor: COLORS.canvas.white,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
});
