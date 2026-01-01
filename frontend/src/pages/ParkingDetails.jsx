import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userApi } from "../services/api";
import BookingModal from "../components/BookingModal";
import FeatureBadge from "../components/FeatureBadge";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix for Leaflet marker icons in React
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function ParkingDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [slot, setSlot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [reviews, setReviews] = useState([]);
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

    // Use slot images or fall back to mock images
    const images = slot?.images?.length > 0
        ? slot.images.map(img => `${API_BASE}${img}`)
        : [
            "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1470224114660-3f6686c562eb?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1590674899505-1c5c4195c60c?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80",
        ];

    useEffect(() => {
        const fetchSlot = async () => {
            try {
                const data = await userApi.getSlot(id);
                setSlot(data.slot);
                const reviewsData = await userApi.getReviews(id);
                setReviews(reviewsData.reviews);
            } catch (err) {
                console.error("Failed to fetch slot details:", err);
                setError("Failed to load parking details.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchSlot();
        }
    }, [id]);

    const handleReviewSubmit = async () => {
        if (userRating === 0) return;
        setReviewSubmitting(true);
        try {
            await userApi.addReview({
                lotId: id,
                rating: userRating,
                comment: userComment
            });
            // Refresh reviews
            const reviewsData = await userApi.getReviews(id);
            setReviews(reviewsData.reviews);
            setUserRating(0);
            setUserComment("");
        } catch (err) {
            console.error("Failed to submit review:", err);
            alert("Failed to submit review. Please try again.");
        } finally {
            setReviewSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brandNight flex items-center justify-center text-white">
                Loading...
            </div>
        );
    }

    if (error || !slot) {
        return (
            <div className="min-h-screen bg-brandNight flex items-center justify-center text-white">
                {error || "Parking slot not found"}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brandNight text-brandSand pb-20">
            {/* Header / Nav */}
            <div className="bg-brandIndigo shadow-sm sticky top-0 z-20 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white font-medium transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                            />
                        </svg>
                        Back to Search
                    </button>
                    <div className="flex gap-4">
                        <button className="p-2 text-gray-400 hover:text-white transition-colors">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-6 h-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.287.696.345 1.084m-.345-1.084c-.32-.18-.696-.287-1.084-.345m4.961 3.09a2.25 2.25 0 100 2.186m0-2.186c.18.324.287.696.345 1.084m-.345-1.084c-.32-.18-.696-.287-1.084-.345m-3.877 0c.32.18.696.287 1.084.345m0 0a4.836 4.836 0 01-1.737 1.737m1.737-1.737c-.388.058-.764.165-1.084.345m4.961 0a4.836 4.836 0 01-1.737 1.737m1.737-1.737c.388.058.764.165 1.084.345m-4.961 0c.32.18.696.287 1.084.345m0 0c.388-.058.764-.165 1.084-.345m-4.961 0c.388.058.764.165 1.084.345m4.961 0c.32.18.696.287 1.084.345"
                                />
                            </svg>
                        </button>
                        <button className="p-2 text-red-500 hover:text-red-600 transition-colors">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-6 h-6"
                            >
                                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            <div className="relative h-96 rounded-3xl overflow-hidden group">
                                <img
                                    src={images[activeImage]}
                                    alt={slot.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <button
                                    onClick={() =>
                                        setActiveImage((prev) =>
                                            prev === 0 ? images.length - 1 : prev - 1
                                        )
                                    }
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full shadow-lg backdrop-blur-sm transition-all"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                        className="w-6 h-6"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15.75 19.5L8.25 12l7.5-7.5"
                                        />
                                    </svg>
                                </button>
                                <button
                                    onClick={() =>
                                        setActiveImage((prev) =>
                                            prev === images.length - 1 ? 0 : prev + 1
                                        )
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full shadow-lg backdrop-blur-sm transition-all"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                        className="w-6 h-6"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                                        />
                                    </svg>
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`h-24 rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx
                                            ? "border-brandSky ring-2 ring-brandSky/20"
                                            : "border-transparent opacity-70 hover:opacity-100"
                                            }`}
                                    >
                                        <img
                                            src={img}
                                            alt={`View ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title & Info */}
                        <div>
                            <h1 className="text-3xl font-bold text-white">{slot.name}</h1>
                            <div className="flex items-center gap-2 mt-2 text-gray-400">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                                    />
                                </svg>
                                <span>{slot.address}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-1 text-yellow-500 font-bold">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-5 h-5"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span>4.8</span>
                                    <span className="text-gray-400 font-normal text-sm">
                                        (245 reviews)
                                    </span>
                                </div>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-400">0.3 mi</span>
                                <span className="text-gray-500">•</span>
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-sm font-medium">
                                    Available
                                </span>
                            </div>
                        </div>

                        <hr className="border-white/10" />

                        {/* About */}
                        <div>
                            <h2 className="text-xl font-semibold mb-3 text-white">About this location</h2>
                            <p className="text-gray-400 leading-relaxed">
                                parking facility offers secure, covered parking with 24/7
                                surveillance. Perfect for both short-term and long-term parking
                                needs. Easy access to major highways and public transportation.
                            </p>
                        </div>

                        {/* Map */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-white">Location Map</h2>
                            <div className="h-64 rounded-3xl overflow-hidden shadow-inner border border-white/10 relative z-0">
                                {slot.latitude && slot.longitude ? (
                                    <MapContainer
                                        center={[slot.latitude, slot.longitude]}
                                        zoom={15}
                                        scrollWheelZoom={false}
                                        style={{ height: "100%", width: "100%" }}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <Marker position={[slot.latitude, slot.longitude]}>
                                            <Popup>{slot.name}</Popup>
                                        </Marker>
                                    </MapContainer>
                                ) : (
                                    <div className="w-full h-full bg-brandIndigo flex items-center justify-center text-gray-500">
                                        Map data not available
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${slot.latitude},${slot.longitude}`, '_blank')}
                                className="mt-4 w-full py-3 border border-white/10 rounded-xl font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                                    />
                                </svg>
                                Get Directions
                            </button>
                        </div>

                        {/* Reviews */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-white">Reviews & Ratings</h2>
                            <div className="flex items-center gap-8 mb-8">
                                <div className="text-center">
                                    <div className="text-5xl font-bold text-white">
                                        {reviews.length > 0
                                            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                                            : "0.0"}
                                    </div>
                                    <div className="flex text-yellow-500 justify-center my-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <svg
                                                key={star}
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                                className={`w-4 h-4 ${star <= (reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0) ? "text-yellow-500" : "text-gray-600"}`}
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        ))}
                                    </div>
                                    <div className="text-sm text-gray-500">Based on {reviews.length} reviews</div>
                                </div>
                                {/* Rating Bars - Simplified for now */}
                                <div className="flex-1 space-y-2">
                                    {/* Placeholder for rating bars logic if needed later */}
                                </div>
                            </div>

                            {/* Reviews List */}
                            <div className="space-y-4 mb-8">
                                {reviews.map((review) => (
                                    <div key={review.id} className="bg-brandIndigo p-4 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="font-semibold text-white">{review.full_name || "User"}</span>
                                                <div className="flex text-yellow-500 text-sm">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className={i < review.rating ? "text-yellow-500" : "text-gray-600"}>★</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-400">{review.comment}</p>
                                    </div>
                                ))}
                                {reviews.length === 0 && (
                                    <p className="text-gray-500 italic">No reviews yet. Be the first to review!</p>
                                )}
                            </div>

                            <div className="bg-brandIndigo border border-white/10 rounded-2xl p-6">
                                <h3 className="font-medium mb-4 text-white">Write a Review</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">
                                            Your Rating
                                        </label>
                                        <div className="flex gap-1 text-gray-600">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <svg
                                                    key={star}
                                                    onClick={() => setUserRating(star)}
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill={star <= userRating ? "currentColor" : "none"}
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                    className={`w-8 h-8 cursor-pointer transition-colors ${star <= userRating ? "text-yellow-500" : "hover:text-yellow-500"}`}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.563.044.8.77.397 1.18l-4.25 4.353a.563.563 0 00-.16.495l1.273 5.38a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.273-5.38a.563.563 0 00-.16-.495L3.005 9.672a.563.563 0 01.397-1.18l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                                    />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">
                                            Your Review
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={userComment}
                                            onChange={(e) => setUserComment(e.target.value)}
                                            className="w-full rounded-xl border-white/10 bg-brandNight text-white focus:bg-brandNight focus:ring-brandSky focus:border-brandSky transition-all placeholder-gray-500"
                                            placeholder="Share your experience at this parking spot..."
                                        />
                                    </div>
                                    <button
                                        onClick={handleReviewSubmit}
                                        disabled={reviewSubmitting || userRating === 0}
                                        className="bg-brandSky text-brandNight font-semibold px-6 py-2 rounded-xl hover:bg-brandSky/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brandSky/20"
                                    >
                                        {reviewSubmitting ? "Submitting..." : "Submit Review"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Sidebar - Right Column */}
                <div className="lg:col-span-1">
                    <p className="text-gray-400 leading-relaxed">
                        Conveniently located in the heart of downtown, this premium
                        parking facility offers secure, covered parking with 24/7
                        surveillance. Perfect for both short-term and long-term parking
                        needs. Easy access to major highways and public transportation.
                    </p>
                    <div className="mt-6 sticky top-24 space-y-6">
                        <div className="bg-brandIndigo rounded-3xl p-6 shadow-lg border border-white/5">
                            <div className="mb-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-white">
                                        ₹{slot.pricing?.hourly || 8}
                                    </span>
                                    <span className="text-gray-400">/hour</span>
                                </div>
                                <div className="text-sm text-green-400 font-medium mt-1">
                                    Best price in the area
                                </div>
                            </div>

                            {parseInt(slot.availableSlots) > 0 ? (
                                <button
                                    onClick={() => setShowBookingModal(true)}
                                    className="w-full bg-brandSky text-brandNight font-bold py-4 rounded-xl hover:bg-brandSky/90 transition-all shadow-lg shadow-brandSky/20 mb-6"
                                >
                                    Book Now
                                </button>
                            ) : (
                                <div className="space-y-4 mb-6">
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-center font-bold">
                                        Parking Full
                                    </div>

                                    {slot.nearbyLots && slot.nearbyLots.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-white font-medium text-sm">Nearby Alternatives:</h4>
                                            {slot.nearbyLots.map(nearby => (
                                                <button
                                                    key={nearby.id}
                                                    onClick={() => navigate(`/parking/${nearby.id}`)}
                                                    className="w-full bg-brandIndigo hover:bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3 transition-all text-left group"
                                                >
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-brandNight shrink-0">
                                                        <img
                                                            src={nearby.images && nearby.images.length > 0 ? `${API_BASE}${nearby.images[0]}` : "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=100&q=80"}
                                                            alt={nearby.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-white font-medium truncate group-hover:text-brandSky transition-colors">{nearby.name}</div>
                                                        <div className="text-xs text-green-400">{nearby.availableSlots} slots available</div>
                                                    </div>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors">
                                                        <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-4 border-b border-white/5 pb-6 mb-6">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Instant confirmation</span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-5 h-5 text-green-500"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Free cancellation</span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-5 h-5 text-green-500"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Mobile access</span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-5 h-5 text-green-500"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-4 text-white">Pricing Options</h3>
                                <div className="space-y-3 bg-brandNight/50 border border-white/5 p-4 rounded-xl">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Hourly</span>
                                        <span className="font-medium text-white">
                                            ₹{slot.pricing?.hourly || 8}/hr
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Daily (8+ hrs)</span>
                                        <span className="font-medium text-white">
                                            ₹{slot.pricing?.daily || 48}/day
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Monthly</span>
                                        <span className="font-medium text-white">
                                            ₹{slot.pricing?.monthly || 960}/mo
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            {
                showBookingModal && (
                    <BookingModal
                        slot={slot}
                        vehicleType="car"
                        onClose={() => setShowBookingModal(false)}
                        onSuccess={() => {
                            setShowBookingModal(false);
                            navigate("/bookings");
                        }}
                    />
                )
            }
        </div >
    );
}
