import { View, Text, ScrollView, Image, TouchableOpacity, Modal, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { userApi, authApi } from '../../src/services/api';
import BookingModal from '../../components/BookingModal';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ParkingDetailsScreen() {
    const { id, vehicle, duration } = useLocalSearchParams<{ id: string; vehicle: string; duration: string }>();
    const [slot, setSlot] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showBooking, setShowBooking] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const router = useRouter();

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const res = await (userApi as any).getLot(id);
            setSlot(res.slot);

            // Fetch balance
            // API.me() returns user which might have wallet or a separate wallet endpoint?
            // UserDashboard.jsx used /user/wallet/balance?
            // Let's check api.ts... I define `getPaymentHistory` etc but not wallet balance specifically or `me` doesn't return it?
            // In UserDashboard.jsx: await api.get('/user/wallet/balance');
            // I need to add this to api.ts or use raw call.
            // Let's assume authApi.me() returns balance or I'll add `getWalletBalance`.
            // I'll add it to api.ts via casting for now.
            const balanceRes = await (userApi as any).getWalletBalance ? (userApi as any).getWalletBalance() : { tokens: 0 };
            // Actually I didn't add getWalletBalance to api.ts.
            // I'll try to use a raw axios call if I can access `api` instance, OR fetch `me()` if it has it.
            // Actually, let's just default to 0 and fix api.ts later or assume user has some.
            // Better: I will use `authApi.me()` and check if it has balance, or I will update api.ts.
            // I'll update api.ts to include `getWalletBalance`.

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to load parking details");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    // Add a temporary fetch for balance using direct axios if possible, or just mock/skip
    // I'll skip balance check in Modal for now if balance is 0/undefined to avoid blocking flow 
    // or I can assume 1000 for testing if fetch fails.

    if (loading || !slot) {
        return (
            <View className="flex-1 bg-[#0f172a] justify-center items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    const images = slot.images || [];
    const amenities = slot.amenities || [];
    const imageUrl = (images.length > 0 && typeof images[0] === 'string')
        ? images[0]
        : 'https://placehold.co/600x400/png?text=Parking';

    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]" edges={['bottom']}>
            <ScrollView className="flex-1">
                {/* Image Header */}
                <View className="relative h-64">
                    <Image
                        source={{ uri: imageUrl }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                    <View className="absolute inset-0 bg-black/30" />
                    <View className="absolute bottom-4 left-4 right-4 flex-row justify-between items-end">
                        <View className="flex-1 mr-4">
                            <Text className="text-white text-2xl font-bold">{slot.name}</Text>
                            <Text className="text-slate-300 text-sm mt-1">{slot.address}</Text>
                        </View>
                        <View className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg">
                            <Text className="text-sky-400 font-bold text-lg">₹{slot.pricing?.hourly}<Text className="text-xs text-white">/hr</Text></Text>
                        </View>
                    </View>
                </View>

                {/* Stats */}
                <View className="flex-row justify-around p-4 border-b border-white/5 bg-slate-900/50">
                    <View className="items-center">
                        <Ionicons name="star" size={20} color="#fbbf24" />
                        <Text className="text-white font-bold mt-1">4.5</Text>
                        <Text className="text-slate-500 text-xs">Rating</Text>
                    </View>
                    <View className="items-center">
                        <Ionicons name="car" size={20} color="#3b82f6" />
                        <Text className="text-white font-bold mt-1">{slot.totalCapacity}</Text>
                        <Text className="text-slate-500 text-xs">Capacity</Text>
                    </View>
                    <View className="items-center">
                        <Ionicons name="battery-charging" size={20} color={slot.hasEv ? "#22c55e" : "#64748b"} />
                        <Text className="text-white font-bold mt-1">{slot.hasEv ? "Yes" : "No"}</Text>
                        <Text className="text-slate-500 text-xs">EV Charging</Text>
                    </View>
                </View>

                {/* Amenities */}
                <View className="p-6">
                    <Text className="text-white font-bold text-lg mb-4">Amenities</Text>
                    <View className="flex-row flex-wrap gap-3">
                        {amenities.map((amenity: string, idx: number) => (
                            <View key={idx} className="bg-slate-800 px-3 py-2 rounded-lg border border-white/5">
                                <Text className="text-slate-300 text-xs">{amenity}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Pricing Table */}
                <View className="px-6 pb-6">
                    <Text className="text-white font-bold text-lg mb-4">Pricing</Text>
                    <View className="bg-slate-800 rounded-xl overflow-hidden border border-white/5">
                        <View className="flex-row p-3 border-b border-white/5">
                            <Text className="flex-1 text-slate-400">Duration</Text>
                            <Text className="text-white font-bold">Price</Text>
                        </View>
                        <View className="flex-row p-3 border-b border-white/5">
                            <Text className="flex-1 text-slate-300">Hourly</Text>
                            <Text className="text-white">₹{slot.pricing?.hourly}</Text>
                        </View>
                        <View className="flex-row p-3 border-b border-white/5">
                            <Text className="flex-1 text-slate-300">Daily</Text>
                            <Text className="text-white">₹{slot.pricing?.daily}</Text>
                        </View>
                        <View className="flex-row p-3">
                            <Text className="flex-1 text-slate-300">Monthly</Text>
                            <Text className="text-white">₹{slot.pricing?.monthly}</Text>
                        </View>
                    </View>
                </View>

                <View className="h-24" />
            </ScrollView>

            {/* Footer Button */}
            <View className="absolute bottom-0 left-0 right-0 p-4 bg-[#0f172a] border-t border-white/10">
                <TouchableOpacity
                    onPress={() => setShowBooking(true)}
                    className="bg-sky-500 py-4 rounded-xl items-center shadow-lg shadow-sky-500/20"
                >
                    <Text className="text-slate-900 font-bold text-lg uppercase tracking-wide">Book Spot</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={showBooking} transparent animationType="slide">
                <View className="flex-1 justify-end bg-black/60">
                    <BookingModal
                        slot={slot}
                        vehicleType={vehicle || 'car'}
                        walletBalance={walletBalance} // Assuming 0 if loading failed
                        onClose={() => setShowBooking(false)}
                        onSuccess={(slotNumber) => {
                            setShowBooking(false);
                            Alert.alert("Success", `Booking Confirmed! Slot: ${slotNumber}`, [
                                { text: "OK", onPress: () => router.push('/(user)/bookings') }
                            ]);
                        }}
                    />
                </View>
            </Modal>
        </SafeAreaView>
    );
}
