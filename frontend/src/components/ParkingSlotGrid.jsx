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
                className="relative bg-[#1e3a8a] p-6 rounded-xl shadow-2xl overflow-auto border-4 border-white/10"
                style={{
                    // Blueprint Blue background
                    width: 'fit-content',
                    backgroundImage: 'radial-gradient(circle, #2563eb 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    backgroundColor: '#172554' // blue-950
                }}
            >
                <div
                    className="grid relative"
                    style={{
                        display: 'grid',
                        gap: '0px',
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

                        // Default Styles (Blueprint Aesthetics)
                        if (type === 'WALL') {
                            bgClass = "bg-slate-900/50 z-10";
                            borderClass = "border border-white/20";
                        } else if (type === 'ROAD') {
                            bgClass = "bg-transparent";
                            // Render subtle guide lines for roads if needed, or keeping clear for "driving aisle"
                            content = <div className="hidden"></div>;
                        } else if (type === 'ENTRY') {
                            bgClass = "bg-white/5";
                            content = (
                                <div className="flex flex-col items-center justify-center h-full w-full">
                                    <span className="text-[9px] font-bold text-white/50 tracking-widest rotate-90 sm:rotate-0">ENTRY</span>
                                    <div className="w-4 h-4 border-b border-l border-white/50 transform -rotate-45 mt-[-2px]"></div>
                                </div>
                            );
                        } else {
                            // Parking Spots
                            bgClass = "bg-transparent";
                            borderClass = "border border-white/50 m-[0px]"; // Thin white lines

                            if (status === 'BOOKED') {
                                bgClass = "bg-red-900/40";
                                borderClass = "border border-red-400/50 m-[0px]";
                            } else if (status === 'RESTRICTED') {
                                bgClass = "bg-black/20";
                                content = <span className="opacity-20 text-xl grayscale">🚫</span>;
                            } else if (isSelected) {
                                bgClass = "bg-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-20";
                                borderClass = "border-2 border-white m-[0px]";
                            } else {
                                // Available
                                bgClass = "hover:bg-white/10 transition-colors cursor-pointer";
                                borderClass = "border border-white/60 m-[0px]";
                            }

                            // Icons
                            if (!content) {
                                content = (
                                    <div className={`flex flex-col items-center justify-center w-full h-full transition-transform ${slot.rotation ? `rotate-${slot.rotation}` : ''}`}>
                                        {/* Simplified clean icons for blueprint look */}
                                        {type === 'EV' && <span className={`text-xs ${isSelected ? 'text-white' : 'text-yellow-400'}`}>⚡</span>}
                                        {type === 'BIKE' && <span className={`text-xs ${isSelected ? 'text-white' : 'text-blue-200'}`}>M</span>}
                                        {type === 'CAR' && !isSelected && <span className="text-[10px] text-white/40">C</span>}
                                        {type === 'CAR' && isSelected && <span className="text-xs text-white">Car</span>}

                                        {/* Label */}
                                        <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-white font-bold' : 'text-white/70'}`}>{slot.label}</span>
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
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="w-[120%] h-[1px] bg-red-400/50 rotate-45 absolute"></div>
                                            <div className="w-[120%] h-[1px] bg-red-400/50 -rotate-45 absolute"></div>
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
