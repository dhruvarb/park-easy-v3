import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import NotificationDropdown from "./NotificationDropdown";
import logo from "../assets/logo.svg";

import TopUpModal from "./TopUpModal";

export default function UserHeader() {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    // Wallet State
    const [walletBalance, setWalletBalance] = useState(0);
    const [showTopUp, setShowTopUp] = useState(false);

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef(null);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("pe_token");
        localStorage.removeItem("pe_user");
        navigate("/login");
    };

    useEffect(() => {
        fetchNotifications();
        fetchBalance();
        // Poll for new notifications and balance every minute
        const interval = setInterval(() => {
            fetchNotifications();
            fetchBalance();
        }, 30000); // Increased frequency to 30s

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

    const fetchBalance = async () => {
        try {
            const res = await api.get('/user/wallet/balance');
            setWalletBalance(res.tokens);
        } catch (error) {
            console.error("Failed to fetch balance", error);
        }
    };

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

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-brandNight/80 backdrop-blur-md border-b border-white/5">
            <Link to="/" className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brandSky to-brandIris shadow-glow">
                    <img src={logo} alt="ParkEasy" className="w-6 h-6" />
                </span>
                <span className="text-xl font-bold text-white">ParkEasy</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
                <Link
                    to="/user"
                    className={`text-sm font-medium transition-colors ${isActive('/user') ? 'text-brandSky' : 'text-gray-400 hover:text-white'}`}
                >
                    Find Parking
                </Link>
                <Link
                    to="/bookings"
                    className={`text-sm font-medium transition-colors ${isActive('/bookings') ? 'text-brandSky' : 'text-gray-400 hover:text-white'}`}
                >
                    My Bookings
                </Link>
                <Link
                    to="/about"
                    className={`text-sm font-medium transition-colors ${isActive('/about') ? 'text-brandSky' : 'text-gray-400 hover:text-white'}`}
                >
                    About Us
                </Link>
            </nav>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors relative"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                            />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-brandIris text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-brandNight">
                                {unreadCount}
                            </span>
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
                    <div className="flex items-center gap-4">
                        {/* Wallet Badge */}
                        <div className="flex items-center gap-2 bg-brandNight/50 border border-white/10 px-3 py-1.5 rounded-full">
                            <span className="text-xl">🪙</span>
                            <span className="text-sm font-bold text-brandUnicorn">{walletBalance}</span>
                            <button
                                onClick={() => setShowTopUp(true)}
                                className="ml-2 text-xs bg-brandSky text-brandNight px-2 py-0.5 rounded-md font-bold hover:bg-brandSky/90"
                            >
                                +
                            </button>
                        </div>

                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-2 focus:outline-none"
                        >
                            <div className="w-10 h-10 rounded-full bg-brandIndigo overflow-hidden border-2 border-white/10 shadow-sm">
                                <img
                                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                                    alt="User"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="hidden md:block text-sm font-medium text-white">Profile</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>

                        {showProfileMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-brandIndigo rounded-xl shadow-xl border border-white/10 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-2 border-b border-white/5">
                                    <p className="text-sm font-semibold text-white">My Account</p>
                                </div>
                                <Link
                                    to="/bookings"
                                    className="md:hidden flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                                    onClick={() => setShowProfileMenu(false)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" />
                                    </svg>
                                    My Bookings
                                </Link>
                                <Link
                                    to="/about"
                                    className="md:hidden flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                                    onClick={() => setShowProfileMenu(false)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                    </svg>
                                    About Us
                                </Link>
                                <Link
                                    to="/profile"
                                    className="block px-4 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                                    onClick={() => setShowProfileMenu(false)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                    View Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} onSuccess={fetchBalance} />}
        </header>
    );
}
