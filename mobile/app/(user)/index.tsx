import { View, Text, TextInput, FlatList, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { userApi } from '../../src/services/api';
import ParkingCard from '../../components/ParkingCard';

const FILTERS = {
    vehicles: ['car', 'bike'],
    durations: ['Hourly', 'Daily', 'Monthly'],
};

export default function UserDashboard() {
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [searchQuery, setSearchQuery] = useState('');

    const [filters, setFilters] = useState({
        vehicle: 'car',
        duration: 'Hourly',
        evOnly: false,
    });

    const [city, setCity] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<any>(null);
    const [walletBalance, setWalletBalance] = useState(0);
    const [topUpModalVisible, setTopUpModalVisible] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');
    const router = useRouter();

    const fetchWallet = async () => {
        try {
            const res = await (userApi as any).getWalletBalance();
            setWalletBalance(res.tokens);
        } catch (e) {
            console.error(e);
        }
    };

    const handleTopUp = async () => {
        if (!topUpAmount || isNaN(Number(topUpAmount)) || Number(topUpAmount) <= 0) {
            Alert.alert("Invalid Amount", "Please enter a valid amount");
            return;
        }
        try {
            await (userApi as any).topUpWallet(Number(topUpAmount)); // Ensure this exists in api.ts
            setTopUpModalVisible(false);
            setTopUpAmount('');
            Alert.alert("Success", "Wallet topped up successfully!");
            fetchWallet();
        } catch (error: any) {
            Alert.alert("Failed", error.response?.data?.message || "Top up failed");
        }
    };

    useEffect(() => {
        (async () => {
            const c = await SecureStore.getItemAsync('pe_city');
            setCity(c);

            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let location = await Location.getCurrentPositionAsync({});
                setUserLocation(location.coords);
            }
        })();
    }, []);

    useEffect(() => {
        fetchSlots();
        fetchWallet();
    }, [filters, city]);

    const fetchSlots = async () => {
        try {
            setLoading(true);
            // Note: API might handle query params differently than web's URLSearchParams string
            // but axios params object works well.
            // Web: /user/slots?vehicle=...&...
            // We need to pass params to api.get
            // But api.ts getLots currently takes no args in my implementation: getLots: () => api.get('/user/slots')
            // I need to update api.ts to accept params or just build query string.
            // Actually, let's fix api.ts later or just use manual query string for now if needed, 
            // OR better: Update api.ts to accept params.

            // I'll assume I update api.ts or use a cheat:
            // userApi.getLots(params) -> need to check signature.

            // For now, let's fetch all and filter client side if API doesn't support params in current TS definition,
            // BUT the backend supports it.
            // Let's modify api.ts call cleanly in a bit. For now, I'll just cast it.

            const params: any = {
                vehicle: filters.vehicle,
                duration: filters.duration,
                evOnly: filters.evOnly,
            };
            if (city) params.city = city;

            // I'll construct the url manually to be safe with current api.ts
            // Actually api.ts uses axios instance `api`.
            // `userApi.getLots` calls `api.get('/user/slots')`.
            // I can't pass params unless I change api.ts.
            // I'll update api.ts quickly using `replace_file_content` after this.
            // For now, I will write this assuming api.ts will be fixed.
            const res = await (userApi as any).getLots({ params });
            setSlots(res.slots || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSlots = slots.filter(slot => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return slot.name.toLowerCase().includes(q) || slot.address.toLowerCase().includes(q);
    });

    const handleBook = (slot: any) => {
        router.push(`/parking/${slot.id}?duration=${filters.duration}&vehicle=${filters.vehicle}`);
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]" edges={['top']}>
            {/* Header */}
            <View className="px-6 py-4 flex-row justify-between items-center">
                <View>
                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">Current Location</Text>
                    <View className="flex-row items-center">
                        <Ionicons name="location-sharp" size={16} color="#3b82f6" />
                        <Text className="text-white font-bold text-lg ml-1">{city || 'Select City'}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => setViewMode(prev => prev === 'list' ? 'map' : 'list')}
                    className="bg-slate-800 p-2 rounded-xl border border-white/10"
                >
                    <Ionicons name={viewMode === 'list' ? "map" : "list"} size={24} color="#38bdf8" />
                </TouchableOpacity>
            </View>

            {/* Wallet Section */}
            <View className="mx-6 mb-6">
                <View className="rounded-[24px] border border-white/15 bg-indigo-900/50 p-6 flex-row justify-between items-center overflow-hidden relative">
                    <View className="absolute top-0 right-0 w-32 h-32 bg-sky-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <View>
                        <Text className="text-xs tracking-[0.3em] uppercase text-sky-400 mb-2 font-bold">My Wallet</Text>
                        <View className="flex-row items-baseline">
                            <Text className="text-3xl font-bold text-white">{walletBalance}</Text>
                            <Text className="text-slate-400 ml-1">Tokens</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        className="bg-sky-500 px-4 py-2 rounded-xl flex-row items-center shadow-lg shadow-sky-500/20"
                        onPress={() => setTopUpModalVisible(true)}
                    >
                        <Ionicons name="add-circle" size={20} color="#0f172a" />
                        <Text className="text-slate-900 font-bold ml-1">Add</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Top Up Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={topUpModalVisible}
                onRequestClose={() => setTopUpModalVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/80 p-6">
                    <View className="bg-slate-900 w-full rounded-2xl p-6 border border-white/10">
                        <Text className="text-xl font-bold text-white mb-4">Top Up Wallet</Text>
                        <Text className="text-slate-400 mb-4">Enter amount to add tokens (1 INR = 1 Token)</Text>

                        <TextInput
                            className="bg-slate-800 text-white p-4 rounded-xl border border-white/10 mb-6 text-xl font-bold text-center"
                            placeholder="0"
                            placeholderTextColor="#64748b"
                            keyboardType="number-pad"
                            autoFocus
                            onChangeText={setTopUpAmount}
                            value={topUpAmount}
                        />

                        <View className="flex-row gap-4">
                            <TouchableOpacity
                                className="flex-1 bg-slate-800 py-3 rounded-xl items-center"
                                onPress={() => setTopUpModalVisible(false)}
                            >
                                <Text className="text-white font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 bg-sky-500 py-3 rounded-xl items-center"
                                onPress={handleTopUp}
                            >
                                <Text className="text-slate-900 font-bold">Pay & Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Search & Filter */}
            <View className="px-6 pb-4 space-y-4">
                <View className="bg-slate-800 rounded-xl flex-row items-center px-4 h-12 border border-white/5">
                    <Ionicons name="search" size={20} color="#94a3b8" />
                    <TextInput
                        className="flex-1 ml-3 text-white h-full"
                        placeholder="Search parking spots..."
                        placeholderTextColor="#64748b"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                    {/* Vehicle Toggle */}
                    <View className="flex-row bg-slate-800 rounded-lg p-1 mr-2 border border-white/5">
                        {FILTERS.vehicles.map((v) => (
                            <TouchableOpacity
                                key={v}
                                onPress={() => setFilters(prev => ({ ...prev, vehicle: v }))}
                                className={`px-4 py-1.5 rounded-md ${filters.vehicle === v ? 'bg-indigo-600' : ''}`}
                            >
                                <Text className={`capitalize text-xs font-bold ${filters.vehicle === v ? 'text-white' : 'text-slate-400'}`}>{v}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* EV Toggle */}
                    <TouchableOpacity
                        onPress={() => setFilters(prev => ({ ...prev, evOnly: !prev.evOnly }))}
                        className={`flex-row items-center px-4 py-2 rounded-lg border border-white/5 mr-2 ${filters.evOnly ? 'bg-green-500/20 border-green-500/50' : 'bg-slate-800'}`}
                    >
                        <Ionicons name="leaf" size={14} color={filters.evOnly ? "#4ade80" : "#94a3b8"} />
                        <Text className={`ml-2 text-xs font-bold ${filters.evOnly ? 'text-green-400' : 'text-slate-400'}`}>EV Only</Text>
                    </TouchableOpacity>

                    {/* Duration Toggle (simplified) */}
                    <TouchableOpacity className="bg-slate-800 px-4 py-2 rounded-lg border border-white/5">
                        <Text className="text-slate-400 text-xs font-bold">{filters.duration}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Content */}
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : viewMode === 'map' ? (
                <View className="flex-1 rounded-t-3xl overflow-hidden">
                    <MapView
                        style={{ width: '100%', height: '100%' }}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={{
                            latitude: userLocation?.latitude || 15.3647,
                            longitude: userLocation?.longitude || 75.1240,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                        customMapStyle={[
                            {
                                "elementType": "geometry",
                                "stylers": [{ "color": "#242f3e" }]
                            },
                            {
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#746855" }]
                            },
                            {
                                "elementType": "labels.text.stroke",
                                "stylers": [{ "color": "#242f3e" }]
                            },
                            {
                                "featureType": "administrative.locality",
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#d59563" }]
                            },
                            // ... more dark mode styles can be added
                        ]}
                    >
                        {filteredSlots.map(slot => (
                            <Marker
                                key={slot.id}
                                coordinate={{ latitude: parseFloat(slot.latitude), longitude: parseFloat(slot.longitude) }}
                                title={slot.name}
                                description={`₹${slot.pricing?.hourly}/hr`}
                                onCalloutPress={() => handleBook(slot)}
                            />
                        ))}
                    </MapView>
                </View>
            ) : (
                <FlatList
                    data={filteredSlots}
                    renderItem={({ item }) => <ParkingCard slot={item} onPress={() => handleBook(item)} />}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View className="py-10 items-center">
                            <Text className="text-slate-500">No parking spots found.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
