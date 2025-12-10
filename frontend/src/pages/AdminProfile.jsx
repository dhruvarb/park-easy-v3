import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import api from "../services/api";

export default function AdminProfile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Account");

    // Form state
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        upiId: ""
    });

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await api.get("/auth/me");
            const userData = response.user;
            setUser(userData);

            // Split full name for display
            const [first, ...last] = (userData.full_name || "").split(" ");
            setFormData({
                firstName: first || "",
                lastName: last.join(" ") || "",
                email: userData.email || "",
                phone: userData.phone || "",
                address: userData.address || "",
                upiId: userData.upi_id || ""
            });
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                fullName: `${formData.firstName} ${formData.lastName}`.trim(),
                phone: formData.phone,
                address: formData.address,
                upiId: formData.upiId
            };

            const response = await api.patch("/auth/me", payload);
            setUser(response.user);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update profile");
        }
    };

    if (loading) return <div className="min-h-screen bg-brandNight flex items-center justify-center text-white">Loading...</div>;

    return (
        <>
            <NavBar>
                <Link to="/admin" className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back to Dashboard
                </Link>
            </NavBar>
            <main className="min-h-screen bg-brandNight pt-12 pb-12 px-6">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Profile Header */}
                    <div className="bg-brandIndigo rounded-3xl p-8 shadow-lg border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-brandIris/20 flex items-center justify-center text-brandIris text-3xl font-bold border border-brandIris/30">
                                {formData.firstName.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{user?.full_name}</h1>
                                <p className="text-gray-400">{user?.email}</p>
                                <span className="inline-block mt-2 px-3 py-1 bg-brandSky/20 text-brandSky text-xs font-bold rounded-full border border-brandSky/30">
                                    Administrator
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {["Account", "Security", "Activity Log"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab
                                    ? "bg-brandSky text-brandNight shadow-glow"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="bg-brandIndigo rounded-3xl p-8 shadow-lg border border-white/5">
                        <h2 className="text-lg font-semibold text-white mb-6">Admin Information</h2>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-400">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full bg-brandNight border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brandSky/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-400">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full bg-brandNight border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brandSky/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-400">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    readOnly
                                    className="w-full bg-brandNight border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brandSky/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-400">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-brandNight border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brandSky/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-400">UPI ID (for receiving payments)</label>
                                <input
                                    type="text"
                                    value={formData.upiId}
                                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                                    placeholder="e.g. username@upi"
                                    className="w-full bg-brandNight border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brandSky/20"
                                />
                            </div>

                            <button
                                type="submit"
                                className="px-8 py-3 bg-brandIris text-white font-semibold rounded-xl hover:bg-brandIris/90 transition-colors shadow-lg shadow-brandIris/20"
                            >
                                Save Changes
                            </button>
                        </form>
                    </div>

                </div>
            </main>
        </>
    );
}
