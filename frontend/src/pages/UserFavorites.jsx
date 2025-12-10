import { useState, useEffect } from "react";
import UserHeader from "../components/UserHeader";
import ParkingCard from "../components/ParkingCard";
import BookingModal from "../components/BookingModal";
import api from "../services/api";

export default function UserFavorites() {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState(null);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            const response = await api.get("/user/favorites");
            setFavorites(response.favorites);
        } catch (error) {
            console.error("Failed to fetch favorites", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFavorite = async (slot) => {
        // Since this is the favorites page, toggling means removing
        try {
            await api.delete(`/user/favorites/${slot.id}`);
            // Optimistically update UI
            setFavorites(prev => prev.filter(f => f.id !== slot.id));
        } catch (error) {
            console.error("Failed to remove favorite", error);
        }
    };

    const handleBook = (slot) => {
        setSelectedSlot(slot);
    };

    const handleBookingSuccess = () => {
        alert("Booking confirmed successfully!");
    };

    if (loading) return <div className="min-h-screen bg-brandNight flex items-center justify-center text-white">Loading...</div>;

    return (
        <>
            <UserHeader />
            <main className="min-h-screen bg-brandNight pt-20 pb-12 px-6">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">My Favorites</h1>
                        <p className="text-gray-400">Your saved parking spots</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.length > 0 ? (
                            favorites.map((slot) => (
                                <ParkingCard
                                    key={slot.id}
                                    slot={slot}
                                    onBook={handleBook}
                                    isFavorite={true}
                                    onToggleFavorite={handleToggleFavorite}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-white">No favorites yet</h3>
                                <p className="text-gray-400 mt-1">Start exploring and save your favorite parking spots!</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {selectedSlot && (
                <BookingModal
                    slot={selectedSlot}
                    vehicleType="car" // Default or derived
                    onClose={() => setSelectedSlot(null)}
                    onSuccess={handleBookingSuccess}
                />
            )}
        </>
    );
}
