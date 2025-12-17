const vehicleTypes = [
  { id: "bike", label: "Bike", icon: "🏍️" },
  { id: "car", label: "Car", icon: "🚗" },
  { id: "ev_bike", label: "EV Bike", icon: "🛵⚡" },
  { id: "ev_car", label: "EV Car", icon: "🚙⚡" },
  { id: "bus", label: "Bus", icon: "🚌" },
];

const durations = ["Hourly", "Daily", "Monthly"];

export default function FilterPanel({ filters, onChange }) {
  const setFilter = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <aside className="rounded-3xl bg-brandIndigo text-brandSand p-6 shadow-lg border border-white/5 space-y-6 h-fit sticky top-24">
      <div className="bg-brandNight/50 rounded-2xl p-4 border border-white/5">
        <h4 className="text-xs tracking-[0.2em] uppercase text-brandSky/90">
          Vehicle Type
        </h4>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {vehicleTypes.map((v) => (
            <button
              key={v.id}
              onClick={() => setFilter("vehicle", v.id)}
              className={`rounded-xl py-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${filters.vehicle === v.id
                ? "bg-brandSky text-brandNight"
                : "bg-white/5 text-white/70 hover:bg-white/15"
                }`}
            >
              <span className="text-lg">{v.icon}</span>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-brandNight/50 rounded-2xl p-4 border border-white/5">
        <h4 className="text-xs tracking-[0.2em] uppercase text-brandSky/90">
          Duration
        </h4>
        <div className="mt-4 flex gap-2">
          {durations.map((d) => (
            <button
              key={d}
              onClick={() => setFilter("duration", d)}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${filters.duration === d
                ? "bg-brandIris text-white shadow-lg shadow-brandIris/40"
                : "bg-white/5 text-white/70 hover:bg-white/15"
                }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-brandSand/80 bg-brandNight/50 rounded-2xl px-4 py-3 border border-white/5">
        <input
          type="checkbox"
          checked={filters.evOnly}
          onChange={(e) => setFilter("evOnly", e.target.checked)}
          className="h-4 w-4 rounded border-white/30 text-brandSky focus:ring-brandSky"
        />
        Show EV charging spots only
      </label>
    </aside>
  );
}
