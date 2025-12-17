import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';
import { API_BASE_URL } from '../src/constants/Config';

interface ParkingCardProps {
    slot: any;
    onPress: () => void;
}

export default function ParkingCard({ slot, onPress }: ParkingCardProps) {
    // Parsing logic from frontend/src/components/ParkingCard.jsx
    const images = slot.images || [];
    const imageUrlResolved = (images.length > 0 && typeof images[0] === 'string')
        ? images[0]
        : 'https://placehold.co/600x400/png?text=Parking';
    const imageUrl = (imageUrlResolved.startsWith('http') || imageUrlResolved.startsWith('data:'))
        ? imageUrlResolved
        : `${API_BASE_URL}${imageUrlResolved}`;

    const hourlyPrice = slot.pricing?.hourly || '--';
    const available = parseInt(slot.availableSlots || '0');
    const isFull = available === 0;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            className="bg-slate-800 rounded-2xl overflow-hidden mb-4 border border-white/5"
        >
            <View className="h-40 relative">
                <Image
                    source={{ uri: imageUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                />
                <View className="absolute top-3 right-3 bg-black/60 px-2 py-1 rounded-lg flex-row items-center">
                    <Ionicons name="star" size={14} color="#fbbf24" />
                    <Text className="text-white text-xs font-bold ml-1">{slot.rating || '4.5'}</Text>
                </View>
                {slot.hasEv && (
                    <View className="absolute top-3 left-3 bg-green-500/90 px-2 py-1 rounded-lg">
                        <Text className="text-white text-xs font-bold">EV Support</Text>
                    </View>
                )}
            </View>

            <View className="p-4">
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-2">
                        <Text className="text-white font-bold text-lg" numberOfLines={1}>{slot.name}</Text>
                        <Text className="text-slate-400 text-sm" numberOfLines={1}>{slot.address}</Text>
                    </View>
                    <View className="bg-slate-700 px-3 py-1 rounded-lg">
                        <Text className="text-sky-400 font-bold">₹{hourlyPrice}<Text className="text-slate-400 text-xs">/hr</Text></Text>
                    </View>
                </View>

                <View className="flex-row justify-between items-center pt-3 border-t border-white/5">
                    <View>
                        <Text className={clsx("font-bold", isFull ? "text-red-500" : "text-emerald-500")}>
                            {isFull ? "Full" : `${available} spots left`}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={onPress}
                        className="bg-sky-500 px-4 py-2 rounded-lg"
                    >
                        <Text className="text-slate-900 font-bold text-xs uppercase">Book Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}
