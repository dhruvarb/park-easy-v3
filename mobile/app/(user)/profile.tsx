import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

const TABS = ["Account", "Vehicles", "Payment", "Notifications", "Security"];

export default function ProfileScreen() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Account");
    const { signOut } = useAuth();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await authApi.me();
            setProfile(res.user);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        Alert.alert("Info", "Profile update functionality coming soon!");
    };

    const handleSignOut = () => {
        Alert.alert("Sign Out", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: signOut }
        ]);
    };

    if (loading) {
        return (
            <View className="flex-1 bg-[#0f172a] justify-center items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]" edges={['top']}>
            <ScrollView className="flex-1 px-6">
                <View className="py-4 flex-row justify-between items-center">
                    <Text className="text-2xl font-bold text-white">My Profile</Text>
                    <TouchableOpacity onPress={handleSignOut}>
                        <Ionicons name="log-out-outline" size={24} color="#f87171" />
                    </TouchableOpacity>
                </View>

                {/* Header Card */}
                <View className="bg-slate-800 rounded-3xl p-6 border border-white/5 mb-6 flex-row items-center gap-4">
                    <View className="w-20 h-20 rounded-full bg-slate-700 items-center justify-center overflow-hidden border border-white/10">
                        <Ionicons name="person" size={40} color="#94a3b8" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-xl font-bold text-white">{profile?.full_name}</Text>
                        <Text className="text-slate-400 text-sm">{profile?.email}</Text>
                        <Text className="text-slate-500 text-xs mt-1">
                            Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                </View>

                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 flex-row">
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`px-5 py-2 mr-2 rounded-full border ${activeTab === tab ? 'bg-sky-500 border-sky-500' : 'bg-transparent border-slate-700'}`}
                        >
                            <Text className={`font-semibold ${activeTab === tab ? 'text-slate-900' : 'text-slate-400'}`}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Content */}
                <View className="bg-slate-800 rounded-3xl p-6 border border-white/5 mb-10">
                    <Text className="text-lg font-bold text-white mb-4">Personal Information</Text>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-slate-400 text-xs font-bold uppercase mb-1">Full Name</Text>
                            <TextInput
                                value={profile?.full_name}
                                editable={false}
                                className="bg-slate-900 text-white p-3 rounded-xl border border-white/5 opacity-70"
                            />
                        </View>
                        <View>
                            <Text className="text-slate-400 text-xs font-bold uppercase mb-1">Email</Text>
                            <TextInput
                                value={profile?.email}
                                editable={false}
                                className="bg-slate-900 text-white p-3 rounded-xl border border-white/5 opacity-70"
                            />
                        </View>
                        <View>
                            <Text className="text-slate-400 text-xs font-bold uppercase mb-1">Phone</Text>
                            <TextInput
                                value={profile?.phone || ''}
                                editable={false}
                                placeholder="Not Set"
                                placeholderTextColor="#64748b"
                                className="bg-slate-900 text-white p-3 rounded-xl border border-white/5 opacity-70"
                            />
                        </View>
                        <View>
                            <Text className="text-slate-400 text-xs font-bold uppercase mb-1">Address</Text>
                            <TextInput
                                value={profile?.address || ''}
                                editable={false}
                                placeholder="Not Set"
                                placeholderTextColor="#64748b"
                                className="bg-slate-900 text-white p-3 rounded-xl border border-white/5 opacity-70"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleSave}
                            className="bg-sky-500 py-3 rounded-xl items-center mt-2"
                        >
                            <Text className="text-slate-900 font-bold">Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
