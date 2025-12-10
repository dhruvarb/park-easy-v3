// src/components/StatCard.jsx
export default function StatCard({ label, value, accent = "text-brandSky" }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-brandNight/80 to-brandIndigo/80 border border-white/10 px-5 py-4 flex flex-col gap-1 text-white shadow-glow">
      <span className="text-xs tracking-[0.3em] uppercase text-white/60">
        {label}
      </span>
      <span className={`text-3xl font-semibold ${accent}`}>{value}</span>
    </div>
  );
}
