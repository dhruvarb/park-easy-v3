import { useState, useEffect } from "react";
import UserHeader from "../components/UserHeader";
import api from "../services/api";

export default function UserProfile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Account");

    // Form state
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: ""
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
                address: userData.address || ""
            });
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        alert("Profile update functionality coming soon!");
    };

    if (loading) return <div className="min-h-screen bg-brandNight flex items-center justify-center text-white">Loading...</div>;

    return (
        <>
            <UserHeader />
            <main className="min-h-screen bg-brandNight pt-20 pb-12 px-6">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Profile Header */}
                    <div className="bg-brandIndigo rounded-3xl p-8 shadow-lg border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-brandNight/50 overflow-hidden flex items-center justify-center border border-white/10">
                                {/* Placeholder Avatar */}
                                <svg className="w-full h-full text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{user?.full_name}</h1>
                                <p className="text-gray-400">{user?.email}</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Member since {new Date(user?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                        <button className="px-6 py-2.5 border border-white/10 rounded-xl text-sm font-semibold text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                            Edit Profile
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {["Account", "Vehicles", "Payment", "Notifications", "Security"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab
                                    ? "bg-brandSky shadow-glow text-brandNight"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="bg-brandIndigo rounded-3xl p-8 shadow-lg border border-white/5">
                        <h2 className="text-lg font-semibold text-white mb-6">Personal Information</h2>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-400">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        readOnly
                                        className="w-full bg-brandNight border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brandSky/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-400">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        readOnly
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
                                    readOnly
                                    className="w-full bg-brandNight border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brandSky/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-400">Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    readOnly
                                    placeholder="No address set"
                                    className="w-full bg-brandNight border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brandSky/20"
                                />
                            </div>

                            <button
                                type="submit"
                                className="px-8 py-3 bg-brandSky text-brandNight font-semibold rounded-xl hover:bg-brandSky/90 transition-colors shadow-lg shadow-brandSky/20"
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
