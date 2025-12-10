import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView({ slots }) {
    const defaultCenter = [12.9716, 77.5946]; // Default Bangalore

    return (
        <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-white/20 shadow-glow">
            <MapContainer
                center={defaultCenter}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {slots.map((slot) => (
                    slot.latitude && slot.longitude && (
                        <Marker key={slot.id} position={[slot.latitude, slot.longitude]}>
                            <Popup>
                                <div className="text-gray-900">
                                    <h3 className="font-bold">{slot.name}</h3>
                                    <p>{slot.address}</p>
                                    <p className="font-semibold text-brandSky">
                                        {slot.pricing?.hourly ? `₹${slot.pricing.hourly}/hr` : "Price N/A"}
                                    </p>
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${slot.latitude},${slot.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline text-sm"
                                    >
                                        Navigate
                                    </a>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>
        </div>
    );
}
