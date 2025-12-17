import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import ParkingSlotGrid from './ParkingSlotGrid'; // Import the grid

export default function BookingModal({ slot, vehicleType, onClose, onSuccess }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    // Set default start time to next full hour from now
    const [startTime, setStartTime] = useState(() => {
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        return now.toTimeString().slice(0, 5);
    });
    const [endTime, setEndTime] = useState(() => {
        const now = new Date();
        now.setHours(now.getHours() + 2, 0, 0, 0);
        return now.toTimeString().slice(0, 5);
    });
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [walletBalance, setWalletBalance] = useState(0);
    const [lotDetails, setLotDetails] = useState(null); // Full details including slots
    const [selectedGridSlot, setSelectedGridSlot] = useState(null); // Selected from grid

    useEffect(() => {
        fetchBalance();
        fetchLotDetails();
    }, []);

    const fetchBalance = async () => {
        try {
            const res = await api.get('/user/wallet/balance');
            setWalletBalance(res.tokens);
        } catch (error) {
            console.error("Failed to fetch balance", error);
        }
    };

    const fetchLotDetails = async () => {
        try {
            // Fetch fresh details with slots
            const res = await api.get(`/user/slots/${slot.id}`);
            setLotDetails(res.slot);
        } catch (error) {
            console.error("Failed to fetch lot details", error);
        }
    };

    // Calculate duration and total price
    const { duration, total, appliedRate } = useMemo(() => {
        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return { duration: "0.0", total: 0, appliedRate: '' };
        }

        let diffMs = end - start;
        if (diffMs < 0) diffMs = 0;

        const diffHrs = diffMs / (1000 * 60 * 60);

        const pricing = slot.pricing || {};
        const hourly = Number(pricing.hourly) || 0;
        const daily = Number(pricing.daily) || 0;

        let finalTotal = 0;
        let rateLabel = 'Hourly';

        if (daily > 0 && (diffHrs >= 24 || (diffHrs * hourly > daily))) {
            const days = Math.ceil(diffHrs / 24);
            finalTotal = days * daily;
            rateLabel = `Daily (x${days})`;
        } else {
            finalTotal = diffHrs * hourly;
            rateLabel = 'Hourly';
        }

        return {
            duration: diffHrs.toFixed(1),
            total: Math.ceil(finalTotal), // Round up for tokens
            appliedRate: rateLabel
        };
    }, [date, startTime, endTime, slot.pricing]);

    const isInsufficientFunds = walletBalance < total;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const start = new Date(`${date}T${startTime}`);
            const end = new Date(`${date}T${endTime}`);

            if (start >= end) {
                setError("End time must be after start time");
                setLoading(false);
                return;
            }

            if (start < new Date()) {
                setError("Booking cannot be in the past.");
                setLoading(false);
                return;
            }

            if (isInsufficientFunds) {
                setError("Insufficient tokens. Please top up your wallet.");
                setLoading(false);
                return;
            }

            // Require slot selection if slots exist in blueprint
            if (lotDetails?.slots?.length > 0 && !selectedGridSlot) {
                setError("Please select a parking slot from the map.");
                setLoading(false);
                return;
            }

            const response = await api.post('/user/bookings', {
                lotId: slot.id,
                vehicleType: vehicleType,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                amount: Number(total),
                slotId: selectedGridSlot?.id // Pass selected slot ID
            });

            onSuccess(response.slotNumber);
            onClose();

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-brandIndigo rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative border border-white/10 flex flex-col md:flex-row max-h-[90vh]">

                {/* Left: Map Section (New) */}
                <div className="flex-1 bg-brandNight p-6 border-r border-white/10 min-h-[400px] overflow-hidden flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span>🅿️</span> Select Your Spot
                    </h3>
                    {lotDetails?.slots && lotDetails.slots.length > 0 ? (
                        <div className="flex-1 overflow-auto bg-[#0f172a] rounded-xl border border-white/5 relative w-full p-4">
                            {/* Pass data to grid */}
                            <ParkingSlotGrid
                                slots={lotDetails.slots.map(s => ({
                                    ...s,
                                    type: s.type || 'CAR' // Fallback
                                }))}
                                bookings={[]} // We rely on 'is_available' flag for now or fetch bookings if needed for overlap
                                selectedSlot={selectedGridSlot}
                                onSelectSlot={setSelectedGridSlot}
                                userVehicleType={vehicleType}
                                queryStartTime={`${date}T${startTime}`}
                                queryEndTime={`${date}T${endTime}`}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <p>No visual map available for this lot. <br /> A slot will be assigned automatically.</p>
                        </div>
                    )}

                    <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-sm"></span> Available</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-brandSky rounded-sm"></span> Selected</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500/50 rounded-sm"></span> Occupied</span>
                        </div>
                        {selectedGridSlot && <span className="text-brandSky font-bold">Selected: {selectedGridSlot.label}</span>}
                    </div>
                </div>

                {/* Right: Booking Form */}
                <div className="w-full md:w-[400px] overflow-y-auto">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="p-6 space-y-6">
                        <h2 className="text-xl font-bold text-white">Complete Your Booking</h2>

                        {/* Slot Info */}
                        <div className="flex gap-4 bg-brandNight p-3 rounded-2xl">
                            <div className="w-16 h-16 bg-white/5 rounded-xl flex-shrink-0 overflow-hidden">
                                {slot.images && slot.images.length > 0 ? (
                                    <img
                                        src={slot.images[0].startsWith('http') || slot.images[0].startsWith('data:') ? slot.images[0] : `${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}${slot.images[0]}`}
                                        alt={slot.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <img
                                        src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=200&auto=format&fit=crop"
                                        alt="Parking Spot"
                                        className="w-full h-full object-cover opacity-80"
                                    />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">{slot.name}</h3>
                                <p className="text-sm text-gray-400">{slot.address}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Date & Time */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-white">Select Date & Time</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full bg-brandNight border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-brandSky focus:outline-none [color-scheme:dark]"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="time"
                                            value={startTime}
                                            min={date === new Date().toISOString().split('T')[0] ? new Date().toTimeString().slice(0, 5) : undefined}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full bg-brandNight border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-brandSky focus:outline-none [color-scheme:dark]"
                                            required
                                        />
                                        <input
                                            type="time"
                                            value={endTime}
                                            min={startTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full bg-brandNight border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-brandSky focus:outline-none [color-scheme:dark]"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Info */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-white">Vehicle Information</h4>
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1 block">License Plate Number</label>
                                    <input
                                        type="text"
                                        placeholder="ABC-1234"
                                        value={vehicleNumber}
                                        onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                                        className="w-full bg-brandNight border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-brandSky focus:outline-none placeholder-gray-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Price Summary */}
                            <div className="space-y-3 pt-4 border-t border-white/10">
                                <h4 className="text-sm font-medium text-white">Payment Summary</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Wallet Balance</span>
                                    <span className="text-brandUnicorn font-semibold">🪙 {walletBalance}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Duration</span>
                                    <span className="text-white">{duration} hours</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2">
                                    <span className="text-white">Total Cost</span>
                                    <span className={isInsufficientFunds ? "text-red-400" : "text-brandIris"}>
                                        🪙 {total}
                                    </span>
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-rose-500 font-medium bg-rose-50 p-3 rounded-xl">{error}</p>
                            )}

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full bg-transparent border border-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || isInsufficientFunds}
                                    className={`w-full font-semibold py-3 rounded-xl transition-all disabled:opacity-60 ${isInsufficientFunds
                                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                        : 'bg-brandSky text-brandNight hover:bg-brandSky/90'
                                        }`}
                                >
                                    {loading ? 'Processing...' : isInsufficientFunds ? 'Insufficient Tokens' : `Pay 🪙${total}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div >
        </div >
    );
}
