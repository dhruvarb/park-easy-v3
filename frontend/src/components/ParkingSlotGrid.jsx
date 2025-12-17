import React, { useMemo } from 'react';

/**
 * ParkingSlotGrid Component
 * 
 * Displays a visual grid of parking slots based on x/y coordinates.
 * Styled to look like a realistic parking blueprint (Dark Mode).
 */
const ParkingSlotGrid = ({
    slots = [],
    bookings = [],
    selectedSlot,
    onSelectSlot,
    userVehicleType,
    queryStartTime,
    queryEndTime,
    previewMode = false
}) => {
    // Determine grid dimensions
    const gridSize = 15; // Standard size matching editor

    // Helper to normalize types
    const normalizeType = (type) => {
        if (!type) return 'CAR';
        const t = type.toLowerCase();
        if (t.includes('ev')) return 'EV';
        if (t.includes('bike')) return 'BIKE';
        return 'CAR';
    };

    // Process Status for each slot
    const slotStatusMap = useMemo(() => {
        const status = {};
        if (previewMode) {
            slots.forEach(slot => status[slot.id] = 'AVAILABLE');
            return status;
        }

        const qStart = new Date(queryStartTime).getTime();
        const qEnd = new Date(queryEndTime).getTime();

        slots.forEach(slot => {
            let state = 'AVAILABLE';

            if (bookings && bookings.length > 0) {
                const hasOverlap = bookings.some(booking => {
                    if (booking.slotId !== slot.id) return false;
                    const bStart = new Date(booking.startTime).getTime();
                    const bEnd = new Date(booking.endTime).getTime();
                    return (qStart < bEnd && qEnd > bStart);
                });
                if (hasOverlap) state = 'BOOKED';
            }

            if (state === 'AVAILABLE') {
                const slotTypeNor = normalizeType(slot.type);
                const userTypeNor = normalizeType(userVehicleType);

                if (slotTypeNor === 'EV' && userTypeNor !== 'EV') state = 'RESTRICTED';
                if (slotTypeNor === 'BIKE' && userTypeNor === 'CAR') state = 'RESTRICTED';
            }
            status[slot.id] = state;
        });
        return status;
    }, [slots, bookings, queryStartTime, queryEndTime, previewMode, userVehicleType]);

    const handleSlotClick = (slot) => {
        if (slot.type === 'WALL' || slot.type === 'ROAD' || slot.type === 'ENTRY') return;

        const status = slotStatusMap[slot.id];
        if (status === 'BOOKED' || status === 'RESTRICTED') return;
        onSelectSlot(slot);
    };

    return (
        <div className="w-full overflow-hidden flex flex-col items-center">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4 justify-center text-xs text-gray-400">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-800 border border-white/20 rounded-sm"></div> <span className="text-gray-300">Available</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-brandSky border border-brandSky rounded-sm"></div> <span className="text-white">Selected</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-900/50 border border-red-500/50 rounded-sm"></div> <span className="text-red-400">Booked</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-900/50 border border-yellow-500/50 rounded-sm"></div> <span className="text-yellow-400">EV Only</span></div>
            </div>

            <div
                className="relative bg-[#334155] p-6 rounded-xl shadow-2xl overflow-auto border-4 border-[#1e293b]"
                style={{
                    // Simulating an asphalt container
                    width: 'fit-content'
                }}
            >
                <div
                    className="grid relative"
                    style={{
                        display: 'grid',
                        gap: '0px', // Seamless grid for connected roads
                        gridTemplateColumns: `repeat(${gridSize}, 40px)`,
                        gridTemplateRows: `repeat(${gridSize}, 40px)`,
                    }}
                >
                    {slots.map((slot) => {
                        if (slot.x >= gridSize || slot.y >= gridSize) return null;

                        const status = slotStatusMap[slot.id];
                        const isSelected = selectedSlot?.id === slot.id;
                        const type = normalizeType(slot.type);

                        // Skip Walls/Roads for interaction
                        const isInteractive = type !== 'WALL' && type !== 'ROAD' && type !== 'ENTRY';

                        let bgClass = "";
                        let borderClass = "";
                        let content = null;

                        // Default Styles (Map Aesthetics)
                        if (type === 'WALL') {
                            bgClass = "bg-slate-900 z-10"; // Dark walls
                            // Add a subtle 3D effect border
                            borderClass = "border-t border-l border-white/10 border-b-4 border-r-4 border-black/50";
                        } else if (type === 'ROAD') {
                            bgClass = "bg-[#334155]"; // Asphalt
                            // Optional: Dotted line logic could be complex without context, keep simple
                            content = <div className="hidden"></div>;
                        } else if (type === 'ENTRY') {
                            bgClass = "bg-[#334155]";
                            content = (
                                <div className="flex flex-col items-center justify-center h-full w-full">
                                    <span className="text-[9px] font-bold text-white/50 tracking-widest rotate-90 sm:rotate-0">ENTRY</span>
                                    <div className="w-4 h-4 border-b-2 border-l-2 border-white/50 transform -rotate-45 mt-[-2px]"></div>
                                </div>
                            );
                        } else {
                            // Parking Spots
                            bgClass = "bg-[#334155]"; // Asphalt base
                            borderClass = "border-2 border-dashed border-white/20 rounded-md m-[2px]"; // Parking lines

                            if (status === 'BOOKED') {
                                bgClass = "bg-red-900/20";
                                borderClass = "border-2 border-red-500/30 m-[2px] rounded-md";
                            } else if (status === 'RESTRICTED') {
                                bgClass = "bg-gray-800/50";
                                content = <span className="opacity-20 text-xl grayscale">🚫</span>;
                            } else if (isSelected) {
                                bgClass = "bg-brandSky shadow-[0_0_15px_rgba(14,165,233,0.6)] z-20 transform scale-105";
                                borderClass = "border-2 border-white rounded-md m-[1px]";
                            } else {
                                // Available
                                bgClass = "bg-[#334155] hover:bg-white/5 transition-colors cursor-pointer";
                                borderClass = "border-2 border-white/40 m-[2px] rounded-md"; // White paint lines
                            }

                            // Icons
                            if (!content) {
                                content = (
                                    <div className={`flex flex-col items-center justify-center w-full h-full transition-transform ${slot.rotation ? `rotate-${slot.rotation}` : ''}`}>
                                        {type === 'EV' && <span className={`text-base ${isSelected ? 'text-white' : 'text-yellow-400'}`}>⚡</span>}
                                        {type === 'BIKE' && <span className={`text-base ${isSelected ? 'text-white' : 'text-white/60'}`}>🏍️</span>}
                                        {type === 'CAR' && !isSelected && <span className="text-base text-white/40">🚗</span>}
                                        {type === 'CAR' && isSelected && <span className="text-base text-white">🚗</span>}
                                        {/* Label */}
                                        <span className={`text-[8px] font-bold mt-[-2px] ${isSelected ? 'text-white' : 'text-white/30'}`}>{slot.label}</span>
                                    </div>
                                );
                            }
                        }

                        return (
                            <div
                                key={slot.id || `${slot.x}-${slot.y}`}
                                onClick={() => isInteractive && handleSlotClick(slot)}
                                className={`relative flex items-center justify-center ${bgClass} ${borderClass}`}
                                style={{
                                    gridColumn: (slot.x || 0) + 1,
                                    gridRow: (slot.y || 0) + 1,
                                    width: '100%',
                                    height: '100%'
                                }}
                                title={isInteractive ? `${slot.label} (${status})` : slot.type}
                            >
                                {content}

                                {/* Booked Overlay */}
                                {status === 'BOOKED' && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full border-2 border-red-500/20 flex items-center justify-center">
                                            <div className="w-1 h-full bg-red-500/20 rotate-45 absolute"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {slots.length === 0 && (
                <div className="text-center py-10 text-gray-500 border border-dashed border-gray-700 rounded-xl w-full">
                    No slots layout available.
                </div>
            )}
        </div>
    );
};

export default ParkingSlotGrid;
