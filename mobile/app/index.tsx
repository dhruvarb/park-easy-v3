import { View, Text, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const CITIES = [
    "Select City",
    "Hubli",
    "Dharwad",
    "Bangalore",
    "Mumbai",
    "Delhi",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Pune",
    "Ahmedabad",
    "Jaipur",
    "Surat"
];

export default function LandingScreen() {
    const [city, setCity] = useState("Select City");
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);
    const router = useRouter();

    const handleSearch = async () => {
        if (!city || city === "Select City") {
            Alert.alert("Required", "Please select a city");
            return;
        }

        const supportedCities = ["Hubli", "Dharwad"];
        if (supportedCities.includes(city)) {
            await SecureStore.setItemAsync('pe_city', city);
            setShowRoleModal(true);
        } else {
            Alert.alert("Coming Soon", "We are not live in this city yet!");
        }
    };

    const handleRoleSelect = (role: 'user' | 'admin') => {
        setShowRoleModal(false);
        // Navigate to auth with params
        router.push({ pathname: '/auth', params: { role, city } });
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]">
            <StatusBar style="light" />

            {/* Hero Section */}
            <View className="flex-1 px-6 pt-10 justify-center">
                <View className="mb-8">
                    <View className="flex-row items-center bg-sky-500/10 self-start px-3 py-1 rounded-full border border-sky-500/20 mb-6">
                        <View className="w-2 h-2 rounded-full bg-sky-500 mr-2" />
                        <Text className="text-sky-500 text-xs font-bold uppercase tracking-wider">Smart Parking Solution</Text>
                    </View>
                    <Text className="text-5xl font-bold text-white leading-tight">
                        Lets find a
                    </Text>
                    <Text className="text-5xl font-bold text-sky-400 leading-tight mb-4">
                        parking space for you
                    </Text>
                    <Text className="text-slate-400 text-lg leading-6">
                        Seamless parking experience. Book spots, manage earnings, and navigate with ease.
                    </Text>
                </View>

                {/* Search Box */}
                <View className="bg-slate-800/50 border border-white/5 rounded-2xl p-4 gap-4">
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setShowCityModal(true)}
                        className="bg-slate-900 h-14 rounded-xl flex-row items-center px-4 border border-slate-700"
                    >
                        <Ionicons name="location-outline" size={20} color="#94a3b8" />
                        <Text className="flex-1 ml-3 text-white font-medium">
                            {city}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSearch}
                        className="bg-sky-500 h-14 rounded-xl items-center justify-center shadow-lg shadow-sky-500/20"
                    >
                        <Text className="text-slate-900 font-bold text-lg">Search</Text>
                    </TouchableOpacity>
                </View>

                {/* Trust Badges */}
                <View className="flex-row gap-6 mt-12 opacity-70">
                    <View className="flex-row items-center gap-2">
                        <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                        <Text className="text-slate-300 font-medium">Verified Spots</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
                        <Text className="text-slate-300 font-medium">Secure Payments</Text>
                    </View>
                </View>
            </View>

            {/* Role Selection Modal */}
            <Modal visible={showRoleModal} transparent animationType="fade">
                <View className="flex-1 justify-center items-center bg-black/60 px-4">
                    <View className="bg-[#1E293B] w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl">
                        <Text className="text-2xl font-bold text-white text-center mb-6">Continue as</Text>

                        <View className="flex-row gap-4 mb-4">
                            <TouchableOpacity
                                onPress={() => handleRoleSelect('user')}
                                className="flex-1 bg-white/5 p-4 rounded-2xl items-center border border-white/10"
                            >
                                <View className="w-12 h-12 rounded-full bg-blue-500/20 items-center justify-center mb-3">
                                    <Ionicons name="person" size={24} color="#60a5fa" />
                                </View>
                                <Text className="text-white font-semibold">User</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleRoleSelect('admin')}
                                className="flex-1 bg-white/5 p-4 rounded-2xl items-center border border-white/10"
                            >
                                <View className="w-12 h-12 rounded-full bg-indigo-500/20 items-center justify-center mb-3">
                                    <Ionicons name="business" size={24} color="#818cf8" />
                                </View>
                                <Text className="text-white font-semibold">Admin</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => setShowRoleModal(false)} className="items-center p-2">
                            <Text className="text-slate-400">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* City Selection Modal */}
            <Modal visible={showCityModal} transparent animationType="slide">
                <View className="flex-1 justify-end">
                    <View className="bg-[#1E293B] rounded-t-3xl border-t border-white/10 max-h-[50%] p-4">
                        <View className="flex-row justify-between items-center mb-4 px-2">
                            <Text className="text-white font-bold text-xl">Select City</Text>
                            <TouchableOpacity onPress={() => setShowCityModal(false)}>
                                <Ionicons name="close-circle" size={28} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <View>
                            {CITIES.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    onPress={() => {
                                        setCity(c);
                                        setShowCityModal(false);
                                    }}
                                    className={`p-4 border-b border-white/5 ${city === c ? 'bg-sky-500/10' : ''}`}
                                >
                                    <Text className={`text-lg ${city === c ? 'text-sky-400 font-bold' : 'text-slate-300'}`}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}
