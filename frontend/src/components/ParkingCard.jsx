import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FeatureBadge from "./FeatureBadge";

export default function ParkingCard({ slot, onBook, filterDuration = "Hourly" }) {
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
  const isFull = slot.availableSlots === 0;

  return (
    <div
      className="rounded-3xl overflow-hidden bg-brandIndigo border border-white/5 shadow-lg flex flex-col relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {slot.images && slot.images.length > 0 ? (
        <div
          onClick={() => !isFull && navigate(`/parking/${slot.id}`)}
          className={`h-36 w-full overflow-hidden ${isFull ? 'grayscale cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <img
            src={slot.images[0].startsWith('http') || slot.images[0].startsWith('data:') ? slot.images[0] : `${API_BASE}${slot.images[0]}`}
            alt={slot.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${!isFull && "group-hover:scale-110"}`}
          />
        </div>
      ) : (
        <div
          onClick={() => !isFull && navigate(`/parking/${slot.id}`)}
          className={`h-36 w-full overflow-hidden relative ${isFull ? 'grayscale cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <img
            src={slot.hasEv
              ? "https://images.unsplash.com/photo-1590674899540-0047460de3df?q=80&w=800&auto=format&fit=crop"
              : "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=800&auto=format&fit=crop"}
            alt="Parking Spot"
            className={`w-full h-full object-cover transition-transform duration-500 ${!isFull && "group-hover:scale-110"}`}
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
          <span className={`text-2xl font-semibold ${isFull ? 'text-gray-500' : 'text-brandSky'}`}>
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
          disabled={isFull}
          className={`mt-auto w-full font-semibold py-3 rounded-2xl transition-all ${isFull
            ? "bg-gray-600 text-gray-400 cursor-not-allowed border border-white/5"
            : "bg-brandSky text-brandNight hover:bg-white"
            }`}
        >
          {isFull ? "Fully Occupied" : "Book Slot"}
        </button>
      </div>
    </div>
  );
}
