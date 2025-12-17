import React, { useState, useEffect, useRef } from 'react';

const ICONS = {
    CAR: '🚗',
    BIKE: '🏍️',
    EV: '⚡', // Legacy support
    EV_CAR: '🚙⚡',
    EV_BIKE: '🛵⚡',
    TRUCK: '🚛',
    MINIBUS: '🚐',
    WALL: '🧱',
    ENTRY: '🚪',
    ROAD: '🛣️'
};

const TOOLS = [
    { id: 'select', label: 'Select/Rotate', icon: '👆' },
    { id: 'car', label: 'Car Slot', icon: ICONS.CAR, type: 'CAR' },
    { id: 'bike', label: 'Bike Slot', icon: ICONS.BIKE, type: 'BIKE' },
    { id: 'ev_car', label: 'EV Car', icon: ICONS.EV_CAR, type: 'EV_CAR' },
    { id: 'ev_bike', label: 'EV Bike', icon: ICONS.EV_BIKE, type: 'EV_BIKE' },
    { id: 'truck', label: 'Truck', icon: ICONS.TRUCK, type: 'TRUCK' },
    { id: 'minibus', label: 'Mini Bus', icon: ICONS.MINIBUS, type: 'MINIBUS' },
    { id: 'wall', label: 'Wall', icon: ICONS.WALL, type: 'WALL' },
    { id: 'road', label: 'Road/Path', icon: ICONS.ROAD, type: 'ROAD' },
    { id: 'erase', label: 'Erase', icon: '🧹' }
];

const BlueprintEditor = ({ initialSlots = [], onUpdate }) => {
    // Grid Configuration
    const GRID_SIZE = 15; // 15x15 grid
    const [grid, setGrid] = useState([]);
    const [selectedTool, setSelectedTool] = useState('select');
    const [slots, setSlots] = useState([]);

    // Initialize Grid
    useEffect(() => {
        // Hydrate from props if available
        if (initialSlots && initialSlots.length > 0) {
            setSlots(initialSlots);
        }
    }, [initialSlots]);

    // Handle Cell Click
    const handleCellClick = (x, y) => {
        const existingSlotIndex = slots.findIndex(s => s.x === x && s.y === y);
        const existingSlot = slots[existingSlotIndex];

        if (selectedTool === 'erase') {
            if (existingSlotIndex !== -1) {
                const newSlots = [...slots];
                newSlots.splice(existingSlotIndex, 1);
                setSlots(newSlots);
                onUpdate(newSlots);
            }
            return;
        }

        if (selectedTool === 'select') {
            if (existingSlot) {
                // Rotate existing
                const newSlots = [...slots];
                newSlots[existingSlotIndex] = {
                    ...existingSlot,
                    rotation: (existingSlot.rotation + 90) % 360
                };
                setSlots(newSlots);
                onUpdate(newSlots);
            }
            return;
        }

        // Place new item
        const tool = TOOLS.find(t => t.id === selectedTool);
        if (!tool || tool.id === 'select' || tool.id === 'erase') return;

        const newSlot = {
            id: existingSlot ? existingSlot.id : `${tool.type}-${Date.now()}`, // Temp ID
            x,
            y,
            type: tool.type,
            rotation: existingSlot ? existingSlot.rotation : 0,
            label: '' // Can be auto-generated later
        };

        let newSlots = [...slots];
        if (existingSlotIndex !== -1) {
            newSlots[existingSlotIndex] = newSlot;
        } else {
            newSlots.push(newSlot);
        }

        setSlots(newSlots);
        onUpdate(newSlots);
    };

    // Render Grid
    const renderGrid = () => {
        const cells = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const slot = slots.find(s => s.x === x && s.y === y);
                cells.push(
                    <div
                        key={`${x}-${y}`}
                        onClick={() => handleCellClick(x, y)}
                        className={`
                            w-10 h-10 border border-white/5 flex items-center justify-center cursor-pointer transition-all
                            ${slot ? 'bg-white/10' : 'hover:bg-white/5'}
                        `}
                    >
                        {slot && (
                            <div
                                style={{ transform: `rotate(${slot.rotation}deg)` }}
                                className="text-2xl select-none"
                            >
                                {ICONS[slot.type] || '?'}
                            </div>
                        )}
                        {!slot && selectedTool !== 'select' && selectedTool !== 'erase' && (
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                        )}
                    </div>
                );
            }
        }
        return cells;
    };

    // Calculate Stats
    const stats = slots.reduce((acc, slot) => {
        if (!acc[slot.type]) acc[slot.type] = 0;
        acc[slot.type]++;
        return acc;
    }, {});

    return (
        <div className="flex flex-col md:flex-row gap-6 p-4 border border-white/10 rounded-xl bg-[#0F172A]">
            {/* Toolbar */}
            <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:w-48">
                <h3 className="text-sm font-bold text-gray-400 mb-2 hidden md:block">Tools</h3>
                {TOOLS.map(tool => (
                    <button
                        key={tool.id}
                        type="button"
                        onClick={() => setSelectedTool(tool.id)}
                        className={`
                            flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all min-w-[120px] md:min-w-0
                            ${selectedTool === tool.id
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10'}
                        `}
                    >
                        <span className="text-xl">{tool.icon}</span>
                        <span>{tool.label}</span>
                    </button>
                ))}

                <div className="mt-4 pt-4 border-t border-white/10 hidden md:block">
                    <h3 className="text-xs font-bold text-gray-500 mb-2">STATS</h3>
                    <div className="space-y-1 text-xs text-gray-400">
                        <div className="flex justify-between"><span>Cars:</span> <span className="text-white">{stats.CAR || 0}</span></div>
                        <div className="flex justify-between"><span>Bikes:</span> <span className="text-white">{stats.BIKE || 0}</span></div>
                        <div className="flex justify-between"><span>EV Cars:</span> <span className="text-white">{stats.EV_CAR || 0}</span></div>
                        <div className="flex justify-between"><span>EV Bikes:</span> <span className="text-white">{stats.EV_BIKE || 0}</span></div>
                        <div className="flex justify-between"><span>Trucks:</span> <span className="text-white">{stats.TRUCK || 0}</span></div>
                        <div className="flex justify-between"><span>Mini Bus:</span> <span className="text-white">{stats.MINIBUS || 0}</span></div>
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto">
                <div
                    className="grid gap-1 bg-black/20 p-4 rounded-xl border border-dashed border-white/10 mx-auto"
                    style={{
                        gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(40px, 1fr))`,
                        width: 'fit-content'
                    }}
                >
                    {renderGrid()}
                </div>
                <div className="mt-2 text-center text-xs text-gray-500">
                    Map Size: {GRID_SIZE}x{GRID_SIZE} • Click to place • Use Select tool to rotate
                </div>
            </div>

            {/* Mobile Stats */}
            <div className="md:hidden grid grid-cols-3 gap-2 text-xs text-gray-400 p-2 border-t border-white/10">
                <div className="text-center">Cars: <span className="text-white font-bold">{stats.CAR || 0}</span></div>
                <div className="text-center">Bikes: <span className="text-white font-bold">{stats.BIKE || 0}</span></div>
                <div className="text-center">EV C: <span className="text-white font-bold">{stats.EV_CAR || 0}</span></div>
                <div className="text-center">EV B: <span className="text-white font-bold">{stats.EV_BIKE || 0}</span></div>
                <div className="text-center">Truck: <span className="text-white font-bold">{stats.TRUCK || 0}</span></div>
                <div className="text-center">Bus: <span className="text-white font-bold">{stats.MINIBUS || 0}</span></div>
            </div>
        </div>
    );
};

export default BlueprintEditor;
