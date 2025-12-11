import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FeatureBadge from "./FeatureBadge";

export default function ParkingCard({ slot, onBook, isFavorite, onToggleFavorite, filterDuration = "Hourly" }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

  const getPriceDisplay = () => {
    const pricing = slot.pricing || {};
    if (filterDuration === "Daily") {
      return { price: pricing.daily || 0, unit: "per day" };
    }
    if (filterDuration === "Monthly") {
      return { price: pricing.monthly || 0, unit: "per month" };
    }
    return { price: pricing.hourly || 0, unit: "per hour" };
  };

  const { price, unit } = getPriceDisplay();

  return (
    <div
      className="rounded-3xl overflow-hidden bg-brandIndigo border border-white/5 shadow-lg flex flex-col relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite && onToggleFavorite(slot);
        }}
        className={`absolute top-4 left-4 z-10 p-2 rounded-full backdrop-blur-md transition-all duration-300 ${isFavorite
          ? "bg-white text-red-500 shadow-lg scale-110"
          : "bg-black/20 text-white/70 hover:bg-white hover:text-red-500"
          }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      </button>

      {slot.images && slot.images.length > 0 ? (
        <div
          onClick={() => navigate(`/parking/${slot.id}`)}
          className="h-36 w-full cursor-pointer overflow-hidden"
        >
          <img
            src={slot.images[0].startsWith('http') ? slot.images[0] : `${API_BASE}${slot.images[0]}`}
            alt={slot.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      ) : (
        <div
          onClick={() => navigate(`/parking/${slot.id}`)}
          className="h-36 w-full cursor-pointer overflow-hidden relative"
        >
          <img
            src={slot.hasEv
              ? "https://images.unsplash.com/photo-1590674899540-0047460de3df?q=80&w=800&auto=format&fit=crop"
              : "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=800&auto=format&fit=crop"}
            alt="Parking Spot"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brandIndigo/50 to-transparent"></div>
        </div>
      )}
      <div className="p-6 flex flex-col gap-4 flex-grow text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">{slot.name}</h3>
            <p className="text-sm text-gray-400">{slot.address}</p>
          </div>
          {slot.hasEv && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brandSky/20 text-brandSky border border-brandSky/30">
              EV Ready
            </span>
          )}
        </div>
        <div className="flex gap-4 text-sm items-center">
          <span className="text-2xl font-semibold text-brandSky">
            ₹{price}
          </span>
          <span className="text-gray-400">
            {unit} • {slot.availableSlots || 0} slots open
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {slot.amenities?.map((feature) => (
            <FeatureBadge key={feature} label={feature} />
          ))}
        </div>
        <button
          onClick={() => onBook(slot)}
          className="mt-auto w-full bg-brandSky text-brandNight font-semibold py-3 rounded-2xl hover:bg-white transition-all"
        >
          Book Slot
        </button>
      </div>
    </div>
  );
}
