
import React from 'react';
import UserHeader from '../components/UserHeader';

export default function AboutUs() {
    return (
        <div className="min-h-screen bg-brandNight">
            <UserHeader />

            <main className="pt-24 pb-12 px-6">
                <div className="max-w-4xl mx-auto space-y-12 text-center text-white">

                    {/* Hero Section */}
                    <div className="space-y-6">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-brandSky to-brandIris bg-clip-text text-transparent">
                            Revolutionizing Urban Parking
                        </h1>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                            ParkEasy isn't just an app; it's a movement to reclaim our cities from the chaos of congestion. We connect drivers with spaces in real-time, making every journey smoother.
                        </p>
                    </div>

                    {/* Mission Grid */}
                    <div className="grid md:grid-cols-3 gap-8 mt-16 text-left">
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-brandSky/30 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-brandSky/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-brandSky">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Save Time</h3>
                            <p className="text-gray-400">
                                Stop circling the block. Reserve your spot in seconds and get straight to your destination.
                            </p>
                        </div>

                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-brandIris/30 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-brandIris/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-brandIris">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Guaranteed Spots</h3>
                            <p className="text-gray-400">
                                Book with confidence. Your space is secured the moment you confirm your reservation.
                            </p>
                        </div>

                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-emerald-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Go Green</h3>
                            <p className="text-gray-400">
                                Less time idling means fewer emissions. Drive directly to your spot and help the planet.
                            </p>
                        </div>
                    </div>

                    {/* Story Section */}
                    <div className="mt-24 text-left bg-gradient-to-b from-white/5 to-transparent p-8 md:p-12 rounded-3xl border border-white/5">
                        <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                        <div className="space-y-4 text-gray-300">
                            <p>
                                Founded in 2024, ParkEasy started with a simple frustration: arriving late to a meeting because of parking. We realized that while navigation apps were great at getting us 99% of the way there, the last 1%—finding a place to stop—was a nightmare.
                            </p>
                            <p>
                                We built a team of engineers and city planners dedicated to solving this last-mile problem. Today, we operate in major cities, analyzing traffic patterns and parking density to create a seamless experience for thousands of drivers every day.
                            </p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
