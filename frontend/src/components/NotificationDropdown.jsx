import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";

export default function NotificationDropdown({
    notifications,
    onClose,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
    onClearAll,
    loading
}) {
    const dropdownRef = useRef(null);

    useEffect(() => {
        // Close on click outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Group notifications
    const grouped = notifications.reduce((acc, note) => {
        const date = new Date(note.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let key = "Older";
        if (date.toDateString() === today.toDateString()) key = "Today";
        else if (date.toDateString() === yesterday.toDateString()) key = "Yesterday";

        if (!acc[key]) acc[key] = [];
        acc[key].push(note);
        return acc;
    }, {});

    const groups = ["Today", "Yesterday", "Older"].filter(key => grouped[key]?.length > 0);

    const getIcon = (type) => {
        switch (type) {
            case 'booking_reminder':
                return (
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case 'promotion':
                return (
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h17.25c.939 0 1.705.69 1.838 1.619.08.558.08 1.127 0 1.685-.133.929-.9 1.619-1.838 1.619H3.375c-.939 0-1.705-.69-1.838-1.619a26.06 26.06 0 010-1.685c.133-.929.9-1.619 1.838-1.619z" />
                        </svg>
                    </div>
                );
            case 'payment_confirmed':
                return (
                    <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center border border-green-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 rounded-full bg-white/5 text-gray-400 flex items-center justify-center border border-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                    </div>
                );
        }
    };

    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div ref={dropdownRef} className="absolute right-0 top-12 w-96 bg-brandIndigo rounded-2xl shadow-xl border border-white/10 z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-brandIndigo">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-lg">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="bg-brandSky/20 text-brandSky text-xs font-bold px-2 py-0.5 rounded-full border border-brandSky/30">
                            {unreadCount} new
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button onClick={onMarkAllAsRead} className="text-sm font-semibold text-brandSand hover:text-white">
                        Mark all as read
                    </button>
                )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No notifications</div>
                ) : (
                    groups.map(group => (
                        <div key={group}>
                            <div className="px-4 py-2 bg-brandNight/50 text-xs font-semibold text-gray-400 uppercase tracking-wider sticky top-0 backdrop-blur-sm">
                                {group}
                            </div>
                            <div>
                                {grouped[group].map(note => (
                                    <div key={note.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors relative group ${!note.is_read ? 'bg-brandSky/5' : ''}`}>
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                {getIcon(note.type)}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className={`text-sm font-semibold ${!note.is_read ? 'text-white' : 'text-gray-400'}`}>
                                                        {note.title}
                                                    </h4>
                                                    {!note.is_read && (
                                                        <span className="w-2 h-2 bg-brandSky rounded-full flex-shrink-0 mt-1.5 ml-2 shadow-[0_0_8px_rgba(63,140,255,0.6)]"></span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">
                                                    {note.message}
                                                </p>

                                                {note.action_label && note.action_url && (
                                                    <Link
                                                        to={note.action_url}
                                                        onClick={onClose}
                                                        className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                                                    >
                                                        {note.action_label}
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                        </svg>
                                                    </Link>
                                                )}

                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-gray-500">
                                                        {getTimeAgo(note.created_at)}
                                                    </span>
                                                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {!note.is_read && (
                                                            <button
                                                                onClick={() => onMarkAsRead(note.id)}
                                                                className="text-xs font-medium text-gray-400 hover:text-brandSky flex items-center gap-1"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                                </svg>
                                                                Mark read
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => onDelete(note.id)}
                                                            className="text-gray-500 hover:text-red-400"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="p-3 border-t border-white/5 bg-brandIndigo">
                    <button
                        onClick={onClearAll}
                        className="w-full py-2 text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5 transition-all"
                    >
                        Clear All
                    </button>
                </div>
            )}
        </div>
    );
}
