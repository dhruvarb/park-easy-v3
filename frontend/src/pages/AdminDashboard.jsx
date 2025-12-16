// src/pages/AdminDashboard.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import NavBar from "../components/Navbar";
import api, { adminApi } from "../services/api";
import NotificationDropdown from "../components/NotificationDropdown";
import AdminLotDetailsModal from "../components/AdminLotDetailsModal";

const VEHICLE_TYPES = [
  { id: 'bike', label: 'Bike / Motorcycle', group: 'regular', db: 'bike' },
  { id: 'car', label: 'Car / Sedan', group: 'regular', db: 'car' },
  { id: 'suv', label: 'SUV / Truck', group: 'regular', db: 'suv' },
  { id: 'bus', label: 'Bus / Large Vehicle', group: 'regular', db: 'bus' },
  { id: 'evBike', label: 'Electric Bike / Scooter', group: 'ev', db: 'ev_bike' },
  { id: 'evCar', label: 'Electric Car', group: 'ev', db: 'ev_car' },
  { id: 'evSuv', label: 'Electric SUV / Truck', group: 'ev', db: 'ev_suv' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedLot, setSelectedLot] = useState(null);
  const fileInputRef = useRef(null);
  const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || 'http://localhost:5000';

  // Header State
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("pe_user") || "{}"));
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);

    // Click outside for profile menu
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/user/notifications");
      setNotifications(response.notifications);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/user/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/user/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await api.delete(`/user/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await api.delete("/user/notifications");
      setNotifications([]);
    } catch (error) {
      console.error("Failed to clear notifications", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = files.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setNewLot(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
    }
  };

  const removeImage = (index) => {
    setNewLot(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // New state structure matching the redesign
  const [newLot, setNewLot] = useState({
    name: "",
    address: "",
    description: "",
    pricing: {}, // Stores { [vehicleId]: { hourly: "", daily: "", monthly: "" } }
    capacity: {}, // Stores { [vehicleId]: number }
    latitude: "",
    longitude: "",
    vehicleTypes: {
      bike: false,
      car: false,
      suv: false,
      bus: false,
      evBike: false,
      evCar: false,
      evSuv: false,
    },
    amenities: {
      covered: false,
      evCharging: false,
      cctv: false,
      access247: false,
    },
    images: [],
  });

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    try {
      const response = await adminApi.getLots();
      setLots(response.lots);
    } catch (error) {
      console.error("Failed to fetch lots", error);
    }
  };

  // New State for other tabs
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showLocationHelp, setShowLocationHelp] = useState(false);

  // Support Form State
  const [supportForm, setSupportForm] = useState({ subject: "General Inquiry", message: "" });
  const [supportSubmitting, setSupportSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (activeTab === "Dashboard") await fetchLots();
      if (activeTab === "Bookings") await fetchBookings();
      if (activeTab === "Earnings / Revenue") await fetchEarnings();
      if (activeTab === "Reviews") await fetchReviews();
    };

    loadData(); // Initial load

    const interval = setInterval(loadData, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      const data = await adminApi.getBookings();
      setBookings(data.bookings);
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const data = await adminApi.getEarnings();
      setEarnings(data.overview);
    } catch (error) {
      console.error("Failed to fetch earnings", error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await adminApi.getReviews();
      setReviews(response.reviews);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    }
  };



  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    setSupportSubmitting(true);
    try {
      await adminApi.submitSupport(supportForm);
      alert("Support request sent successfully!");
      setSupportForm({ subject: "", message: "" });
    } catch (error) {
      console.error("Failed to send support request", error);
      alert("Failed to send request.");
    } finally {
      setSupportSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("pe_token");
    localStorage.removeItem("pe_user");
    navigate("/login");
  };

  const handleDeleteLot = async (id) => {
    if (!window.confirm("Are you sure you want to delete this parking spot? This action cannot be undone.")) {
      return;
    }
    try {
      await adminApi.deleteLot(id);
      setLots(prev => prev.filter(lot => lot.id !== id));
      alert("Parking spot deleted successfully");
    } catch (error) {
      console.error("Failed to delete lot", error);
      alert("Failed to delete parking spot");
    }
  };

  const handleAddLot = async (e) => {
    e.preventDefault();
    try {
      // Validation
      if (!newLot.name.trim()) return alert("Please enter a spot name.");
      if (!newLot.address.trim()) return alert("Please enter a location.");
      if (!newLot.latitude || !newLot.longitude) return alert("Please enter both latitude and longitude.");

      const selectedTypes = VEHICLE_TYPES.filter(type => newLot.vehicleTypes[type.id]);
      if (selectedTypes.length === 0) return alert("Please select at least one vehicle type.");

      for (const type of selectedTypes) {
        const price = newLot.pricing[type.id];
        if (!price || !price.hourly) {
          return alert(`Please enter hourly pricing for ${type.label}.`);
        }
        if (!newLot.capacity[type.id]) {
          return alert(`Please enter capacity for ${type.label}.`);
        }
      }

      if (newLot.images.length === 0) return alert("Please upload at least one image.");

      // Map UI state to Backend Payload

      // 1. Calculate Capacity Breakdown & Total Capacity
      const capacityBreakdown = {};
      let totalCapacity = 0;

      VEHICLE_TYPES.forEach(type => {
        if (newLot.vehicleTypes[type.id]) {
          const cap = Number(newLot.capacity[type.id]) || 0;
          // Accumulate capacity for backend keys
          capacityBreakdown[type.db] = (capacityBreakdown[type.db] || 0) + cap;
          totalCapacity += cap;
        }
      });

      // 2. Map Pricing
      const pricingPayload = VEHICLE_TYPES
        .filter(type => newLot.vehicleTypes[type.id])
        .map(type => {
          const price = newLot.pricing[type.id] || {};
          return {
            vehicleType: type.db,
            hourly: Number(price.hourly) || null,
            daily: Number(price.daily) || null,
            monthly: Number(price.monthly) || null,
          };
        });

      // 3. Map Amenities
      const amenitiesList = [];
      if (newLot.amenities.covered) amenitiesList.push("Covered Parking");
      if (newLot.amenities.cctv) amenitiesList.push("CCTV / Security");
      if (newLot.amenities.access247) amenitiesList.push("24/7 Access");
      if (newLot.amenities.evCharging) amenitiesList.push("EV Charging");

      // 4. Create FormData
      const formData = new FormData();
      formData.append("name", newLot.name);
      formData.append("address", newLot.address);
      formData.append("city", localStorage.getItem("pe_city") || "Hubli");
      formData.append("latitude", newLot.latitude);
      formData.append("longitude", newLot.longitude);
      formData.append("hasEv", String(newLot.amenities.evCharging || newLot.vehicleTypes.evBike || newLot.vehicleTypes.evCar || newLot.vehicleTypes.evSuv));
      formData.append("totalCapacity", String(newLot.totalCapacity || totalCapacity)); // User input takes precedence
      formData.append("capacityBreakdown", JSON.stringify(capacityBreakdown));
      formData.append("amenities", JSON.stringify(amenitiesList));
      formData.append("pricing", JSON.stringify(pricingPayload));

      // Append images
      newLot.images.forEach((img) => {
        formData.append("images", img.file);
      });

      // Append Blueprint if exists
      if (newLot.blueprint) {
        formData.append("blueprint", newLot.blueprint);
      }

      await adminApi.addLot(formData);

      setShowAddModal(false);
      alert("Parking lot added successfully!");
      fetchLots();
      // Reset form
      // Reset form
      setNewLot({
        name: "",
        address: "",
        description: "",
        pricing: {},
        capacity: {},
        totalCapacity: "",
        blueprint: null,
        latitude: "",
        longitude: "",
        vehicleTypes: { bike: false, car: false, suv: false, bus: false, evBike: false, evCar: false, evSuv: false },
        amenities: { covered: false, evCharging: false, cctv: false, access247: false },
        images: [],
      });
    } catch (error) {
      console.error("Failed to add lot", error);
      let message = error.response?.data?.message || "Failed to add parking lot";
      if (error.response?.data?.issues) {
        message += "\n" + error.response.data.issues.map(i => `${i.path.join('.')}: ${i.message}`).join("\n");
      }
      alert(message);
    }
  };

  const handleEditLot = (lot) => {
    // Reconstruct pricing object
    const p = {};
    if (lot.pricing && Array.isArray(lot.pricing)) {
      lot.pricing.forEach(pr => {
        const type = VEHICLE_TYPES.find(vt => vt.db === pr.vehicleType || vt.id === pr.vehicleType);
        if (type) {
          p[type.id] = {
            hourly: pr.hourly || "",
            daily: pr.daily || "",
            monthly: pr.monthly || ""
          };
        }
      });
    }

    // Reconstruct capacity object
    const c = {};
    if (lot.capacityBreakdown) {
      Object.entries(lot.capacityBreakdown).forEach(([key, val]) => {
        const type = VEHICLE_TYPES.find(vt => vt.db === key);
        if (type) c[type.id] = val;
      });
    }

    // Reconstruct vehicleTypes booleans
    const vt = { ...newLot.vehicleTypes };
    // Set all to false first? Or keep defaults? Better to reset.
    Object.keys(vt).forEach(k => vt[k] = false);

    // Set true based on capacity or pricing existence
    Object.keys(c).forEach(k => vt[k] = true);
    Object.keys(p).forEach(k => vt[k] = true);

    // Reconstruct amenities
    const am = {
      covered: lot.amenities.includes("Covered Parking"),
      evCharging: lot.amenities.includes("EV Charging"),
      cctv: lot.amenities.includes("CCTV / Security"),
      access247: lot.amenities.includes("24/7 Access"),
    };

    setNewLot({
      lotId: lot.id, // Important for update
      name: lot.name,
      address: lot.address,
      description: "",
      city: lot.city || localStorage.getItem("pe_city") || "Hubli",
      pricing: p,
      capacity: c,
      latitude: lot.latitude,
      longitude: lot.longitude,
      vehicleTypes: vt,
      amenities: am,
      images: [], // Images not editable yet in this simple form, or just add new ones
    });
    setShowAddModal(true);
  };

  const menuItems = [
    {
      name: "Dashboard", icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      )
    },
    {
      name: "My Parking Spots", icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      )
    },
    {
      name: "Bookings", icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      )
    },
    {
      name: "Add New Spot", action: () => {
        setNewLot({
          name: "",
          address: "",
          description: "",
          pricing: {},
          capacity: {},
          latitude: "",
          longitude: "",
          vehicleTypes: { bike: false, car: false, suv: false, bus: false, evBike: false, evCar: false, evSuv: false },
          amenities: { covered: false, evCharging: false, cctv: false, access247: false },
          images: [],
          city: localStorage.getItem("pe_city") || "Hubli"
        });
        setShowAddModal(true);
      }, highlight: true, icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: "Earnings / Revenue", icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: "Reviews", icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      )
    },
    {
      name: "Help & Support", icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      )
    },
  ];

  return (
    <>
      <NavBar>
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0F172A]"></span>
            )}
          </button>

          {showNotifications && (
            <NotificationDropdown
              notifications={notifications}
              loading={loadingNotifications}
              onClose={() => setShowNotifications(false)}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDelete={handleDeleteNotification}
              onClearAll={handleClearAllNotifications}
            />
          )}
        </div>

        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-6 border-l border-white/10 hover:opacity-80 transition-opacity"
          >
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || 'Admin'}`}
              alt="User"
              className="h-9 w-9 rounded-full bg-gray-100 ring-2 ring-white/10"
            />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white">{user.name || 'Admin User'}</p>
              <p className="text-xs text-gray-400 capitalize">
                {user.role || 'Admin'} &bull; {localStorage.getItem("pe_city") || "hubli"}
              </p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-12 w-48 bg-[#1e293b] rounded-xl shadow-xl border border-white/10 py-1 z-50">
              <Link
                to="/admin/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                onClick={() => setShowProfileMenu(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5 text-left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </NavBar>

      <div className="flex min-h-[calc(100vh-80px)] bg-brandNight">
        {/* Sidebar */}
        <aside className="w-64 bg-brandIndigo border-r border-white/5 hidden md:flex flex-col">
          <div className="p-4 space-y-1 flex-1">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  if (item.action) item.action();
                  else setActiveTab(item.name);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${item.highlight
                  ? "bg-brandIris/10 text-brandIris hover:bg-brandIris/20"
                  : activeTab === item.name
                    ? "text-white bg-white/5"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                {item.icon}
                {item.name}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 py-8 px-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">{activeTab}</h1>
                <p className="text-gray-400 mt-1">Manage your parking lots</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="md:hidden px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
              >
                Add Parking Slot
              </button>
            </header>

            {activeTab === "Dashboard" || activeTab === "My Parking Spots" ? (
              <section className="bg-brandIndigo rounded-2xl shadow-sm border border-white/5 p-6">
                <h2 className="text-xl font-bold text-white mb-6">Your Parking Lots</h2>
                <div className="space-y-4">
                  {lots.length > 0 ? (
                    lots.map((lot) => (
                      <div
                        key={lot.id}
                        onClick={() => setSelectedLot(lot)}
                        className="p-4 rounded-xl border border-white/5 hover:border-brandSky/30 hover:bg-white/5 transition-all group cursor-pointer flex gap-4"
                      >
                        {/* Image Thumbnail */}
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-white/10">
                          {lot.images && lot.images.length > 0 ? (
                            <img
                              src={lot.images[0].startsWith('http') || lot.images[0].startsWith('data:') ? lot.images[0] : `${API_BASE}${lot.images[0]}`}
                              alt={lot.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg text-white group-hover:text-brandSky transition-colors">{lot.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 rounded-full bg-brandSky/10 text-brandSky border border-brandSky/20 font-medium h-fit">
                                {lot.city}
                              </span>
                              <div className="flex gap-1 ml-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditLot(lot);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                  title="Edit Spot"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.691 1.127l-2.685.8.8-2.685a4.5 4.5 0 011.127-1.691L16.862 4.487zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLot(lot.id);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                  title="Delete Spot"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 mb-3">{lot.address}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1.5 bg-brandNight px-2 py-1 rounded-md border border-white/10">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Capacity: {lot.total_capacity}
                            </span>
                            {lot.has_ev && (
                              <span className="flex items-center gap-1.5 bg-brandNight px-2 py-1 rounded-md border border-white/10">
                                <span className="w-1.5 h-1.5 rounded-full bg-brandSky"></span>
                                EV Support
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                    ))
                  ) : (
                    <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
                      <p className="text-gray-400">No parking lots created yet.</p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="text-brandSky font-medium mt-2 hover:underline"
                      >
                        Create your first lot
                      </button>
                    </div>
                  )}
                </div>
              </section>
            ) : activeTab === "Bookings" ? (
              <section className="bg-[#1e293b] rounded-2xl shadow-sm border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-gray-200 font-semibold border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4">Spot Name</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Time Slot</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {bookings.length > 0 ? (
                        bookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{booking.spotName}</td>
                            <td className="px-6 py-4">{booking.customerName}</td>
                            <td className="px-6 py-4">{booking.date}</td>
                            <td className="px-6 py-4">{booking.timeSlot}</td>
                            <td className="px-6 py-4 font-medium text-white">₹{booking.amount}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400' :
                                booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                  'bg-red-500/10 text-red-400'
                                }`}>
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                            No bookings found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : activeTab === "Earnings / Revenue" ? (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/10 shadow-sm">
                    <p className="text-sm text-gray-400 mb-1">Total Revenue (30 Days)</p>
                    <h3 className="text-3xl font-bold text-white">₹{earnings?.totalRevenue || 0}</h3>
                  </div>
                  <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/10 shadow-sm">
                    <p className="text-sm text-gray-400 mb-1">Total Bookings (30 Days)</p>
                    <h3 className="text-3xl font-bold text-white">{earnings?.totalBookings || 0}</h3>
                  </div>
                </div>

                {/* Daily Breakdown */}
                <section className="bg-[#1e293b] rounded-2xl shadow-sm border border-white/10 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Daily Earnings</h3>
                  <div className="space-y-3">
                    {earnings?.daily?.length > 0 ? (
                      earnings.daily.map((day, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/10">
                          <div>
                            <p className="font-medium text-white">{new Date(day.date).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-400">{day.bookingscount} bookings</p>
                          </div>
                          <p className="font-bold text-white">₹{day.amount}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No earnings data available for the last 30 days.</p>
                    )}
                  </div>
                </section>
              </div>
            ) : activeTab === "Reviews" ? (
              <section className="bg-[#1e293b] rounded-2xl shadow-sm border border-white/10 p-6">
                <h2 className="text-xl font-bold text-white mb-6">Reviews</h2>
                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-xl border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-white">{review.lotName}</h4>
                            <div className="flex items-center gap-1 text-yellow-400 text-sm">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={i < review.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth={i < review.rating ? 0 : 1.5} className="w-4 h-4">
                                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">"{review.comment}"</p>
                        <p className="text-xs text-gray-500 font-medium">- {review.userName}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No reviews yet.
                    </div>
                  )}
                </div>
              </section>
            ) : activeTab === "Help & Support" ? (
              <section className="bg-[#1e293b] rounded-2xl shadow-sm border border-white/10 p-8 max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white">How can we help?</h2>
                  <p className="text-gray-400 mt-2">Send us a message and we'll get back to you as soon as possible.</p>
                </div>

                <form onSubmit={handleSupportSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Subject</label>
                    <input
                      type="text"
                      className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g., Issue with payments"
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Message</label>
                    <textarea
                      rows="5"
                      className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                      placeholder="Describe your issue..."
                      value={supportForm.message}
                      onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                      required
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={supportSubmitting}
                    className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70"
                  >
                    {supportSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </section>
            ) : null}
          </div>
        </main >
      </div >

      {/* Add Lot Modal - Redesigned */}
      {
        showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="bg-[#1e293b] rounded-3xl p-8 w-full max-w-2xl space-y-6 shadow-2xl my-8 relative border border-white/10">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-white">
                    {newLot.lotId ? "Modify Parking Spot" : "Add New Parking Spot"}
                  </h2>
                  <p className="text-gray-400">Fill in the details below to {newLot.lotId ? "update the" : "list a new"} parking spot</p>
                </div>

                <form onSubmit={handleAddLot} className="space-y-6">

                  {/* Spot Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Spot Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Downtown Spot A1"
                      className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={newLot.name}
                      onChange={(e) => setNewLot({ ...newLot, name: e.target.value })}
                      required
                    />
                  </div>

                  {/* City (Read-Only) */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">City</label>
                    <input
                      type="text"
                      disabled
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                      value={localStorage.getItem("pe_city") || "Hubli"}
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Location *</label>
                    <input
                      type="text"
                      placeholder="e.g., 123 Main Street, Downtown"
                      className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={newLot.address}
                      onChange={(e) => setNewLot({ ...newLot, address: e.target.value })}
                      required
                    />
                  </div>

                  {/* Total Capacity & Blueprint */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300">Total Parking Spots *</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g., 50"
                        className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={newLot.totalCapacity || ''}
                        onChange={(e) => setNewLot({ ...newLot, totalCapacity: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300">Parking Blueprint</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-2.5 text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            setNewLot({ ...newLot, blueprint: e.target.files[0] });
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Coordinates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300">Latitude *</label>
                      <input
                        type="text"
                        placeholder="e.g., 12.9716"
                        className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={newLot.latitude}
                        onChange={(e) => setNewLot({ ...newLot, latitude: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300">Longitude *</label>
                      <input
                        type="text"
                        placeholder="e.g., 77.5946"
                        className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={newLot.longitude}
                        onChange={(e) => setNewLot({ ...newLot, longitude: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Location Map Helper Link */}
                  <div className="text-right -mt-4">
                    <a
                      href="https://www.google.com/maps"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Open Google Maps to find coordinates
                    </a>
                  </div>

                  {/* Allowed Vehicle Types */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-300">Allowed Vehicle Types *</label>
                    <p className="text-xs text-gray-400 -mt-2 mb-2">Select which types of vehicles can park in this spot</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Regular Vehicles */}
                      <div className="p-4 rounded-xl border border-white/10 space-y-3">
                        <h4 className="text-sm font-medium text-blue-400">Regular Vehicles</h4>
                        <div className="space-y-2">
                          {VEHICLE_TYPES.filter(t => t.group === 'regular').map(type => (
                            <label key={type.id} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                                checked={newLot.vehicleTypes[type.id]}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  setNewLot(prev => ({
                                    ...prev,
                                    vehicleTypes: { ...prev.vehicleTypes, [type.id]: isChecked },
                                    // Initialize pricing if checked, else keep it (or remove it, but keeping is safer)
                                    pricing: {
                                      ...prev.pricing,
                                      [type.id]: isChecked ? (prev.pricing[type.id] || { hourly: "", daily: "", monthly: "" }) : prev.pricing[type.id]
                                    }
                                  }));
                                }}
                              />
                              <span className="text-sm text-gray-300">{type.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* EV Vehicles */}
                      <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
                        <h4 className="text-sm font-medium text-green-400 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Electric Vehicles (EV)
                        </h4>
                        <div className="space-y-2">
                          {VEHICLE_TYPES.filter(t => t.group === 'ev').map(type => (
                            <label key={type.id} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-600 focus:ring-green-500"
                                checked={newLot.vehicleTypes[type.id]}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  setNewLot(prev => ({
                                    ...prev,
                                    vehicleTypes: { ...prev.vehicleTypes, [type.id]: isChecked },
                                    pricing: {
                                      ...prev.pricing,
                                      [type.id]: isChecked ? (prev.pricing[type.id] || { hourly: "", daily: "", monthly: "" }) : prev.pricing[type.id]
                                    }
                                  }));
                                }}
                              />
                              <span className="text-sm text-gray-300">{type.label}</span>
                            </label>
                          ))}
                        </div>
                        {/* EV Note */}
                        <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
                          <span className="text-yellow-500 text-xs">💡</span>
                          <p className="text-xs text-yellow-500">
                            Consider enabling "EV Charging" in features below
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing for Selected Vehicle Types */}
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-gray-300">Pricing for Selected Vehicle Types *</label>
                    <p className="text-xs text-gray-400 -mt-3">Set pricing for each vehicle type. At least hourly pricing is required.</p>

                    {VEHICLE_TYPES.filter(type => newLot.vehicleTypes[type.id]).length === 0 && (
                      <div className="text-sm text-gray-500 italic p-4 bg-white/5 rounded-xl border border-dashed border-white/10 text-center">
                        Select vehicle types above to set pricing
                      </div>
                    )}

                    <div className="space-y-4">
                      {VEHICLE_TYPES.filter(type => newLot.vehicleTypes[type.id]).map(type => (
                        <div key={type.id} className={`p-4 rounded-xl border ${type.group === 'ev' ? 'border-green-500/20 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
                          <div className="flex items-center gap-2 mb-3">
                            {type.group === 'ev' && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
                            <h4 className={`text-sm font-medium ${type.group === 'ev' ? 'text-green-400' : 'text-gray-200'}`}>{type.label}</h4>
                          </div>

                          <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs text-gray-400">Capacity *</label>
                              <input
                                type="number"
                                min="1"
                                placeholder="10"
                                className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={newLot.capacity[type.id] || ""}
                                onChange={(e) => setNewLot(prev => ({
                                  ...prev,
                                  capacity: {
                                    ...prev.capacity,
                                    [type.id]: e.target.value
                                  }
                                }))}
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-gray-400">Per Hour (₹) *</label>
                              <input
                                type="number"
                                min="0"
                                placeholder="10"
                                className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={newLot.pricing[type.id]?.hourly || ""}
                                onChange={(e) => setNewLot(prev => ({
                                  ...prev,
                                  pricing: {
                                    ...prev.pricing,
                                    [type.id]: { ...prev.pricing[type.id], hourly: e.target.value }
                                  }
                                }))}
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-gray-400">Per Day (₹)</label>
                              <input
                                type="number"
                                min="0"
                                placeholder="50"
                                className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={newLot.pricing[type.id]?.daily || ""}
                                onChange={(e) => setNewLot(prev => ({
                                  ...prev,
                                  pricing: {
                                    ...prev.pricing,
                                    [type.id]: { ...prev.pricing[type.id], daily: e.target.value }
                                  }
                                }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-gray-400">Per Month (₹)</label>
                              <input
                                type="number"
                                min="0"
                                placeholder="800"
                                className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={newLot.pricing[type.id]?.monthly || ""}
                                onChange={(e) => setNewLot(prev => ({
                                  ...prev,
                                  pricing: {
                                    ...prev.pricing,
                                    [type.id]: { ...prev.pricing[type.id], monthly: e.target.value }
                                  }
                                }))}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Images */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Parking Spot Images</label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />

                    {newLot.images.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {newLot.images.map((img, index) => (
                          <div key={index} className="relative aspect-video rounded-xl overflow-hidden group border border-white/10">
                            <img src={img.preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <div
                          onClick={() => fileInputRef.current.click()}
                          className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 hover:bg-white/5 transition-all aspect-video"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400 mb-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          <span className="text-xs text-gray-400 font-medium">Add More</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current.click()}
                        className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 hover:bg-white/5 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400 mb-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <p className="text-sm text-gray-400 font-medium">Click to upload images</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 10MB each</p>
                      </div>
                    )}
                  </div>

                  {/* Features & Amenities */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-300">Features & Amenities</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">Covered Parking</p>
                          <p className="text-xs text-gray-500">Protected from weather</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={newLot.amenities.covered}
                            onChange={(e) => setNewLot({ ...newLot, amenities: { ...newLot.amenities, covered: e.target.checked } })}
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">EV Charging</p>
                          <p className="text-xs text-gray-500">Electric vehicle charging available</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={newLot.amenities.evCharging}
                            onChange={(e) => setNewLot({ ...newLot, amenities: { ...newLot.amenities, evCharging: e.target.checked } })}
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">Security/CCTV</p>
                          <p className="text-xs text-gray-500">Video surveillance installed</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={newLot.amenities.cctv}
                            onChange={(e) => setNewLot({ ...newLot, amenities: { ...newLot.amenities, cctv: e.target.checked } })}
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">24/7 Access</p>
                          <p className="text-xs text-gray-500">Available anytime</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={newLot.amenities.access247}
                            onChange={(e) => setNewLot({ ...newLot, amenities: { ...newLot.amenities, access247: e.target.checked } })}
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-6 py-2 rounded-xl text-gray-300 hover:bg-white/5 font-medium border border-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      {newLot.lotId ? "Update Spot" : "Add Parking Spot"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
      {/* View Lot Details Modal */}
      {
        selectedLot && (
          <AdminLotDetailsModal
            lot={selectedLot}
            onClose={() => setSelectedLot(null)}
          />
        )
      }
    </>
  );
}
