import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "../components/Navbar";
import heroImage from "../assets/hero-real-parking.png";

const CITIES = [
  "Select City",
  "Hubli",
  "Dharwad",
  "Bangalore",
  "Mumbai",
  "Delhi",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Surat"
];

export default function Landing() {
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const navigate = useNavigate();

  const handleSearch = () => {
    if (!city || city === "Select City") {
      alert("Please select a city");
      return;
    }

    const supportedCities = ["Hubli", "Dharwad"];
    if (supportedCities.includes(city)) {
      localStorage.setItem('pe_city', city);
      setShowRoleModal(true);
    } else {
      navigate("/coming-soon");
    }
  };

  const handleRoleSelect = (role) => {
    navigate(`/auth?role=${role}&city=${city}&location=${location}`);
  };

  return (
    <>
      <NavBar />
      <main className="relative min-h-screen bg-brandNight text-brandSand font-sans overflow-hidden">
        {/* Background Elements - Adapted to Cool Tones */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute -top-32 right-0 w-[800px] h-[800px] bg-brandSky/20 blur-[120px]" />
          <div className="absolute bottom-0 -left-32 w-[600px] h-[600px] bg-white/5 blur-[150px]" />
        </div>

        {/* Hero Section */}
        <section className="relative pt-20 pb-20 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center z-10">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brandSky/10 border border-brandSky/20 text-brandSky text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-brandSky animate-pulse"></span>
              Smart Parking Solution
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-white">Lets find a</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brandSky via-white to-brandSky">
                parking space for you
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mx-auto lg:mx-0">
              Seamless parking experience. Book spots, manage earnings, and navigate with ease using our next-gen platform.
            </p>

            {/* Search Bar */}
            <div className="bg-brandIndigo/50 backdrop-blur-md border border-white/5 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl shadow-brandNight/50">
              <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400 group-focus-within:text-brandSky transition-colors">
                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <select
                  className="w-full h-14 pl-12 pr-12 bg-transparent rounded-xl focus:outline-none text-white placeholder-gray-500 appearance-none [&>option]:bg-brandIndigo cursor-pointer hover:bg-white/5 transition-colors"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </span>
              </div>
              <button
                onClick={handleSearch}
                className="bg-brandSky hover:bg-brandSky/90 text-brandNight px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brandSky/25 hover:shadow-brandSky/40 active:scale-95"
              >
                Search
              </button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-8 pt-4 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              {/* Trust Badges / Icons Placeholder */}
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
                <span className="text-sm font-medium">Verified Spots</span>
              </div>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-500"><path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" /><path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" /></svg>
                <span className="text-sm font-medium">Secure Payments</span>
              </div>
            </div>
          </div>

          {/* Hero Image - Adapted to Image Style */}
          <div className="relative hidden lg:block perspective-1000 group">
            {/* Glow effect behind image */}
            <div className="absolute top-10 left-10 right-10 bottom-10 bg-brandSky/30 blur-[80px] -z-10 rounded-full transition-all duration-700 group-hover:bg-brandSky/40" />

            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group-hover:scale-[1.02] transition-transform duration-700">
              <div className="absolute inset-0 bg-gradient-to-tr from-brandNight/40 via-transparent to-transparent pointer-events-none z-10" />
              <img
                src={heroImage}
                alt="Smart Parking"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </section>

        {/* Role Selection Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#1E293B] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
              <h2 className="text-2xl font-bold text-white">Continue as</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleRoleSelect('user')}
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-white">User</span>
                </button>
                <button
                  onClick={() => handleRoleSelect('admin')}
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-white">Admin</span>
                </button>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

