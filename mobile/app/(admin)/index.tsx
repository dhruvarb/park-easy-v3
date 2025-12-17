import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../src/services/api';

export default function AdminDashboard() {
    const [lots, setLots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            fetchLots();
        }, [])
    );

    const fetchLots = async () => {
        try {
            setLoading(true);
            const res = await (adminApi as any).getLots();
            setLots(res.lots || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert("Delete Spot", "Are you sure? This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    try {
                        await (adminApi as any).deleteLot(id);
                        setLots(prev => prev.filter(l => l.id !== id));
                        Alert.alert("Success", "Parking spot deleted");
                    } catch (e) {
                        Alert.alert("Error", "Failed to delete spot");
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: any }) => {
        const imageUrl = (item.images && item.images.length > 0 && typeof item.images[0] === 'string')
            ? item.images[0]
            : 'https://placehold.co/600x400/png?text=Parking';

        return (
            <View className="bg-slate-800 rounded-2xl overflow-hidden mb-4 border border-white/5">
                <View className="h-40 relative">
                    <Image
                        source={{ uri: imageUrl }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                    <View className="absolute top-2 right-2 flex-row gap-2">
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/(admin)/add-lot', params: { editId: item.id } })}
                            className="bg-blue-500/80 p-2 rounded-lg"
                        >
                            <Ionicons name="create" size={16} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleDelete(item.id)}
                            className="bg-red-500/80 p-2 rounded-lg"
                        >
                            <Ionicons name="trash" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View className="p-4">
                    <Text className="text-white font-bold text-lg mb-1">{item.name}</Text>
                    <Text className="text-slate-400 text-sm mb-2">{item.address}</Text>
                    <View className="flex-row items-center gap-2">
                        <View className="bg-emerald-500/20 px-2 py-1 rounded border border-emerald-500/30">
                            <Text className="text-emerald-400 text-xs font-bold">Cap: {item.total_capacity}</Text>
                        </View>
                        {item.has_ev && (
                            <View className="bg-sky-500/20 px-2 py-1 rounded border border-sky-500/30">
                                <Text className="text-sky-400 text-xs font-bold">EV Ready</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]" edges={['top']}>
            <View className="flex-1 px-6 pt-4">
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-2xl font-bold text-white">Dashboard</Text>
                        <Text className="text-slate-400">Manage your spots</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/(admin)/add-lot')}
                        className="bg-sky-500 p-3 rounded-xl shadow-lg shadow-sky-500/20"
                    >
                        <Ionicons name="add" size={24} color="#0f172a" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : (
                    <FlatList
                        data={lots}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListEmptyComponent={
                            <View className="py-20 items-center">
                                <Text className="text-slate-500">No parking spots created.</Text>
                                <Text className="text-sky-500 mt-2 font-bold" onPress={() => router.push('/(admin)/add-lot')}>Create your first one!</Text>
                            </View>
                        }
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
