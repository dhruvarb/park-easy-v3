import React, { useState } from 'react';

export default function AdminLotDetailsModal({ lot, onClose }) {
    const [activeImage, setActiveImage] = useState(0);
    const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || 'http://localhost:5000';

    if (!lot) return null;

    // Helper to format currency
    const formatPrice = (price) => price ? `₹${price}` : '-';

    // Helper to get full image URL
    const getImageUrl = (img) => {
        if (!img) return '';
        if (img.startsWith('http') || img.startsWith('data:')) return img;
        return `${API_BASE}${img}`;
    };

    const images = lot.images && lot.images.length > 0 ? lot.images : [];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-brandNight rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative border border-white/10">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white/70 hover:text-white transition-all z-10 shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Image Gallery */}
                <div className="relative h-64 md:h-80 bg-brandIndigo">
                    {images.length > 0 ? (
                        <>
                            <img
                                src={getImageUrl(images[activeImage])}
                                alt={lot.name}
                                className="w-full h-full object-cover"
                            />
                            {images.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    {images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImage(idx)}
                                            className={`w-2 h-2 rounded-full transition-all ${activeImage === idx ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2 opacity-50">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                                <p>No images available</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 md:p-8 space-y-8">

                    {/* Header Info */}
                    <div>
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-white">{lot.name}</h2>
                                <p className="text-gray-400 mt-1 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                    </svg>
                                    {lot.address}, {lot.city}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${lot.has_ev ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                                {lot.has_ev ? 'EV Supported' : 'Standard Parking'}
                            </span>
                        </div>

                        {lot.description && (
                            <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 text-gray-300 leading-relaxed">
                                {lot.description}
                            </div>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">

                        {/* Left Column */}
                        <div className="space-y-6">

                            {/* Capacity */}
                            <div className="bg-brandIndigo rounded-xl border border-white/5 p-5 shadow-lg">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-brandSky">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                    </svg>
                                    Capacity Breakdown
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center pb-3 border-b border-white/10">
                                        <span className="text-gray-400 font-medium">Total Capacity</span>
                                        <span className="text-xl font-bold text-white">{lot.total_capacity}</span>
                                    </div>
                                    {lot.capacityBreakdown && Object.entries(lot.capacityBreakdown).map(([type, count]) => (
                                        count > 0 && (
                                            <div key={type} className="flex justify-between items-center text-sm">
                                                <span className="text-gray-400 capitalize">{type.replace('_', ' ')}</span>
                                                <span className="font-medium text-white">{count} slots</span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>

                            {/* Amenities */}
                            <div className="bg-brandIndigo rounded-xl border border-white/5 p-5 shadow-lg">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-brandSky">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                                    </svg>
                                    Amenities
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {lot.amenities && lot.amenities.length > 0 ? (
                                        lot.amenities.map((amenity, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-white/10 text-gray-300 rounded-lg text-sm border border-white/5">
                                                {amenity}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500 text-sm italic">No amenities listed</span>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Right Column - Pricing */}
                        <div className="bg-brandIndigo rounded-xl border border-white/5 p-5 shadow-lg h-fit">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-brandIris">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Pricing Structure
                            </h3>

                            <div className="space-y-4">
                                {lot.pricing && lot.pricing.length > 0 ? (
                                    lot.pricing.map((price, idx) => (
                                        <div key={idx} className="p-3 rounded-lg border border-white/5 bg-white/5 data-[hover]:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-semibold text-white capitalize">{price.vehicleType.replace('_', ' ')}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                <div className="text-center p-2 bg-brandNight rounded border border-white/5">
                                                    <div className="text-xs text-gray-500 mb-1">Hourly</div>
                                                    <div className="font-medium text-brandSky">{formatPrice(price.hourly)}</div>
                                                </div>
                                                <div className="text-center p-2 bg-brandNight rounded border border-white/5">
                                                    <div className="text-xs text-gray-500 mb-1">Daily</div>
                                                    <div className="font-medium text-brandSky">{formatPrice(price.daily)}</div>
                                                </div>
                                                <div className="text-center p-2 bg-brandNight rounded border border-white/5">
                                                    <div className="text-xs text-gray-500 mb-1">Monthly</div>
                                                    <div className="font-medium text-brandSky">{formatPrice(price.monthly)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No pricing information available
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
