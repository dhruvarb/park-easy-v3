import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';

export default function BookingModal({ slot, vehicleType, onClose, onSuccess }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [paymentDetails, setPaymentDetails] = useState(null);

    // Calculate duration and total price
    const { duration, total, appliedRate } = useMemo(() => {
        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return { duration: "0.0", total: "0.00", appliedRate: '' };
        }

        let diffMs = end - start;
        if (diffMs < 0) diffMs = 0;

        const diffHrs = diffMs / (1000 * 60 * 60);

        const pricing = slot.pricing || {};
        const hourly = Number(pricing.hourly) || 0;
        const daily = Number(pricing.daily) || 0;

        let finalTotal = 0;
        let rateLabel = 'Hourly';

        // Logic: Use daily rate if duration > 24h OR if hourly total exceeds daily rate
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
            total: finalTotal.toFixed(2),
            appliedRate: rateLabel
        };
    }, [date, startTime, endTime, slot.pricing]);

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

            const response = await api.post('/user/bookings', {
                lotId: slot.id,
                vehicleType: vehicleType,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                amount: Number(total)
            });

            if (response.payment && response.payment.upiId) {
                setPaymentDetails(response.payment);
            } else {
                onSuccess();
                onClose();
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentDone = () => {
        // Redirect to Google Maps
        if (slot.latitude && slot.longitude) {
            const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${slot.latitude},${slot.longitude}`;
            window.open(mapUrl, '_blank');
        } else if (slot.address) {
            // Fallback to address
            const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(slot.address)}`;
            window.open(mapUrl, '_blank');
        }

        onSuccess();
        onClose();
    };

    if (paymentDetails) {
        if (!paymentDetails.upiId) {
            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-brandIndigo rounded-3xl w-full max-w-md p-8 text-center space-y-4 border border-white/10">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white">Payment Setup Incomplete</h2>
                        <p className="text-gray-400">The parking lot owner has not set up their payment details yet. Please contact support or try again later.</p>
                        <button onClick={onClose} className="w-full bg-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/20 transition-all">
                            Close
                        </button>
                    </div>
                </div>
            );
        }

        const upiUrl = `upi://pay?pa=${paymentDetails.upiId}&am=${paymentDetails.amount}&cu=INR`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="bg-brandIndigo rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative p-8 text-center space-y-6 border border-white/10">
                    <h2 className="text-2xl font-bold text-white">Scan to Pay</h2>
                    <p className="text-gray-400">
                        Please scan the QR code using any UPI app to complete the payment of <span className="font-bold text-white">₹{paymentDetails.amount}</span>.
                    </p>

                    <div className="flex justify-center">
                        <img src={qrCodeUrl} alt="UPI QR Code" className="w-48 h-48 border-4 border-white rounded-xl" />
                    </div>

                    <div className="bg-brandNight p-4 rounded-xl text-sm text-gray-400">
                        <p>UPI ID: <span className="font-mono font-bold text-white">{paymentDetails.upiId}</span></p>
                    </div>

                    <button
                        onClick={handlePaymentDone}
                        className="w-full bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                    >
                        I have made the payment
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-brandIndigo rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative border border-white/10">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
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
                            {/* Placeholder for image if available, or a generic icon */}
                            {slot.images && slot.images.length > 0 ? (
                                <img
                                    src={`${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}${slot.images[0]}`}
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
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full bg-brandNight border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-brandSky focus:outline-none [color-scheme:dark]"
                                        required
                                    />
                                    <input
                                        type="time"
                                        value={endTime}
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
                            <h4 className="text-sm font-medium text-white">Price Summary</h4>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Duration</span>
                                <span className="text-white">{duration} hours</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Rate Applied</span>
                                <span className="text-white">
                                    {appliedRate === 'Hourly'
                                        ? `₹${slot.pricing?.hourly || 0}/hour`
                                        : appliedRate.includes('Daily')
                                            ? `₹${slot.pricing?.daily || 0}/day`
                                            : 'Standard'}
                                </span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2">
                                <span className="text-white">Total</span>
                                <span className="text-brandIris">₹{total}</span>
                            </div>
                        </div>

                        {/* Payment Method (Mock) */}
                        <div className="space-y-3 pt-4 border-t border-white/10">
                            <h4 className="text-sm font-medium text-white">Payment Method</h4>
                            <div className="flex items-center justify-between bg-brandNight border border-white/10 rounded-xl p-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-5 bg-white rounded flex items-center justify-center text-[10px] text-brandNight font-bold">UPI</div>
                                    <div className="text-sm text-gray-300">
                                        Pay via UPI QR Code
                                    </div>
                                </div>
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
                                disabled={loading}
                                className="w-full bg-brandSky text-brandNight font-semibold py-3 rounded-xl hover:bg-brandSky/90 transition-all disabled:opacity-60"
                            >
                                {loading ? 'Processing...' : `Confirm Booking - ₹${total}`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
