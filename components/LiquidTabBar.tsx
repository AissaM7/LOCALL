import { View, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Map, List, Plus } from 'lucide-react-native';
import { COLORS, DESIGN } from '../constants/theme';
import * as Haptics from 'expo-haptics';

interface LiquidTabBarProps {
    activeTab: 'map' | 'list';
    onTabChange: (tab: 'map' | 'list') => void;
    onPost: () => void;
}

export const LiquidTabBar = ({ activeTab, onTabChange, onPost }: LiquidTabBarProps) => {

    const handlePress = (tab: 'map' | 'list') => {
        Haptics.selectionAsync();
        onTabChange(tab);
    };

    const handlePost = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPost();
    };

    return (
        <View style={styles.container}>
            <BlurView intensity={30} tint="light" style={styles.blurContainer}>
                {/* Map Tab */}
                <Pressable
                    style={[styles.tab, activeTab === 'map' && styles.activeTab]}
                    onPress={() => handlePress('map')}
                >
                    <Map
                        color={activeTab === 'map' ? COLORS.text.primary : COLORS.text.secondary}
                        size={24}
                        strokeWidth={activeTab === 'map' ? 2.5 : 2}
                    />
                </Pressable>

                {/* Post Button (Center) */}
                <Pressable style={styles.postButton} onPress={handlePost}>
                    <Plus color={COLORS.text.inverse} size={28} strokeWidth={3} />
                </Pressable>

                {/* List Tab */}
                <Pressable
                    style={[styles.tab, activeTab === 'list' && styles.activeTab]}
                    onPress={() => handlePress('list')}
                >
                    <List
                        color={activeTab === 'list' ? COLORS.text.primary : COLORS.text.secondary}
                        size={24}
                        strokeWidth={activeTab === 'list' ? 2.5 : 2}
                    />
                </Pressable>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
    },
    blurContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 6,
        borderRadius: 999, // Pill shape
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)', // Frosty border
        backgroundColor: 'rgba(255, 255, 255, 0.3)', // Translucent fill
        gap: 8,
        // Glass Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    tab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTab: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)', // Active highlight
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    postButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.accents.bleuGrey, // Hot Pink
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        ...DESIGN.shadows.pop, // Pop shadow
    }
});
