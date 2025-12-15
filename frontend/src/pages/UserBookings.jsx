import { useState, useEffect } from "react";
import UserHeader from "../components/UserHeader";
import { userApi } from "../services/api";

export default function UserBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Active");
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [refundReason, setRefundReason] = useState("");
    const [submittingRefund, setSubmittingRefund] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const response = await userApi.getBookings();
            setBookings(response.bookings);
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefundClick = (booking) => {
        setSelectedBooking(booking);
        setRefundReason("");
        setShowRefundModal(true);
    };

    const submitRefund = async () => {
        if (!selectedBooking || !refundReason) return;
        setSubmittingRefund(true);
        try {
            await userApi.requestRefund({
                bookingId: selectedBooking.id,
                reason: refundReason
            });
            alert("Refund request submitted successfully!");
            setShowRefundModal(false);
            fetchBookings(); // Refresh to show status
        } catch (error) {
            console.error("Refund request failed", error);
            alert(error.response?.data?.message || "Failed to submit refund request");
        } finally {
            setSubmittingRefund(false);
        }
    };

    const handleNavigate = (booking) => {
        if (booking.latitude && booking.longitude) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${booking.latitude},${booking.longitude}`, '_blank');
        } else if (booking.address) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.address)}`, '_blank');
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm("Are you sure you want to cancel? \n\nPolicy: \n> 30 mins before: Full Refund (Tokens). \n< 30 mins: No Refund.")) return;
        try {
            const res = await userApi.cancelBooking(bookingId);
            alert(res.message);
            if (res.refund > 0) alert(`Refunded ${res.refund} tokens.`);
            fetchBookings();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Failed to cancel booking.");
        }
    };

    const handleCheckout = async (bookingId) => {
        if (!window.confirm("Confirm Check Out? Any overdue usage will incur penalty (10 Tokens/hr).")) return;
        try {
            const res = await userApi.checkoutBooking(bookingId);
            alert(res.message);
            if (res.penalty > 0) alert(`Penalty Charged: ${res.penalty} tokens.`);
            fetchBookings();
        } catch (error) {
            console.error(error);
            alert("Failed to check out.");
        }
    };

    const filteredBookings = bookings.filter((booking) => {
        const now = new Date();
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);

        if (activeTab === "Active") {
            return start <= now && end >= now;
        } else if (activeTab === "Upcoming") {
            return start > now;
        } else {
            return end < now;
        }
    });

    const getCounts = () => {
        const now = new Date();
        let active = 0, upcoming = 0, past = 0;

        bookings.forEach((booking) => {
            const start = new Date(booking.start_time);
            const end = new Date(booking.end_time);
            if (start <= now && end >= now) active++;
            else if (start > now) upcoming++;
            else if (end < now) past++;
        });

        return { active, upcoming, past };
    };

    const counts = getCounts();

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

    return (
        <>
            <UserHeader />
            <main className="min-h-screen bg-brandNight pt-20 pb-12 px-6">
                <div className="max-w-4xl mx-auto space-y-8">

                    <div>
                        <h1 className="text-2xl font-bold text-white">My Bookings</h1>
                        <p className="text-gray-400">Manage your parking reservations</p>
                    </div>

                    {/* Tabs */}
                    <div className="bg-brandIndigo p-1 rounded-xl inline-flex border border-white/5">
                        {["Active", "Upcoming", "Past"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                    ? "bg-brandSky text-brandNight shadow-glow"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {tab} ({tab === "Active" ? counts.active : tab === "Upcoming" ? counts.upcoming : counts.past})
                            </button>
                        ))}
                    </div>

                    {/* Bookings List */}
                    <div className="space-y-4">
                        {filteredBookings.length > 0 ? (
                            filteredBookings.map((booking) => (
                                <div key={booking.id} className="bg-brandIndigo rounded-2xl p-6 shadow-lg border border-white/5 flex flex-col md:flex-row gap-6">
                                    <div className="flex-grow space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">{booking.lot_name}</h3>
                                                <p className="text-gray-400">{booking.address}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${activeTab === "Active" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                                                    activeTab === "Upcoming" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                                                        "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                                                    }`}>
                                                    {activeTab}
                                                </span>
                                                {booking.refund_status && (
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${booking.refund_status === 'approved' ? 'bg-green-50 text-green-600 border-green-200' :
                                                        booking.refund_status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                                                            'bg-yellow-50 text-yellow-600 border-yellow-200'
                                                        }`}>
                                                        Refund: {booking.refund_status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500 mb-1">Start Time</p>
                                                <p className="font-medium text-white">
                                                    {new Date(booking.start_time).toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">End Time</p>
                                                <p className="font-medium text-white">
                                                    {new Date(booking.end_time).toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Vehicle</p>
                                                <p className="font-medium text-white capitalize">{booking.vehicle_type}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Amount Paid</p>
                                                <p className="font-medium text-white">₹{booking.amount_paid}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col justify-center items-center gap-2 min-w-[120px] border-l border-white/10 pl-6">
                                        <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center text-brandNight text-xs text-center p-2 mb-2 font-bold">
                                            QR Code
                                        </div>
                                        <div className="flex flex-col gap-2 w-full">
                                            {(activeTab === 'Active' || activeTab === 'Upcoming') && (
                                                <button
                                                    onClick={() => handleNavigate(booking)}
                                                    className="w-full py-1.5 rounded-lg bg-brandSky/10 text-brandSky border border-brandSky/20 text-xs font-semibold hover:bg-brandSky/20 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                        <path fillRule="evenodd" d="M9.313 3.13l-4.25 12.75 4.87-1.623.003-.001.002.001 4.87 1.622-4.25-12.75-1.245.001zM7.5 16.5l3.25-10.833L14 16.5l-3.25-1.083-3.25 1.083z" clipRule="evenodd" />
                                                    </svg>
                                                    Navigate
                                                </button>
                                            )}

                                            {/* Cancel Button (Upcoming/Active) */}
                                            {activeTab === 'Upcoming' && (
                                                <button
                                                    onClick={() => handleCancelBooking(booking.id)}
                                                    className="w-full py-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-semibold hover:bg-red-500/20 transition-colors"
                                                >
                                                    Cancel Booking
                                                </button>
                                            )}

                                            {/* Check Out Button (Active) */}
                                            {activeTab === 'Active' && (
                                                <button
                                                    onClick={() => handleCheckout(booking.id)}
                                                    className="w-full py-1.5 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 text-xs font-semibold hover:bg-green-500/20 transition-colors"
                                                >
                                                    Check Out
                                                </button>
                                            )}

                                            {!booking.refund_status && activeTab === 'Past' && (
                                                <button
                                                    onClick={() => handleRefundClick(booking)}
                                                    className="text-xs text-red-400 hover:text-red-300 font-medium underline"
                                                >
                                                    Request Refund
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-white">No {activeTab.toLowerCase()} bookings</h3>
                                <p className="text-gray-500 mt-1">You don't have any {activeTab.toLowerCase()} bookings at the moment.</p>
                            </div>
                        )}
                    </div>

                </div>
            </main>

            {/* Refund Modal */}
            {showRefundModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-brandIndigo rounded-2xl w-full max-w-md p-6 shadow-xl border border-white/10">
                        <h2 className="text-xl font-bold text-white mb-4">Request Refund</h2>
                        <p className="text-sm text-gray-400 mb-4">
                            Please select a reason for your refund request. Note that refunds are subject to approval and cancellation fees may apply.
                        </p>

                        <div className="space-y-3 mb-6">
                            <label className="flex items-center gap-3 p-3 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                                <input
                                    type="radio"
                                    name="reason"
                                    value="Did not check in"
                                    checked={refundReason === "Did not check in"}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    className="text-brandSky focus:ring-brandSky bg-brandNight border-white/20"
                                />
                                <span className="text-gray-300">Did not check in</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                                <input
                                    type="radio"
                                    name="reason"
                                    value="Left early"
                                    checked={refundReason === "Left early"}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    className="text-brandSky focus:ring-brandSky bg-brandNight border-white/20"
                                />
                                <span className="text-gray-300">Left early</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                                <input
                                    type="radio"
                                    name="reason"
                                    value="Other"
                                    checked={refundReason === "Other"}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    className="text-brandSky focus:ring-brandSky bg-brandNight border-white/20"
                                />
                                <span className="text-gray-300">Other</span>
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRefundModal(false)}
                                className="flex-1 py-2.5 border border-white/10 rounded-xl text-gray-300 font-medium hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRefund}
                                disabled={!refundReason || submittingRefund}
                                className="flex-1 py-2.5 bg-brandSky text-brandNight rounded-xl font-bold hover:bg-brandSky/90 disabled:opacity-50 transition-colors shadow-lg shadow-brandSky/20"
                            >
                                {submittingRefund ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
