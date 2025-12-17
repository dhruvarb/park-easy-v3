import { View, Text, ScrollView, TextInput, TouchableOpacity, Switch, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { adminApi } from '../../src/services/api';

const VEHICLE_TYPES = [
    { id: 'bike', label: 'Bike', db: 'bike' },
    { id: 'car', label: 'Car', db: 'car' },
    { id: 'suv', label: 'SUV', db: 'suv' },
    { id: 'evCar', label: 'EV Car', db: 'ev_car' },
];

export default function AddLotScreen() {
    const router = useRouter();
    const { editId } = useLocalSearchParams<{ editId: string }>();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<any[]>([]);

    const [form, setForm] = useState({
        name: '',
        address: '',
        description: '',
        latitude: '',
        longitude: '',
        amenities: { covered: false, evCharging: false, cctv: false, access247: false },
    });

    // Track enabled vehicles and their details
    const [vehicleConfig, setVehicleConfig] = useState<any>({});
    // Structure: { car: { enabled: true, capacity: "10", hourly: "50" } }

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setImages(prev => [...prev, ...result.assets]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const getCurrentLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission denied");
            return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        setForm(prev => ({
            ...prev,
            latitude: String(loc.coords.latitude),
            longitude: String(loc.coords.longitude)
        }));
    };

    const toggleVehicle = (id: string) => {
        setVehicleConfig((prev: any) => ({
            ...prev,
            [id]: {
                ...prev[id],
                enabled: !prev[id]?.enabled
            }
        }));
    };

    const updateVehicle = (id: string, field: string, value: string) => {
        setVehicleConfig((prev: any) => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const submit = async () => {
        if (!form.name || !form.address || !form.latitude || !form.longitude) {
            Alert.alert("Missing Fields", "Please fill basic info and location.");
            return;
        }
        if (images.length === 0 && !editId) {
            Alert.alert("Images", "Please add at least one image.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("address", form.address);
            formData.append("description", form.description);
            formData.append("latitude", form.latitude);
            formData.append("longitude", form.longitude);

            // Amenities
            const amList = [];
            if (form.amenities.covered) amList.push("Covered Parking");
            if (form.amenities.evCharging) amList.push("EV Charging");
            if (form.amenities.cctv) amList.push("CCTV / Security");
            if (form.amenities.access247) amList.push("24/7 Access");
            formData.append("amenities", JSON.stringify(amList));

            // Vehicles Logic
            const pricingPayload: any[] = [];
            const capacityBreakdown: any = {};
            let totalCapacity = 0;

            Object.keys(vehicleConfig).forEach(vid => {
                const conf = vehicleConfig[vid];
                if (conf?.enabled) {
                    const vType = VEHICLE_TYPES.find(v => v.id === vid);
                    if (vType) {
                        pricingPayload.push({
                            vehicleType: vType.db,
                            hourly: Number(conf.hourly) || 0,
                            daily: Number(conf.hourly) * 10, // Mock daily logic or add field
                            monthly: Number(conf.hourly) * 200
                        });
                        const cap = Number(conf.capacity) || 0;
                        capacityBreakdown[vType.db] = cap;
                        totalCapacity += cap;
                    }
                }
            });

            if (totalCapacity === 0) {
                Alert.alert("Error", "Please enable at least one vehicle type and set capacity.");
                setLoading(false);
                return;
            }

            formData.append("pricing", JSON.stringify(pricingPayload));
            formData.append("capacityBreakdown", JSON.stringify(capacityBreakdown));
            formData.append("totalCapacity", String(totalCapacity));

            // Determine EV support
            const hasEv = form.amenities.evCharging || vehicleConfig['evCar']?.enabled;
            formData.append("hasEv", String(!!hasEv));

            // Images
            images.forEach((img: any, index) => {
                // If it's a new image (from picker), it has uri.
                // If editing, we need to handle existing images differently or not re-upload if logic allows.
                // For now, assuming new uploads only or simple add.
                if (img.uri) {
                    const filename = img.uri.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image`;
                    formData.append('images', { uri: img.uri, name: filename, type } as any);
                }
            });

            await (adminApi as any).addLot(formData);
            Alert.alert("Success", "Parking Spot Created!");
            router.back();

        } catch (error: any) {
            console.error(error);
            Alert.alert("Error", error.response?.data?.message || "Failed to save");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]" edges={['top']}>
            <View className="px-6 py-4 flex-row items-center border-b border-white/5">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-white">{editId ? 'Edit Spot' : 'Add New Spot'}</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 px-6 pt-4">

                    {/* Basic Info */}
                    <Text className="text-slate-400 font-bold uppercase text-xs mb-3">Basic Info</Text>
                    <TextInput
                        placeholder="Spot Name (e.g. City Center Mall)"
                        placeholderTextColor="#64748b"
                        value={form.name}
                        onChangeText={t => setForm(f => ({ ...f, name: t }))}
                        className="bg-slate-800 text-white p-4 rounded-xl border border-white/5 mb-4"
                    />
                    <TextInput
                        placeholder="Address / Area"
                        placeholderTextColor="#64748b"
                        value={form.address}
                        onChangeText={t => setForm(f => ({ ...f, address: t }))}
                        className="bg-slate-800 text-white p-4 rounded-xl border border-white/5 mb-4"
                    />
                    <View className="flex-row gap-4 mb-6">
                        <View className="flex-1">
                            <TextInput
                                placeholder="Latitude"
                                placeholderTextColor="#64748b"
                                value={form.latitude}
                                onChangeText={t => setForm(f => ({ ...f, latitude: t }))}
                                className="bg-slate-800 text-white p-4 rounded-xl border border-white/5"
                                keyboardType="numeric"
                            />
                        </View>
                        <View className="flex-1">
                            <TextInput
                                placeholder="Longitude"
                                placeholderTextColor="#64748b"
                                value={form.longitude}
                                onChangeText={t => setForm(f => ({ ...f, longitude: t }))}
                                className="bg-slate-800 text-white p-4 rounded-xl border border-white/5"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                    <TouchableOpacity onPress={getCurrentLocation} className="bg-sky-500/10 p-3 rounded-xl border border-sky-500/30 items-center mb-8">
                        <Text className="text-sky-400 font-bold flex-row items-center">
                            <Ionicons name="location" size={16} /> Use Current Location
                        </Text>
                    </TouchableOpacity>

                    {/* Configuration */}
                    <Text className="text-slate-400 font-bold uppercase text-xs mb-3">Configuration</Text>
                    {VEHICLE_TYPES.map(v => (
                        <View key={v.id} className="bg-slate-800 rounded-xl p-4 mb-4 border border-white/5">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-white font-bold">{v.label}</Text>
                                <Switch
                                    value={vehicleConfig[v.id]?.enabled || false}
                                    onValueChange={() => toggleVehicle(v.id)}
                                />
                            </View>
                            {vehicleConfig[v.id]?.enabled && (
                                <View className="flex-row gap-4 mt-2">
                                    <View className="flex-1">
                                        <Text className="text-slate-500 text-xs mb-1">Capacity</Text>
                                        <TextInput
                                            placeholder="10"
                                            placeholderTextColor="#64748b"
                                            keyboardType="numeric"
                                            value={vehicleConfig[v.id]?.capacity || ''}
                                            onChangeText={t => updateVehicle(v.id, 'capacity', t)}
                                            className="bg-slate-900 p-2 rounded-lg text-white border border-white/10"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-500 text-xs mb-1">Price/Hr (₹)</Text>
                                        <TextInput
                                            placeholder="50"
                                            placeholderTextColor="#64748b"
                                            keyboardType="numeric"
                                            value={vehicleConfig[v.id]?.hourly || ''}
                                            onChangeText={t => updateVehicle(v.id, 'hourly', t)}
                                            className="bg-slate-900 p-2 rounded-lg text-white border border-white/10"
                                        />
                                    </View>
                                </View>
                            )}
                        </View>
                    ))}

                    {/* Amenities */}
                    <Text className="text-slate-400 font-bold uppercase text-xs mb-3 mt-4">Amenities</Text>
                    <View className="flex-row flex-wrap gap-3 mb-8">
                        {Object.keys(form.amenities).map(k => (
                            <TouchableOpacity
                                key={k}
                                onPress={() => setForm(f => ({ ...f, amenities: { ...f.amenities, [k]: !f.amenities[k as keyof typeof f.amenities] } }))}
                                className={`px-4 py-2 rounded-lg border ${form.amenities[k as keyof typeof form.amenities] ? 'bg-indigo-500/20 border-indigo-500' : 'bg-slate-800 border-white/10'}`}
                            >
                                <Text className={`capitalize text-xs font-bold ${form.amenities[k as keyof typeof form.amenities] ? 'text-indigo-400' : 'text-slate-400'}`}>
                                    {k.replace(/([A-Z])/g, ' $1').trim()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Images */}
                    <Text className="text-slate-400 font-bold uppercase text-xs mb-3">Photos</Text>
                    <ScrollView horizontal className="mb-8">
                        {images.map((img, idx) => (
                            <View key={idx} className="relative mr-3">
                                <Image source={{ uri: img.uri }} className="w-24 h-24 rounded-lg bg-slate-800" />
                                <TouchableOpacity onPress={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center">
                                    <Ionicons name="close" size={14} color="white" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TouchableOpacity onPress={pickImage} className="w-24 h-24 rounded-lg bg-slate-800 border border-dashed border-white/20 items-center justify-center">
                            <Ionicons name="camera" size={24} color="#94a3b8" />
                            <Text className="text-slate-400 text-xs mt-1">Add Photo</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Submit */}
                    <TouchableOpacity
                        onPress={submit}
                        disabled={loading}
                        className={`py-4 rounded-xl items-center mb-10 ${loading ? 'bg-slate-700' : 'bg-sky-500 shadow-lg shadow-sky-500/20'}`}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-slate-900 font-bold text-lg">Create Parking Spot</Text>}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
