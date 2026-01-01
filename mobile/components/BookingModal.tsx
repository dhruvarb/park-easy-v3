import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { format, addHours, differenceInMinutes, parseISO } from 'date-fns';
import { userApi } from '../src/services/api';
import clsx from 'clsx';
import DateTimePicker from '@react-native-community/datetimepicker';
import ParkingSlotGrid from './ParkingSlotGrid';

interface BookingModalProps {
    slot: any;
    vehicleType: string;
    onClose: () => void;
    onSuccess: (slotNumber: string) => void;
    walletBalance: number;
}

export default function BookingModal({ slot, vehicleType, onClose, onSuccess, walletBalance }: BookingModalProps) {
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [date, setDate] = useState(new Date());
    const [startTime, setStartTime] = useState(addHours(new Date(), 1));
    const [endTime, setEndTime] = useState(addHours(new Date(), 3));
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [loading, setLoading] = useState(false);

    // DateTimePicker visibility states
    const [mode, setMode] = useState<'date' | 'time'>('date');
    const [showPicker, setShowPicker] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<'date' | 'start' | 'end'>('date');

    const pricing = slot.pricing || {};
    const hourly = Number(pricing.hourly) || 0;
    const daily = Number(pricing.daily) || 0;

    // ... (useMemo remains same) ...
    const { total, durationLabel } = useMemo(() => {
        const s = new Date(date);
        s.setHours(startTime.getHours(), startTime.getMinutes());

        const e = new Date(date);
        e.setHours(endTime.getHours(), endTime.getMinutes());

        if (e < s) {
            e.setDate(e.getDate() + 1);
        }

        const diffMins = differenceInMinutes(e, s);
        if (diffMins <= 0) return { total: 0, durationLabel: '0h' };

        const diffHrs = diffMins / 60;

        let finalTotal = 0;
        if (daily > 0 && (diffHrs >= 24 || (diffHrs * hourly > daily))) {
            const days = Math.ceil(diffHrs / 24);
            finalTotal = days * daily;
        } else {
            finalTotal = diffHrs * hourly;
        }

        return {
            total: Math.ceil(finalTotal),
            durationLabel: `${diffHrs.toFixed(1)}h`
        };
    }, [date, startTime, endTime, hourly, daily]);

    const handleBook = async () => {
        if (!vehicleNumber.trim()) {
            Alert.alert("Required", "Please enter vehicle license plate");
            return;
        }
        if (!selectedSlot && slot.slots && slot.slots.length > 0) {
            Alert.alert("Required", "Please select a parking slot");
            return;
        }
        if (total > walletBalance) {
            Alert.alert("Insufficient Funds", "Please add tokens to your wallet");
            return;
        }

        setLoading(true);
        try {
            const s = new Date(date);
            s.setHours(startTime.getHours(), startTime.getMinutes());

            const e = new Date(date);
            e.setHours(endTime.getHours(), endTime.getMinutes());
            if (e < s) e.setDate(e.getDate() + 1);

            const payload = {
                lotId: slot.id,
                vehicleType,
                startTime: s.toISOString(),
                endTime: e.toISOString(),
                amount: total,
                slotId: selectedSlot?.id // Pass selected slot ID
            };

            const res = await (userApi as any).createBooking(payload);
            const bookedSlot = res.slotNumber; // backend returns slotNumber label
            onSuccess(bookedSlot || 'Assigned');
        } catch (error: any) {
            console.error(error);
            Alert.alert("Booking Failed", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    // ... (Date handlers remain same) ...
    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowPicker(Platform.OS === 'ios');

        if (pickerTarget === 'date') setDate(currentDate);
        if (pickerTarget === 'start') setStartTime(currentDate);
        if (pickerTarget === 'end') setEndTime(currentDate);

        if (Platform.OS === 'android') setShowPicker(false);
    };

    const showDatepicker = (target: 'date' | 'start' | 'end') => {
        setPickerTarget(target);
        setMode(target === 'date' ? 'date' : 'time');
        setShowPicker(true);
    };

    return (
        <View className="bg-slate-900 mx-4 rounded-3xl p-6 border border-white/10 max-h-[90%] flex-1 mt-10">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-white">Select Slot & Book</Text>
                <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close-circle" size={28} color="#94a3b8" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>

                {/* Visual Grid */}
                <View className="bg-slate-950 rounded-xl border border-white/10 p-4 mb-6 h-80">
                    <Text className="text-slate-400 mb-2 text-xs uppercase tracking-wider font-bold">Parking Layout</Text>
                    <ParkingSlotGrid
                        slots={slot.slots || []}
                        selectedSlotId={selectedSlot?.id}
                        onSelectSlot={setSelectedSlot}
                        userVehicleType={vehicleType}
                    />
                </View>

                {selectedSlot && (
                    <View className="bg-sky-500/10 border border-sky-500/30 p-3 rounded-lg mb-4 flex-row items-center justify-between">
                        <Text className="text-sky-400 font-bold">Selected Slot: {selectedSlot.label}</Text>
                        <Ionicons name="checkmark-circle" size={20} color="#38bdf8" />
                    </View>
                )}

                {/* Date Selection */}
                <View className="mb-4">
                    <Text className="text-slate-400 mb-2 font-medium">Date</Text>
                    <TouchableOpacity onPress={() => showDatepicker('date')} className="bg-slate-800 p-3 rounded-xl border border-white/5">
                        <Text className="text-white">{format(date, 'PPP')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Time Selection */}
                <View className="flex-row gap-4 mb-4">
                    <View className="flex-1">
                        <Text className="text-slate-400 mb-2 font-medium">Start Time</Text>
                        <TouchableOpacity onPress={() => showDatepicker('start')} className="bg-slate-800 p-3 rounded-xl border border-white/5">
                            <Text className="text-white">{format(startTime, 'p')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-1">
                        <Text className="text-slate-400 mb-2 font-medium">End Time</Text>
                        <TouchableOpacity onPress={() => showDatepicker('end')} className="bg-slate-800 p-3 rounded-xl border border-white/5">
                            <Text className="text-white">{format(endTime, 'p')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {showPicker && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={pickerTarget === 'date' ? date : (pickerTarget === 'start' ? startTime : endTime)}
                        mode={mode}
                        is24Hour={false}
                        display="default"
                        onChange={onChangeDate}
                    />
                )}

                {/* Vehicle */}
                <View className="mb-6">
                    <Text className="text-slate-400 mb-2 font-medium">License Plate</Text>
                    <TextInput
                        className="bg-slate-800 text-white p-3 rounded-xl border border-white/5"
                        placeholder="ABC-1234"
                        placeholderTextColor="#64748b"
                        value={vehicleNumber}
                        onChangeText={t => setVehicleNumber(t.toUpperCase())}
                    />
                </View>

                {/* Summary */}
                <View className="bg-slate-800 p-4 rounded-xl border border-white/5 mb-6">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-slate-400">Rate</Text>
                        <Text className="text-white">₹{hourly}/hr</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-slate-400">Duration</Text>
                        <Text className="text-white">{durationLabel}</Text>
                    </View>
                    <View className="flex-row justify-between pt-2 border-t border-white/5 rounded-none">
                        <Text className="text-white font-bold">Total</Text>
                        <Text className="text-sky-400 font-bold text-lg">₹{total}</Text>
                    </View>
                    {total > walletBalance && (
                        <Text className="text-red-500 text-xs mt-2 text-right">Insufficient balance (₹{walletBalance})</Text>
                    )}
                </View>
            </ScrollView>

            <TouchableOpacity
                onPress={handleBook}
                disabled={loading}
                className={clsx(
                    "w-full py-4 rounded-xl items-center",
                    loading ? "bg-slate-700" : "bg-sky-500"
                )}
            >
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-slate-900 font-bold text-lg">Confirm Booking</Text>}
            </TouchableOpacity>
        </View>
    );
}
