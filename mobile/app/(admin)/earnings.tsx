import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminApi } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

export default function AdminEarningsScreen() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [])
    );

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await (adminApi as any).getEarnings();
            setStats(res.overview);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <View className="flex-1 bg-[#0f172a] justify-center items-center"><ActivityIndicator size="large" color="#3b82f6" /></View>;

    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]" edges={['top']}>
            <ScrollView className="flex-1 px-6 pt-4">
                <Text className="text-2xl font-bold text-white mb-6">Earnings & Revenue</Text>

                <View className="flex-row gap-4 mb-8">
                    <View className="flex-1 bg-slate-800 p-5 rounded-2xl border border-white/5 shadow-lg">
                        <View className="bg-emerald-500/10 w-10 h-10 rounded-full items-center justify-center mb-3">
                            <Ionicons name="cash" size={20} color="#10b981" />
                        </View>
                        <Text className="text-slate-400 text-xs uppercase font-bold">Total Revenue</Text>
                        <Text className="text-2xl font-bold text-white mt-1">₹{stats?.totalRevenue || 0}</Text>
                        <Text className="text-slate-500 text-xs mt-1">Last 30 Days</Text>
                    </View>
                    <View className="flex-1 bg-slate-800 p-5 rounded-2xl border border-white/5 shadow-lg">
                        <View className="bg-blue-500/10 w-10 h-10 rounded-full items-center justify-center mb-3">
                            <Ionicons name="receipt" size={20} color="#3b82f6" />
                        </View>
                        <Text className="text-slate-400 text-xs uppercase font-bold">Total Bookings</Text>
                        <Text className="text-2xl font-bold text-white mt-1">{stats?.totalBookings || 0}</Text>
                        <Text className="text-slate-500 text-xs mt-1">Last 30 Days</Text>
                    </View>
                </View>

                <Text className="text-lg font-bold text-white mb-4">Daily Breakdown</Text>
                <View className="bg-slate-800 rounded-2xl border border-white/5 overflow-hidden mb-10">
                    {stats?.daily?.length > 0 ? (
                        stats.daily.map((day: any, idx: number) => (
                            <View key={idx} className={`p-4 flex-row justify-between items-center ${idx !== stats.daily.length - 1 ? 'border-b border-white/5' : ''}`}>
                                <View>
                                    <Text className="text-white font-medium">{new Date(day.date).toLocaleDateString()}</Text>
                                    <Text className="text-slate-500 text-xs">{day.bookingscount} bookings</Text>
                                </View>
                                <Text className="text-emerald-400 font-bold">₹{day.amount}</Text>
                            </View>
                        ))
                    ) : (
                        <View className="p-8 items-center">
                            <Text className="text-slate-500">No earnings data available.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
