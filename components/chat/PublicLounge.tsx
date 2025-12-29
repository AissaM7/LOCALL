import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TextInput, Pressable, FlatList, Text, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { COLORS, DESIGN } from '../../constants/theme';
import { Send, ChevronLeft, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { GalleryText } from '../GalleryPrimitives';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Message {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    isOptimistic?: boolean;
    isSystem?: boolean;
    profile?: {
        username: string | null;
    };
}

interface LoungeParticipant {
    id: string;
    username: string;
    avatar_url: string;
}

interface PublicLoungeProps {
    eventId: string;
    onBack?: () => void;
    onClose?: () => void;
}

// Mock participants for the "In the Lounge" header
const MOCK_PARTICIPANTS: LoungeParticipant[] = [
    { id: '1', username: 'Maya', avatar_url: 'https://api.dicebear.com/9.x/fun-emoji/png?seed=Maya' },
    { id: '2', username: 'Kai', avatar_url: 'https://api.dicebear.com/9.x/fun-emoji/png?seed=Kai' },
    { id: '3', username: 'Zoe', avatar_url: 'https://api.dicebear.com/9.x/fun-emoji/png?seed=Zoe' },
    { id: '4', username: 'Alex', avatar_url: 'https://api.dicebear.com/9.x/fun-emoji/png?seed=Alex' },
    { id: '5', username: 'Jordan', avatar_url: 'https://api.dicebear.com/9.x/fun-emoji/png?seed=Jordan' },
    { id: '6', username: 'Sam', avatar_url: 'https://api.dicebear.com/9.x/fun-emoji/png?seed=Sam' },
];

// Icebreaker chips
const ICEBREAKER_CHIPS = [
    { id: '1', emoji: '👋', text: 'Hi everyone!' },
    { id: '2', emoji: '🚗', text: 'Anyone need a ride?' },
    { id: '3', emoji: '📍', text: 'Where should we meet?' },
    { id: '4', emoji: '🎉', text: "Can't wait for this!" },
];

export const PublicLounge: React.FC<PublicLoungeProps> = ({ eventId, onBack, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [participants, setParticipants] = useState<LoungeParticipant[]>(MOCK_PARTICIPANTS);
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const getInitialUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        getInitialUser();

        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*, profile:profiles(username)')
                .eq('event_id', eventId)
                .order('created_at', { ascending: true });

            if (data) setMessages(data as any);
        };

        fetchMessages();

        const channel = supabase
            .channel(`messages:${eventId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `event_id=eq.${eventId}`
            }, async (payload) => {
                const newMsg = payload.new as Message;

                setMessages(prev => {
                    if (prev.find(m => m.id === newMsg.id)) return prev;
                    const filtered = prev.filter(m => !(m.isOptimistic && m.content === newMsg.content));
                    return [...filtered, newMsg];
                });

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', newMsg.user_id)
                    .single();

                setMessages(prev => prev.map(m =>
                    m.id === newMsg.id ? { ...m, profile: profile as any } : m
                ));
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [eventId]);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages]);

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;
        setInputText('');

        try {
            let user = currentUser;
            if (!user) {
                const { data: anonData } = await supabase.auth.signInAnonymously();
                user = anonData?.user;
                setCurrentUser(user);
            }
            if (!user) return;

            const optimisticMsg: Message = {
                id: `opt-${Date.now()}`,
                content,
                created_at: new Date().toISOString(),
                user_id: user.id,
                isOptimistic: true,
                profile: { username: 'You' }
            };
            setMessages(prev => [...prev, optimisticMsg]);

            const { data: profileCheck } = await supabase.from('profiles').select('id').eq('id', user.id).single();
            if (!profileCheck) {
                await supabase.from('profiles').insert({
                    id: user.id,
                    username: `Guest_${user.id.slice(0, 4)}`,
                    updated_at: new Date().toISOString()
                } as any);
            }

            const { data: inserted, error: insertError } = await supabase.from('messages').insert({
                event_id: eventId,
                user_id: user.id,
                content
            } as any).select().single() as any;

            if (insertError) {
                setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            } else if (inserted) {
                setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...inserted, profile: { username: 'You' } } : m));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSend = () => sendMessage(inputText);

    const handleIcebreakerTap = (chip: typeof ICEBREAKER_CHIPS[0]) => {
        sendMessage(`${chip.emoji} ${chip.text}`);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.user_id === currentUser?.id || item.isOptimistic;

        if (item.isSystem) {
            return (
                <View style={styles.systemMessage}>
                    <GalleryText style={styles.systemText}>{item.content}</GalleryText>
                </View>
            );
        }

        return (
            <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
                    {!isMe && (
                        <GalleryText style={styles.username}>
                            {item.profile?.username || 'Guest'}
                        </GalleryText>
                    )}
                    <GalleryText style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
                        {item.content}
                    </GalleryText>
                    <GalleryText style={styles.timestamp}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </GalleryText>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.icebreakersSection}>
                <GalleryText style={styles.heroEmoji}>💬</GalleryText>
                <GalleryText style={styles.icebreakersTitle}>Break the ice</GalleryText>

                <View style={styles.chipsContainer}>
                    {ICEBREAKER_CHIPS.map((chip) => (
                        <Pressable
                            key={chip.id}
                            style={({ pressed }) => [
                                styles.chip,
                                pressed && styles.chipPressed
                            ]}
                            onPress={() => handleIcebreakerTap(chip)}
                        >
                            <GalleryText style={styles.chipEmoji}>{chip.emoji}</GalleryText>
                            <GalleryText style={styles.chipText}>{chip.text}</GalleryText>
                        </Pressable>
                    ))}
                </View>
            </View>
        </View>
    );

    return (
        <LinearGradient
            colors={['#1e0b36', '#000000']}
            style={[styles.root, {
                marginTop: insets.top + 72,
                height: SCREEN_HEIGHT - (insets.top + 72) - insets.bottom
            }]}
        >
            {/* Premium Header Controller */}
            <View style={styles.headerWrapper}>
                <View style={styles.header}>
                    <Pressable onPress={onBack} style={styles.headerItem}>
                        <BlurView intensity={20} tint="light" style={styles.iconCircle}>
                            <ChevronLeft size={20} color="#fff" />
                        </BlurView>
                    </Pressable>

                    <Pressable onPress={onClose}>
                        <BlurView intensity={20} tint="light" style={styles.iconCircle}>
                            <X size={18} color="#fff" strokeWidth={3} />
                        </BlurView>
                    </Pressable>
                </View>

                {/* "In the Lounge" Avatars */}
                <View style={styles.loungeHeader}>
                    <View style={styles.loungeHeaderTop}>
                        <GalleryText style={styles.loungeTitle}>In the Lounge</GalleryText>
                        <View style={styles.countBadge}>
                            <GalleryText style={styles.countText}>{participants.length}</GalleryText>
                        </View>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.avatarsContainer}
                    >
                        {participants.map((p, index) => (
                            <Pressable key={p.id} style={styles.avatarWrapper}>
                                <Image
                                    source={{ uri: p.avatar_url }}
                                    style={[
                                        styles.avatar,
                                        index === 0 && styles.avatarFirst
                                    ]}
                                />
                                <View style={styles.onlineDot} />
                            </Pressable>
                        ))}
                        <View style={styles.addMoreAvatar}>
                            <GalleryText style={styles.addMoreText}>+</GalleryText>
                        </View>
                    </ScrollView>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    style={styles.messagesList}
                    contentContainerStyle={styles.messagesContent}
                    ListEmptyComponent={renderEmptyState}
                    renderItem={renderMessage}
                />

                {/* Input Wrapper */}
                <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <BlurView intensity={20} tint="dark" style={styles.inputBar}>
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Message the lounge..."
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            onSubmitEditing={handleSend}
                            returnKeyType="send"
                        />
                        <Pressable onPress={handleSend} style={styles.sendBtn}>
                            <Send size={20} color="#fff" fill="#fff" />
                        </Pressable>
                    </BlurView>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    root: {
        width: '100%',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        overflow: 'hidden',
        zIndex: 40,
        elevation: 10,
    },
    headerWrapper: {
        zIndex: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    headerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.15)',
        overflow: 'hidden',
    },
    // Lounge Header Styles
    loungeHeader: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    loungeHeaderTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    loungeTitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    countBadge: {
        backgroundColor: COLORS.accents.hotPink,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    countText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    avatarsContainer: {
        gap: 12,
        paddingRight: 20,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarFirst: {
        borderColor: COLORS.accents.electricLime,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: '#1e0b36',
    },
    addMoreAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addMoreText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 20,
        fontWeight: '300',
    },
    // Empty State & Icebreakers
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    icebreakersSection: {
        width: '100%',
        alignItems: 'center',
    },
    heroEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    icebreakersTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 24,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        maxWidth: '80%',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
    },
    chipPressed: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: 'rgba(255,255,255,0.2)',
    },
    chipEmoji: {
        fontSize: 14,
    },
    chipText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        fontWeight: '500',
    },
    // System Messages
    systemMessage: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    systemText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
        fontStyle: 'italic',
    },
    keyboardView: {
        flex: 1,
    },
    messagesList: {
        flex: 1,
    },
    messagesContent: {
        padding: 20,
        paddingTop: 20,
        paddingBottom: 20,
        flexGrow: 1,
    },
    messageRow: {
        marginBottom: 20,
        flexDirection: 'row',
    },
    myMessageRow: {
        justifyContent: 'flex-end',
    },
    otherMessageRow: {
        justifyContent: 'flex-start',
    },
    bubble: {
        padding: 16,
        borderRadius: 24,
        maxWidth: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 5,
    },
    myBubble: {
        backgroundColor: '#FF006B',
        borderBottomRightRadius: 6,
    },
    otherBubble: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderBottomLeftRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    username: {
        color: COLORS.accents.electricLime,
        fontSize: 10,
        fontWeight: '900',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
        color: '#fff',
    },
    myMessageText: {
        fontWeight: '600',
    },
    otherMessageText: {
        fontWeight: '400',
    },
    timestamp: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.5)',
        alignSelf: 'flex-end',
        marginTop: 6,
        fontWeight: '500',
    },
    inputContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 8,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    input: {
        flex: 1,
        color: '#fff',
        paddingHorizontal: 16,
        fontSize: 16,
        height: 48,
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FF006B',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 8,
    },
});
