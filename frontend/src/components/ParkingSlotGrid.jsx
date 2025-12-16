import React, { useMemo } from 'react';

/**
 * ParkingSlotGrid Component
 * 
 * Displays a grid of parking slots with status indicators.
 * Handles selection, availability checking based on time overlap, and EV restrictions.
 * 
 * @param {Array} slots - Array of slot objects { id: string, type: 'CAR'|'BIKE'|'EV' }
 * @param {Array} bookings - Array of booking objects { slotId, startTime, endTime } (ISO strings)
 * @param {String} selectedSlot - ID of the currently selected slot
 * @param {Function} onSelectSlot - Callback function when a slot is clicked (slotId) => void
 * @param {String} userVehicleType - 'car', 'bike', 'ev', etc. (should match slot types loosely)
 * @param {Date|String} queryStartTime - Start time of the desired booking (ISO string or Date)
 * @param {Date|String} queryEndTime - End time of the desired booking (ISO string or Date)
 */
const ParkingSlotGrid = ({
    slots = [],
    bookings = [],
    selectedSlot,
    onSelectSlot,
    userVehicleType,
    queryStartTime,
    queryEndTime
}) => {

    // Helper to normalize types for comparison (e.g., 'evSuv' -> 'EV')
    const normalizeType = (type) => {
        if (!type) return 'CAR';
        const t = type.toLowerCase();
        if (t.includes('ev')) return 'EV';
        if (t.includes('bike')) return 'BIKE';
        return 'CAR';
    };

    // 1. Process Status for each slot
    const slotStatusMap = useMemo(() => {
        const status = {};
        const qStart = new Date(queryStartTime).getTime();
        const qEnd = new Date(queryEndTime).getTime();

        slots.forEach(slot => {
            // Default state
            let state = 'AVAILABLE';

            // Check Booking Overlap
            if (bookings && bookings.length > 0) {
                // Find if any booking for this slot overlaps with query time
                const hasOverlap = bookings.some(booking => {
                    if (booking.slotId !== slot.id) return false;

                    const bStart = new Date(booking.startTime).getTime();
                    const bEnd = new Date(booking.endTime).getTime();

                    // Overlap condition: (StartA < EndB) and (EndA > StartB)
                    return (qStart < bEnd && qEnd > bStart);
                });

                if (hasOverlap) {
                    state = 'BOOKED';
                }
            }

            // Check EV Restriction
            if (state === 'AVAILABLE') {
                const slotTypeNor = normalizeType(slot.type);
                const userTypeNor = normalizeType(userVehicleType);

                // EV slots can only be taken by EV vehicles
                if (slotTypeNor === 'EV' && userTypeNor !== 'EV') {
                    state = 'RESTRICTED';
                }
                // Specific vehicle size checks could go here (e.g. Car in Bike slot)
                if (slotTypeNor === 'BIKE' && userTypeNor === 'CAR') {
                    state = 'RESTRICTED';
                }
            }

            status[slot.id] = state;
        });

        return status;
    }, [slots, bookings, queryStartTime, queryEndTime, userVehicleType]);

    const handleSlotClick = (slot) => {
        const status = slotStatusMap[slot.id];
        if (status === 'BOOKED' || status === 'RESTRICTED') return;
        onSelectSlot(slot.id);
    };

    return (
        <div className="w-full">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6 justify-center text-sm text-gray-300">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/50"></div>
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-600 border border-blue-400"></div>
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-700 border border-gray-600 opacity-50"></div>
                    <span>Booked</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-yellow-400">⚡</span>
                    <span>EV Only</span>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-[400px] overflow-y-auto p-2">
                {slots.map((slot) => {
                    const status = slotStatusMap[slot.id];
                    const isSelected = selectedSlot === slot.id;
                    const isEv = normalizeType(slot.type) === 'EV';
                    const isBike = normalizeType(slot.type) === 'BIKE';

                    // Base Styles
                    let baseClass = "relative h-24 rounded-lg flex flex-col items-center justify-center border-2 transition-all p-2 gap-1 select-none";

                    // State Styles
                    if (status === 'BOOKED') {
                        baseClass += " bg-gray-800/50 border-gray-700/50 text-gray-600 cursor-not-allowed";
                    } else if (status === 'RESTRICTED') {
                        baseClass += " bg-gray-800/30 border-gray-700/30 text-gray-500 cursor-not-allowed opacity-60";
                    } else if (isSelected) {
                        baseClass += " bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-105 z-10 cursor-pointer";
                    } else {
                        // Available
                        baseClass += " bg-gray-800 border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-400 hover:bg-gray-750 cursor-pointer hover:shadow-lg";
                        if (isEv) baseClass += " border-yellow-500/30";
                    }

                    return (
                        <div
                            key={slot.id}
                            onClick={() => handleSlotClick(slot)}
                            className={baseClass}
                            title={status === 'RESTRICTED' ? 'Not valid for your vehicle' : status}
                        >
                            {/* Type Icon */}
                            <div className={`text-xl mb-1 ${isSelected ? 'text-white' : ''}`}>
                                {isEv ? (
                                    <span className="text-yellow-400 filter drop-shadow-md">⚡</span>
                                ) : isBike ? (
                                    <span className={status === 'AVAILABLE' ? 'text-gray-400' : ''}>🏍️</span>
                                ) : (
                                    <span className={status === 'AVAILABLE' ? 'text-gray-400' : ''}>🚗</span>
                                )}
                            </div>

                            {/* Slot ID */}
                            <span className="font-bold text-sm tracking-wide">{slot.id}</span>

                            {/* Status Badge (for restricted/booked) */}
                            {status === 'BOOKED' && (
                                <span className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                                    <span className="text-[10px] uppercase font-bold text-white/50 transform -rotate-12">Booked</span>
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {slots.length === 0 && (
                <div className="text-center py-10 text-gray-500 border border-dashed border-gray-700 rounded-xl">
                    No slots configuration available.
                </div>
            )}
        </div>
    );
};

export default ParkingSlotGrid;
