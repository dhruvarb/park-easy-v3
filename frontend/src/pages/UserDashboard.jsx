// src/pages/UserDashboard.jsx
import { useState, useEffect } from "react";
import UserHeader from "../components/UserHeader";
import FilterPanel from "../components/FilterPanel";
import ParkingCard from "../components/ParkingCard";
import MapView from "../components/MapView";
import BookingModal from "../components/BookingModal";
import api from "../services/api";

import TopUpModal from "../components/TopUpModal";

export default function UserDashboard() {
  const [filters, setFilters] = useState({
    vehicle: "car",
    duration: "Hourly",
    evOnly: false,
  });
  const [slots, setSlots] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'map'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showTopUp, setShowTopUp] = useState(false);

  useEffect(() => {
    fetchSlots();
    fetchFavorites();
    fetchBalance();
  }, [filters]);

  const fetchBalance = async () => {
    try {
      const res = await api.get('/user/wallet/balance');
      setWalletBalance(res.tokens);
    } catch (error) {
      console.error("Failed to fetch balance", error);
    }
  };

  const fetchSlots = async () => {
    try {
      const city = localStorage.getItem('pe_city');
      const params = new URLSearchParams({
        vehicle: filters.vehicle,
        duration: filters.duration,
        evOnly: filters.evOnly,
        ...(city && { city }),
      });
      const response = await api.get(`/user/slots?${params}`);
      setSlots(response.slots);
    } catch (error) {
      console.error("Failed to fetch slots", error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await api.get("/user/favorites");
      setFavorites(response.favorites.map(f => f.id));
    } catch (error) {
      console.error("Failed to fetch favorites", error);
    }
  };

  const handleToggleFavorite = async (slot) => {
    try {
      if (favorites.includes(slot.id)) {
        await api.delete(`/user/favorites/${slot.id}`);
        setFavorites(prev => prev.filter(id => id !== slot.id));
      } else {
        await api.post("/user/favorites", { lotId: slot.id });
        setFavorites(prev => [...prev, slot.id]);
      }
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    }
  };

  const handleBook = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBookingSuccess = (slotNumber) => {
    alert(`Booking confirmed successfully! Your allocated Slot Number is: ${slotNumber || 'Assigned'}`);
    fetchSlots(); // Refresh slots to update availability
    fetchBalance(); // Refresh balance after booking
  };

  return (
    <>
      <UserHeader />
      <main className="min-h-screen bg-brandNight pt-20 pb-12 px-6 text-brandSand">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[300px,1fr] gap-10">
          <FilterPanel filters={filters} onChange={setFilters} />
          <section className="space-y-8">

            {/* Wallet Section */}
            <div className="rounded-[32px] border border-white/15 bg-gradient-to-r from-brandIndigo/50 to-brandPurple/50 backdrop-blur-2xl p-8 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brandSky/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              <div className="relative z-10">
                <p className="text-xs tracking-[0.3em] uppercase text-brandSky mb-2">My Wallet</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-4xl font-bold text-white">{walletBalance}</h2>
                  <span className="text-lg text-white/60">Tokens</span>
                </div>
              </div>
              <button
                onClick={() => setShowTopUp(true)}
                className="relative z-10 bg-brandSky text-brandNight font-bold px-6 py-3 rounded-xl hover:bg-brandSky/90 transition-all shadow-lg shadow-brandSky/20 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Add Tokens
              </button>
            </div>

            <header className="rounded-[32px] border border-white/15 bg-white/5 backdrop-blur-2xl p-6 flex flex-wrap gap-6 justify-between items-center">
              <div>
                <p className="text-xs tracking-[0.3em] uppercase text-brandSky">
                  Explorer
                </p>
                <h1 className="text-3xl font-semibold">Nearby parking slots</h1>
                <p className="text-sm text-white/70">
                  Showing {filters.evOnly ? "EV-ready" : "all"} slots for{" "}
                  {filters.vehicle.replace("-", " ")} ({filters.duration})
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
                  className={`px-4 py-3 rounded-2xl border text-sm font-semibold transition-colors ${viewMode === "map"
                    ? "bg-brandSky text-brandNight border-brandSky"
                    : "border-white/20 hover:bg-white/10"
                    }`}
                >
                  {viewMode === "list" ? "Live Map" : "List View"}
                </button>
              </div>
            </header>

            {viewMode === "map" ? (
              <MapView slots={slots} />
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {slots.length > 0 ? (
                  slots.map((slot) => (
                    <ParkingCard
                      key={slot.id}
                      slot={slot}
                      onBook={handleBook}
                      isFavorite={favorites.includes(slot.id)}
                      onToggleFavorite={handleToggleFavorite}
                      filterDuration={filters.duration}
                    />
                  ))
                ) : (
                  <p className="col-span-2 text-center text-white/50 py-10">
                    No parking slots found matching your criteria.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          vehicleType={filters.vehicle}
          onClose={() => setSelectedSlot(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {showTopUp && (
        <TopUpModal
          onClose={() => setShowTopUp(false)}
          onSuccess={() => {
            fetchBalance();
            // Verify if we need to refresh other header components via context or props? 
            // Currently UserHeader polls, so it will update eventually.
          }}
        />
      )}
    </>
  );
}
