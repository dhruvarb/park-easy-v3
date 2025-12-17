import { View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { userApi } from '../../src/services/api';
import { format } from 'date-fns';

export default function BookingsScreen() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'Active' | 'Upcoming' | 'Past'>('Active');

    // Refund
    const [showRefund, setShowRefund] = useState(false);
    const [refundReason, setRefundReason] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [refundLoading, setRefundLoading] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await (userApi as any).getBookings();
            setBookings(res.bookings || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getCounts = () => {
        const now = new Date();
        let active = 0, upcoming = 0, past = 0;
        bookings.forEach(b => {
            const start = new Date(b.start_time);
            const end = new Date(b.end_time);
            const isCancelled = b.status === 'cancelled';
            if (start <= now && end >= now && !isCancelled) active++;
            else if (start > now && !isCancelled) upcoming++;
            else if (end < now || isCancelled) past++;
        });
        return { active, upcoming, past };
    };
    const counts = getCounts();

    const filtered = bookings.filter(b => {
        const now = new Date();
        const start = new Date(b.start_time);
        const end = new Date(b.end_time);
        const isCancelled = b.status === 'cancelled';
        if (activeTab === 'Active') return start <= now && end >= now && !isCancelled;
        if (activeTab === 'Upcoming') return start > now && !isCancelled;
        return end < now || isCancelled;
    });

    const handleNavigate = (b: any) => {
        const url = b.latitude && b.longitude
            ? `https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`
            : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.address)}`;
        Linking.openURL(url);
    };

    const handleCancel = (id: string) => {
        Alert.alert("Cancel Booking", "Are you sure? >30 mins before = Full Refund.", [
            { text: "No", style: 'cancel' },
            {
                text: "Yes, Cancel", style: 'destructive', onPress: async () => {
                    try {
                        const res = await (userApi as any).cancelBooking(id);
                        Alert.alert("Cancelled", res.message);
                        fetchBookings();
                    } catch (e: any) {
                        Alert.alert("Error", e.response?.data?.message || "Failed to cancel");
                    }
                }
            }
        ]);
    };

    const handleCheckout = (id: string) => {
        Alert.alert("Check Out", "Confirm check out? Overdue time incurs penalty.", [
            { text: "No", style: 'cancel' },
            {
                text: "Yes, Check Out", onPress: async () => {
                    try {
                        const res = await (userApi as any).checkoutBooking(id);
                        Alert.alert("Checked Out", res.message);
                        fetchBookings();
                    } catch (e: any) {
                        Alert.alert("Error", e.response?.data?.message || "Failed to check out");
                    }
                }
            }
        ]);
    };

    const submitRefund = async () => {
        if (!selectedBooking || !refundReason) return;
        setRefundLoading(true);
        try {
            await (userApi as any).requestRefund({ bookingId: selectedBooking.id, reason: refundReason });
            Alert.alert("Success", "Refund request submitted");
            setShowRefund(false);
            setRefundReason('');
            fetchBookings();
        } catch (e: any) {
            Alert.alert("Error", e.response?.data?.message || "Failed");
        } finally {
            setRefundLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-white/5">
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                    <Text className="text-white font-bold text-lg mb-1">{item.lot_name}</Text>
                    <Text className="text-slate-400 text-xs mb-2">{item.address}</Text>
                    <View className="flex-row gap-2">
                        {item.status === 'cancelled' && <View className="bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30"><Text className="text-red-400 text-xs">Cancelled</Text></View>}
                        {item.refund_status && <View className="bg-yellow-500/20 px-2 py-0.5 rounded border border-yellow-500/30"><Text className="text-yellow-400 text-xs">Refund: {item.refund_status}</Text></View>}
                    </View>
                </View>
                <View className="items-end">
                    <Text className="text-sky-400 font-bold">₹{item.amount_paid}</Text>
                    <Text className="text-slate-500 text-xs capitalize">{item.vehicle_type}</Text>
                </View>
            </View>

            <View className="bg-slate-900/50 p-3 rounded-xl mb-3">
                <View className="flex-row justify-between mb-1">
                    <Text className="text-slate-500 text-xs">Start</Text>
                    <Text className="text-white text-xs">{format(new Date(item.start_time), 'PP p')}</Text>
                </View>
                <View className="flex-row justify-between">
                    <Text className="text-slate-500 text-xs">End</Text>
                    <Text className="text-white text-xs">{format(new Date(item.end_time), 'PP p')}</Text>
                </View>
            </View>

            <View className="flex-row gap-2">
                {(activeTab === 'Active' || activeTab === 'Upcoming') && (
                    <TouchableOpacity
                        onPress={() => handleNavigate(item)}
                        className="flex-1 bg-sky-500/10 py-2 rounded-lg items-center border border-sky-500/30"
                    >
                        <Text className="text-sky-400 font-bold text-xs">Navigate</Text>
                    </TouchableOpacity>
                )}

                {activeTab === 'Upcoming' && (
                    <TouchableOpacity
                        onPress={() => handleCancel(item.id)}
                        className="flex-1 bg-red-500/10 py-2 rounded-lg items-center border border-red-500/30"
                    >
                        <Text className="text-red-400 font-bold text-xs">Cancel</Text>
                    </TouchableOpacity>
                )}

                {activeTab === 'Active' && (
                    <TouchableOpacity
                        onPress={() => handleCheckout(item.id)}
                        className="flex-1 bg-green-500/10 py-2 rounded-lg items-center border border-green-500/30"
                    >
                        <Text className="text-green-400 font-bold text-xs">Check Out</Text>
                    </TouchableOpacity>
                )}

                {activeTab === 'Past' && !item.refund_status && item.status !== 'cancelled' && (
                    <TouchableOpacity
                        onPress={() => { setSelectedBooking(item); setShowRefund(true); }}
                        className="flex-1 bg-yellow-500/10 py-2 rounded-lg items-center border border-yellow-500/30"
                    >
                        <Text className="text-yellow-400 font-bold text-xs">Refund</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]" edges={['top']}>
            <View className="px-6 py-4">
                <Text className="text-2xl font-bold text-white mb-2">My Bookings</Text>

                {/* Tabs */}
                <View className="flex-row bg-slate-800 p-1 rounded-xl mb-4 border border-white/5">
                    {['Active', 'Upcoming', 'Past'].map((t: any) => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setActiveTab(t)}
                            className={`flex-1 py-2 items-center rounded-lg ${activeTab === t ? 'bg-indigo-600 shadow-md' : ''}`}
                        >
                            <Text className={`font-medium ${activeTab === t ? 'text-white' : 'text-slate-400'} text-xs`}>
                                {t} ({t === 'Active' ? counts.active : t === 'Upcoming' ? counts.upcoming : counts.past})
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <FlatList
                    data={filtered}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View className="py-20 items-center">
                            <Text className="text-slate-500">No {activeTab.toLowerCase()} bookings</Text>
                        </View>
                    }
                />
            </View>

            {/* Refund Modal */}
            <Modal visible={showRefund} transparent animationType="fade">
                <View className="flex-1 justify-center items-center bg-black/80 px-4">
                    <View className="bg-slate-900 w-full max-w-sm p-6 rounded-2xl border border-white/10">
                        <Text className="text-lg font-bold text-white mb-4">Request Refund</Text>
                        <Text className="text-slate-400 mb-4 text-sm">Reason for refund:</Text>

                        {['Did not check in', 'Left early', 'Other'].map(r => (
                            <TouchableOpacity
                                key={r}
                                onPress={() => setRefundReason(r)}
                                className={`p-3 rounded-xl border mb-3 ${refundReason === r ? 'bg-sky-500/20 border-sky-500' : 'bg-slate-800 border-white/10'}`}
                            >
                                <Text className={refundReason === r ? 'text-sky-400' : 'text-slate-300'}>{r}</Text>
                            </TouchableOpacity>
                        ))}

                        <View className="flex-row gap-3 mt-4">
                            <TouchableOpacity onPress={() => setShowRefund(false)} className="flex-1 py-3 bg-slate-800 rounded-xl items-center">
                                <Text className="text-slate-300 font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={submitRefund} disabled={refundLoading} className="flex-1 py-3 bg-sky-500 rounded-xl items-center">
                                <Text className="text-slate-900 font-bold">{refundLoading ? 'Sending...' : 'Submit'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
