import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

export default function AdminProfileScreen() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
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
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert("Sign Out", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: signOut }
        ]);
    };

    if (loading) return <View className="flex-1 bg-[#0f172a] justify-center items-center"><ActivityIndicator size="large" color="#3b82f6" /></View>;

    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]" edges={['top']}>
            <ScrollView className="flex-1 px-6">
                <View className="py-4 flex-row justify-between items-center">
                    <Text className="text-2xl font-bold text-white">Admin Profile</Text>
                    <TouchableOpacity onPress={handleSignOut}>
                        <Ionicons name="log-out-outline" size={24} color="#f87171" />
                    </TouchableOpacity>
                </View>

                <View className="bg-slate-800 rounded-3xl p-6 border border-white/5 mb-6 flex-row items-center gap-4">
                    <View className="w-20 h-20 rounded-full bg-slate-700 items-center justify-center border border-white/10">
                        <Ionicons name="person-circle" size={40} color="#94a3b8" />
                    </View>
                    <View>
                        <Text className="text-xl font-bold text-white">{profile?.full_name}</Text>
                        <Text className="text-slate-400 text-sm">{profile?.email}</Text>
                        <Text className="text-sky-400 text-xs font-bold mt-1 uppercase tracking-wide">Administrator</Text>
                    </View>
                </View>

                <View className="bg-slate-800 rounded-3xl p-6 border border-white/5 space-y-4">
                    <View>
                        <Text className="text-slate-400 text-xs font-bold uppercase mb-1">Full Name</Text>
                        <TextInput value={profile?.full_name} editable={false} className="bg-slate-900 text-white p-3 rounded-xl border border-white/5 opacity-70" />
                    </View>
                    <View>
                        <Text className="text-slate-400 text-xs font-bold uppercase mb-1">Email</Text>
                        <TextInput value={profile?.email} editable={false} className="bg-slate-900 text-white p-3 rounded-xl border border-white/5 opacity-70" />
                    </View>
                    {/* Admin specific fields if any, e.g. UPI ID */}
                    <View>
                        <Text className="text-slate-400 text-xs font-bold uppercase mb-1">Role</Text>
                        <TextInput value={profile?.role} editable={false} className="bg-slate-900 text-white p-3 rounded-xl border border-white/5 opacity-70 uppercase" />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
