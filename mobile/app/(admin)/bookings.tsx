import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminApi } from '../../src/services/api';
import { format } from 'date-fns';

export default function AdminBookingsScreen() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
        }, [])
    );

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await (adminApi as any).getBookings();
            setBookings(res.bookings || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-white/5">
            <View className="flex-row justify-between mb-2">
                <View>
                    <Text className="text-white font-bold text-lg">{item.spotName}</Text>
                    <Text className="text-slate-400 text-sm">Customer: {item.customerName}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-emerald-400 font-bold">₹{item.amount}</Text>
                    <View className={`px-2 py-0.5 rounded mt-1 ${item.status === 'confirmed' ? 'bg-green-500/20' :
                            item.status === 'pending' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                        }`}>
                        <Text className={`text-xs capitalize ${item.status === 'confirmed' ? 'text-green-400' :
                                item.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                            }`}>{item.status}</Text>
                    </View>
                </View>
            </View>
            <View className="bg-slate-900/50 p-3 rounded-xl">
                <View className="flex-row justify-between mb-1">
                    <Text className="text-slate-500 text-xs">Date</Text>
                    <Text className="text-white text-xs">{item.date}</Text>
                </View>
                <View className="flex-row justify-between">
                    <Text className="text-slate-500 text-xs">Time</Text>
                    <Text className="text-white text-xs">{item.timeSlot}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]" edges={['top']}>
            <View className="flex-1 px-6 pt-4">
                <Text className="text-2xl font-bold text-white mb-4">All Bookings</Text>
                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : (
                    <FlatList
                        data={bookings}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListEmptyComponent={
                            <View className="py-20 items-center">
                                <Text className="text-slate-500">No bookings yet.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
