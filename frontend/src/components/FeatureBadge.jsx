// src/components/FeatureBadge.jsx
export default function FeatureBadge({ label }) {
  return (
    <span className="text-xs font-semibold text-brandSky bg-brandSky/20 border border-brandSky/30 px-3 py-1 rounded-full tracking-wide">
      {label}
    </span>
  );
}
