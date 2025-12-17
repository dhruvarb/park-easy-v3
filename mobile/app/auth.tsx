import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';

export default function AuthScreen() {
    const { role = 'user', city } = useLocalSearchParams<{ role: string; city: string }>();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [formValues, setFormValues] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        upiId: '',
    });
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const router = useRouter();

    const updateForm = (key: string, value: string) => {
        setFormValues(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = mode === 'signup'
                ? {
                    fullName: formValues.name,
                    email: formValues.email,
                    password: formValues.password,
                    phone: formValues.phone,
                    upiId: formValues.upiId,
                    role,
                }
                : {
                    email: formValues.email,
                    password: formValues.password,
                };

            const fn = mode === 'signup' ? authApi.signup : authApi.login;
            const response = await fn(payload);

            const { token, user } = response;

            const userRole = (user.role || '').toLowerCase();

            if (role === 'admin' && userRole !== 'admin') {
                throw new Error("Access Denied: You are not an admin account.");
            }
            if (role === 'user' && userRole === 'admin') {
                Alert.alert("Notice", "You are an admin logging into user portal. Redirecting to Admin Dashboard.");
            }

            await signIn(token, user);

            // Navigation is handled by _layout's useEffect, but we can force push to be safe/faster
            if (userRole === 'admin') {
                router.replace('/(admin)');
            } else {
                router.replace('/(user)');
            }

        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || error.message || "Something went wrong";
            Alert.alert("Error", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]">
            <StatusBar style="light" />
            <ScrollView className="flex-1 px-6">
                <View className="mt-10 mb-8">
                    <Text className="text-sky-500 text-xs font-bold uppercase tracking-widest mb-2">
                        {String(role).toUpperCase()} ACCESS
                    </Text>
                    <Text className="text-3xl font-bold text-white mb-2">
                        {role === 'admin' ? 'Admin Portal' : 'User Portal'}
                    </Text>
                    <Text className="text-slate-400">
                        {role === 'admin'
                            ? 'Manage inventory, pricing, and analytics.'
                            : 'Book verified parking spots near you.'}
                    </Text>
                </View>

                <View className="bg-slate-800 p-6 rounded-3xl border border-white/5 space-y-6">
                    {/* Tabs */}
                    <View className="flex-row bg-slate-900/50 p-1 rounded-2xl mb-4">
                        <TouchableOpacity
                            onPress={() => setMode('login')}
                            className={`flex-1 py-3 items-center rounded-xl ${mode === 'login' ? 'bg-indigo-600' : ''}`}
                        >
                            <Text className={`font-semibold ${mode === 'login' ? 'text-white' : 'text-slate-400'}`}>Login</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setMode('signup')}
                            className={`flex-1 py-3 items-center rounded-xl ${mode === 'signup' ? 'bg-indigo-600' : ''}`}
                        >
                            <Text className={`font-semibold ${mode === 'signup' ? 'text-white' : 'text-slate-400'}`}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Fields */}
                    {mode === 'signup' && (
                        <View className="space-y-4">
                            <View>
                                <Text className="text-slate-400 mb-2 font-medium">Full Name</Text>
                                <TextInput
                                    className="bg-slate-900 text-white p-4 rounded-xl border border-slate-700"
                                    placeholder="John Doe"
                                    placeholderTextColor="#64748b"
                                    value={formValues.name}
                                    onChangeText={(t) => updateForm('name', t)}
                                />
                            </View>
                        </View>
                    )}

                    <View>
                        <Text className="text-slate-400 mb-2 font-medium">Email Address</Text>
                        <TextInput
                            className="bg-slate-900 text-white p-4 rounded-xl border border-slate-700"
                            placeholder="john@example.com"
                            placeholderTextColor="#64748b"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={formValues.email}
                            onChangeText={(t) => updateForm('email', t)}
                        />
                    </View>

                    <View>
                        <Text className="text-slate-400 mb-2 font-medium">Password</Text>
                        <TextInput
                            className="bg-slate-900 text-white p-4 rounded-xl border border-slate-700"
                            placeholder="••••••"
                            placeholderTextColor="#64748b"
                            secureTextEntry
                            value={formValues.password}
                            onChangeText={(t) => updateForm('password', t)}
                        />
                    </View>

                    {mode === 'signup' && (
                        <View>
                            <Text className="text-slate-400 mb-2 font-medium">Phone Number</Text>
                            <TextInput
                                className="bg-slate-900 text-white p-4 rounded-xl border border-slate-700"
                                placeholder="+91 98765 43210"
                                placeholderTextColor="#64748b"
                                keyboardType="phone-pad"
                                value={formValues.phone}
                                onChangeText={(t) => updateForm('phone', t)}
                            />
                        </View>
                    )}

                    {mode === 'signup' && role === 'admin' && (
                        <View>
                            <Text className="text-slate-400 mb-2 font-medium">UPI ID</Text>
                            <TextInput
                                className="bg-slate-900 text-white p-4 rounded-xl border border-slate-700"
                                placeholder="merchant@upi"
                                placeholderTextColor="#64748b"
                                value={formValues.upiId}
                                onChangeText={(t) => updateForm('upiId', t)}
                            />
                            <Text className="text-xs text-slate-500 mt-1">For receiving payments</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loading}
                        className={`bg-sky-500 py-4 rounded-xl items-center mt-4 ${loading ? 'opacity-70' : ''}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#0f172a" />
                        ) : (
                            <Text className="text-slate-900 font-bold text-lg">
                                {mode === 'login' ? 'Sign In Securely' : 'Create Account'}
                            </Text>
                        )}
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
