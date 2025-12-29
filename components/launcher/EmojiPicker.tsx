import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Modal, Pressable, ScrollView, TextInput, Text } from 'react-native';
import { GalleryText } from '../GalleryPrimitives';
import { COLORS } from '../../constants/theme';
import { X as XIcon, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface EmojiPickerProps {
    visible: boolean;
    currentEmoji: string;
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

// Curated emoji list by category
const EMOJI_CATEGORIES = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴'],
    'Gestures': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
    'People': ['💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁', '👅', '👄'],
    'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐈', '🦚', '🦜', '🦤', '🦩', '🦢'],
    'Food': ['🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯'],
    'Drinks': ['🥛', '☕', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧋', '🧃', '🧉', '🧊'],
    'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️‍♀️', '🤸', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🚴', '🚵', '🧗', '🤼', '🤹', '🎪', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🪈', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩'],
    'Travel': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩', '💺', '🛰', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥', '🛳', '⛴', '🚢'],
    'Objects': ['⌚', '📱', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '🧾', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒', '🛠', '⛏', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡', '⚔️', '🛡', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎', '🔑', '🗝', '🚪', '🪑', '🛋', '🛏', '🛌', '🧸', '🪆', '🖼', '🪞', '🪟', '🛍', '🎁', '🎈', '🎏', '🎀', '🪄', '🪅', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷', '🪧', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒', '🗓', '📆', '📅', '🗑', '📇', '🗃', '🗳', '🗄', '📋', '📁', '📂', '🗂', '🗞', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊', '🖋', '✒️', '🖌', '🖍', '📝', '✏️', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓'],
    'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
    'Flags': ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️'],
};

// Emoji keyword mapping for search
const EMOJI_KEYWORDS: Record<string, string> = {
    '😀': 'smile happy grin face',
    '😃': 'smile happy joy face',
    '😄': 'smile happy laugh face',
    '😁': 'grin smile happy face',
    '😆': 'laugh smile happy face',
    '😅': 'sweat smile nervous face',
    '🤣': 'laugh rolling floor rofl lol face',
    '😂': 'laugh tears joy cry face',
    '🙂': 'smile slight happy face',
    '😉': 'wink flirt face',
    '😊': 'smile blush happy face',
    '😇': 'angel halo innocent face',
    '🥰': 'love hearts adore face',
    '😍': 'love hearts eyes face',
    '🤩': 'star eyes excited wow face',
    '😘': 'kiss blow face',
    '🎉': 'party celebration confetti popper',
    '🎊': 'party celebration confetti ball',
    '🎈': 'party balloon celebration',
    '🎁': 'gift present party box',
    '🎂': 'cake birthday party celebration',
    '🍕': 'pizza food party',
    '🍔': 'burger food hamburger',
    '🍟': 'fries food french',
    '🌮': 'taco food mexican',
    '🌯': 'burrito food mexican',
    '🍺': 'beer drink party alcohol',
    '🍻': 'beer cheers party celebration',
    '🍷': 'wine drink party alcohol',
    '🥂': 'champagne cheers party celebration',
    '🍾': 'champagne party celebration',
    '🎵': 'music note song',
    '🎶': 'music notes song',
    '🎤': 'microphone music karaoke sing',
    '🎧': 'headphones music listen',
    '🎸': 'guitar music rock',
    '🥁': 'drum music percussion',
    '🎹': 'piano music keyboard',
    '🎺': 'trumpet music brass',
    '🎷': 'saxophone music jazz',
    '🎻': 'violin music classical',
    '☕': 'coffee cafe hot drink',
    '🍵': 'tea drink hot',
    '🧋': 'boba tea bubble drink',
    '🥤': 'drink cup soda',
    '🎨': 'art paint palette creative',
    '🖼': 'art frame picture',
    '🎭': 'theater drama masks art',
    '🛍': 'shopping bags buy store',
    '🛒': 'shopping cart buy store',
    '💳': 'credit card payment shopping',
    '💰': 'money bag cash shopping',
    '🏠': 'home house building',
    '🏢': 'office building work',
    '🏪': 'store shop convenience',
    '🏬': 'department store shopping mall',
    '👋': 'wave hello hi bye hand',
    '👍': 'thumbsup like good yes hand',
    '👎': 'thumbsdown dislike bad no hand',
    '👏': 'clap applause hands',
    '🙏': 'pray please thanks hand',
    '🤝': 'handshake deal agreement hands',
    '✌️': 'peace victory hand',
    '🤘': 'rock metal horns hand',
    '🤙': 'call phone shaka hand',
    '💪': 'muscle strong flex arm',
    '🐶': 'dog puppy pet animal',
    '🐱': 'cat kitten pet animal',
    '🐭': 'mouse rat animal',
    '🐰': 'rabbit bunny animal',
    '🦊': 'fox animal',
    '🐻': 'bear animal',
    '🐼': 'panda bear animal',
    '🐨': 'koala bear animal',
    '🐯': 'tiger animal',
    '🦁': 'lion animal',
    '🐷': 'pig animal',
    '🐸': 'frog animal',
    '🐵': 'monkey animal',
    '🦄': 'unicorn rainbow magical animal',
    '🐝': 'bee honey insect',
    '🦋': 'butterfly insect',
    '🚗': 'car auto vehicle drive',
    '🚕': 'taxi cab car vehicle',
    '🚙': 'suv car vehicle',
    '🚌': 'bus vehicle transport',
    '✈️': 'airplane plane travel fly',
    '🚀': 'rocket space ship',
    '⚽': 'soccer football sport ball',
    '🏀': 'basketball sport ball',
    '🏈': 'football sport ball',
    '⚾': 'baseball sport ball',
    '🎾': 'tennis sport ball',
    '❤️': 'heart love red',
    '💙': 'heart love blue',
    '💚': 'heart love green',
    '💛': 'heart love yellow',
    '💜': 'heart love purple',
    '🧡': 'heart love orange',
    '🖤': 'heart love black',
    '🤍': 'heart love white',
    '🔥': 'fire hot flame',
    '⭐': 'star favorite',
    '✨': 'sparkle shine stars',
    '💫': 'dizzy star',
    '🌟': 'star glow shine',
    '☀️': 'sun sunny weather',
    '🌙': 'moon crescent night',
    '⛅': 'cloud sun weather',
    '🌈': 'rainbow colorful',
    '⚡': 'lightning bolt zap electric',
    '💯': 'hundred perfect score',
    '✅': 'check mark done yes',
    '❌': 'x cross no cancel',
    '🎮': 'game controller gaming video',
    '🎯': 'target bullseye goal',
    '🎲': 'dice game random',
};

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ visible, currentEmoji, onSelect, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Smileys');

    const categories = Object.keys(EMOJI_CATEGORIES);

    const filteredEmojis = useMemo(() => {
        if (!searchQuery) {
            return EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES];
        }

        // Search across all emojis by keywords
        const query = searchQuery.toLowerCase();
        const allEmojis = Object.values(EMOJI_CATEGORIES).flat();

        return allEmojis.filter(emoji => {
            const keywords = EMOJI_KEYWORDS[emoji] || '';
            return keywords.toLowerCase().includes(query);
        });
    }, [selectedCategory, searchQuery]);

    const handleEmojiSelect = (emoji: string) => {
        onSelect(emoji);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <GalleryText style={styles.headerTitle}>Select Icon</GalleryText>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <XIcon color={COLORS.canvas.white} size={24} />
                    </Pressable>
                </View>

                {/* Current Emoji Display */}
                <View style={styles.currentEmojiDisplay}>
                    <Text style={styles.currentEmoji}>{currentEmoji}</Text>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search color="#666" size={18} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search emojis..."
                        placeholderTextColor="#666"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <XIcon color="#666" size={18} />
                        </Pressable>
                    )}
                </View>

                {/* Category Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
                    {categories.map((category) => (
                        <Pressable
                            key={category}
                            style={[
                                styles.categoryTab,
                                selectedCategory === category && styles.categoryTabActive
                            ]}
                            onPress={() => {
                                setSelectedCategory(category);
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                        >
                            <GalleryText
                                style={[
                                    styles.categoryTabText,
                                    selectedCategory === category && styles.categoryTabTextActive
                                ]}
                            >
                                {category}
                            </GalleryText>
                        </Pressable>
                    ))}
                </ScrollView>

                {/* Emoji Grid */}
                <ScrollView style={styles.emojiScrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.emojiGrid}>
                        {filteredEmojis.map((emoji, index) => (
                            <Pressable
                                key={`${emoji}-${index}`}
                                style={[
                                    styles.emojiButton,
                                    currentEmoji === emoji && styles.emojiButtonSelected
                                ]}
                                onPress={() => handleEmojiSelect(emoji)}
                            >
                                <Text style={styles.emoji}>{emoji}</Text>
                            </Pressable>
                        ))}
                    </View>
                </ScrollView>
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
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        position: 'relative',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.canvas.white,
    },
    closeButton: {
        position: 'absolute',
        right: 20,
        top: 60,
        padding: 8,
    },
    currentEmojiDisplay: {
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: '#1a1a1a',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
    },
    currentEmoji: {
        fontSize: 64,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        marginHorizontal: 20,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.canvas.white,
    },
    categoryTabs: {
        maxHeight: 50,
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    categoryTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
    },
    categoryTabActive: {
        backgroundColor: COLORS.accents.bleuGrey,
    },
    categoryTabText: {
        fontSize: 14,
        color: '#999',
        fontWeight: '500',
    },
    categoryTabTextActive: {
        color: COLORS.canvas.white,
        fontWeight: '700',
    },
    emojiScrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingBottom: 40,
    },
    emojiButton: {
        width: '12%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    emojiButtonSelected: {
        backgroundColor: '#1a1a1a',
    },
    emoji: {
        fontSize: 32,
    },
});
