import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { userApi } from '../../src/services/api';
import ParkingCard from '../../components/ParkingCard';

export default function FavoritesScreen() {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            const res = await (userApi as any).getFavorites();
            setFavorites(res.favorites || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePress = (slot: any) => {
        router.push(`/parking/${slot.id}`);
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]" edges={['top']}>
            <View className="px-6 py-4">
                <Text className="text-2xl font-bold text-white mb-1">My Favorites</Text>
                <Text className="text-slate-400 mb-4">Your saved parking spots</Text>

                {loading ? (
                    <View className="mt-10 items-center">
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : (
                    <FlatList
                        data={favorites}
                        renderItem={({ item }) => <ParkingCard slot={item} onPress={() => handlePress(item)} />}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListEmptyComponent={
                            <View className="py-20 items-center">
                                <Text className="text-slate-500">No favorites yet.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
