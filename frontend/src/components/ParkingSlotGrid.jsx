import React, { useMemo } from 'react';

/**
 * ParkingSlotGrid Component
 * 
 * Displays a visual grid of parking slots based on x/y coordinates.
 * Matches the layout designed in the BlueprintEditor.
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
        <div className="w-full overflow-auto">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4 justify-center text-xs text-gray-300">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-700 border border-gray-500 rounded-sm"></div> Avail</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-brandSky border border-brandSky rounded-sm"></div> Select</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-900/50 border border-red-500/50 rounded-sm"></div> Booked</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-900/50 border border-yellow-500/50 rounded-sm"></div> EV</div>
            </div>

            <div
                className="grid gap-1 bg-[#0F172A] p-4 rounded-xl border border-white/5 mx-auto"
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${gridSize}, minmax(40px, 1fr))`, // Fixed 40px cells
                    gridTemplateRows: `repeat(${gridSize}, minmax(40px, 1fr))`,
                    width: 'fit-content' // Fit content to keep squares square
                }}
            >
                {slots.map((slot) => {
                    // Check bounds just in case
                    if (slot.x >= gridSize || slot.y >= gridSize) return null;

                    const status = slotStatusMap[slot.id];
                    const isSelected = selectedSlot?.id === slot.id;
                    const type = normalizeType(slot.type);

                    // Skip Walls/Roads for interaction but render them visually
                    const isInteractive = type !== 'WALL' && type !== 'ROAD' && type !== 'ENTRY';

                    let bgClass = "bg-gray-800/50";
                    let borderClass = "border-white/5";
                    let textClass = "text-gray-500";
                    let cursorClass = "cursor-default";
                    let hoverClass = "";

                    if (type === 'WALL') {
                        bgClass = "bg-gray-700";
                        borderClass = "border-gray-600";
                    } else if (type === 'ROAD') {
                        bgClass = "bg-transparent";
                        borderClass = "border-transparent";
                    } else if (type === 'ENTRY') {
                        bgClass = "bg-emerald-500/20";
                        borderClass = "border-emerald-500/50";
                        textClass = "text-emerald-500 font-bold text-[10px]";
                    } else {
                        // Variables based on status
                        cursorClass = "cursor-pointer";
                        if (status === 'BOOKED') {
                            bgClass = "bg-red-900/20";
                            borderClass = "border-red-500/30";
                            cursorClass = "cursor-not-allowed";
                            textClass = "text-red-700";
                        } else if (status === 'RESTRICTED') {
                            bgClass = "opacity-30 grayscale";
                            cursorClass = "cursor-not-allowed";
                        } else if (isSelected) {
                            bgClass = "bg-brandSky";
                            borderClass = "border-brandSky";
                            textClass = "text-brandNight font-bold";
                        } else {
                            // Available
                            bgClass = "bg-gray-800 hover:bg-gray-700";
                            borderClass = "border-gray-600 group-hover:border-gray-400";
                            textClass = "text-gray-300";
                            if (type === 'EV') borderClass = "border-yellow-500/50";
                            if (type === 'BIKE') borderClass = "border-blue-400/30";
                        }
                    }

                    return (
                        <div
                            key={slot.id || `${slot.x}-${slot.y}`}
                            onClick={() => isInteractive && handleSlotClick(slot)}
                            className={`
                                relative rounded-md border flex items-center justify-center transition-all
                                ${bgClass} ${borderClass} ${cursorClass} ${hoverClass}
                            `}
                            style={{
                                gridColumn: (slot.x || 0) + 1,
                                gridRow: (slot.y || 0) + 1,
                                aspectRatio: '1/1',
                                transform: `rotate(${slot.rotation || 0}deg)`
                            }}
                            title={isInteractive ? `${slot.label} (${status})` : slot.type}
                        >
                            {/* Icon / Content */}
                            {type === 'WALL' && <div className="w-full h-full bg-stripes-white opacity-10"></div>}
                            {type === 'ENTRY' && <span>IN</span>}

                            {isInteractive && (
                                <div className={`flex flex-col items-center justify-center leading-none ${slot.rotation ? '-rotate-' + slot.rotation : ''}`}>
                                    {type === 'EV' && <span className="text-[10px] text-yellow-400">⚡</span>}
                                    {type === 'BIKE' && <span className="text-[10px]">🏍️</span>}
                                    {type === 'CAR' && !isSelected && <span className="text-[10px] opacity-50">🚗</span>}

                                    {/* Label */}
                                    {slot.label && (
                                        <span className={`text-[10px] font-medium mt-0.5 ${textClass}`}>
                                            {slot.label}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Booked Overlay */}
                            {status === 'BOOKED' && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-[120%] h-[2px] bg-red-500/50 rotate-45 transform"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {slots.length === 0 && (
                <div className="text-center py-10 text-gray-500 border border-dashed border-gray-700 rounded-xl">
                    No slots layout available.
                </div>
            )}
        </div>
    );
};

export default ParkingSlotGrid;
