import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Slot {
    id: string;
    x: number;
    y: number;
    type: string;
    label: string;
    is_available: boolean;
    rotation?: number;
    status?: string; // 'AVAILABLE', 'BOOKED', 'SELECTED'
}

interface ParkingSlotGridProps {
    slots: Slot[];
    selectedSlotId?: string;
    onSelectSlot: (slot: Slot) => void;
    userVehicleType: string;
}

const CELL_SIZE = 60;
const GAP = 10;

const VehicleIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'CAR': return <Text style={{ fontSize: 24 }}>🚗</Text>;
        case 'BIKE': return <Text style={{ fontSize: 24 }}>🏍️</Text>;
        case 'EV_CAR': return <Text style={{ fontSize: 24 }}>🚙⚡</Text>;
        case 'EV_BIKE': return <Text style={{ fontSize: 24 }}>🛵⚡</Text>;
        case 'TRUCK': return <Text style={{ fontSize: 24 }}>🚛</Text>;
        case 'BUS': return <Text style={{ fontSize: 24 }}>🚌</Text>;
        case 'WALL': return <View style={styles.wall} />;
        case 'ROAD': return <View style={styles.road} />;
        case 'ENTRY': return <Text style={{ fontSize: 20 }}>➡️</Text>;
        case 'EXIT': return <Text style={{ fontSize: 20 }}>⬅️</Text>;
        default: return null;
    }
};

export default function ParkingSlotGrid({ slots, selectedSlotId, onSelectSlot, userVehicleType }: ParkingSlotGridProps) {
    if (!slots || slots.length === 0) {
        return (
            <View className="h-64 justify-center items-center bg-slate-900 rounded-xl border border-white/10">
                <Text className="text-slate-500">No layout available</Text>
            </View>
        );
    }

    // Calculate grid dimensions
    const maxX = Math.max(...slots.map(s => s.x)) + 1;
    const maxY = Math.max(...slots.map(s => s.y)) + 1;

    const width = maxX * (CELL_SIZE + GAP);
    const height = maxY * (CELL_SIZE + GAP);

    const getSlotStyle = (slot: Slot) => {
        const isSelected = slot.id === selectedSlotId;
        const isBooked = !slot.is_available;
        const isRestricted = slot.type !== 'WALL' && slot.type !== 'ROAD' && slot.type !== 'ENTRY' && slot.type !== 'EXIT' && slot.type !== userVehicleType.toUpperCase();

        let baseStyle = {
            width: CELL_SIZE,
            height: CELL_SIZE,
            transform: [{ rotate: `${slot.rotation || 0}deg` }],
            left: slot.x * (CELL_SIZE + GAP),
            top: slot.y * (CELL_SIZE + GAP),
            position: 'absolute' as 'absolute',
            justifyContent: 'center' as 'center',
            alignItems: 'center' as 'center',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(255,255,255,0.05)',
        };

        if (slot.type === 'WALL') {
            baseStyle.backgroundColor = '#374151';
            baseStyle.borderColor = '#4b5563';
        } else if (slot.type === 'ROAD') {
            baseStyle.backgroundColor = 'transparent';
            baseStyle.borderColor = 'transparent';
        } else if (isBooked) {
            baseStyle.backgroundColor = 'rgba(239, 68, 68, 0.2)'; // Red-500/20
            baseStyle.borderColor = 'rgba(239, 68, 68, 0.5)';
        } else if (isSelected) {
            baseStyle.backgroundColor = '#0ea5e9'; // Sky-500
            baseStyle.borderColor = '#ffffff';
        } else if (isRestricted) {
            baseStyle.opacity = 0.5;
        } else {
            // Available
            baseStyle.backgroundColor = 'rgba(34, 197, 94, 0.1)'; // Green-500/10
            baseStyle.borderColor = 'rgba(34, 197, 94, 0.3)';
        }

        return baseStyle;
    };

    return (
        <ScrollView horizontal className="flex-1">
            <ScrollView className="flex-1">
                <View style={{ width, height, position: 'relative', margin: 20 }}>
                    {slots.map((slot, index) => (
                        <TouchableOpacity
                            key={slot.id ? `${slot.id}-${index}` : `${slot.x}-${slot.y}-${index}`}
                            style={getSlotStyle(slot)}
                            onPress={() => {
                                if (slot.is_available &&
                                    slot.type !== 'WALL' &&
                                    slot.type !== 'ROAD' &&
                                    slot.type === userVehicleType.toUpperCase()) {
                                    onSelectSlot(slot);
                                }
                            }}
                            disabled={!slot.is_available || slot.type === 'WALL' || slot.type === 'ROAD' || slot.type !== userVehicleType.toUpperCase()}
                        >
                            <VehicleIcon type={slot.type} />
                            {slot.type !== 'WALL' && slot.type !== 'ROAD' && (
                                <Text className={`text-[10px] font-bold absolute bottom-1 right-1 ${selectedSlotId === slot.id ? 'text-white' : 'text-slate-400'}`}>
                                    {slot.label}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    wall: {
        width: '100%',
        height: '100%',
        backgroundColor: '#374151',
    },
    road: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    }
});
