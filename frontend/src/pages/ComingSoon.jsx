// src/pages/ComingSoon.jsx
import { Link } from "react-router-dom";
import NavBar from "../components/Navbar";

export default function ComingSoon() {
    return (
        <>
            <NavBar />
            <main className="min-h-screen bg-brandNight flex flex-col items-center justify-center text-center px-6">
                <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brandSky to-brandIris mb-6">
                    Coming Soon
                </h1>
                <p className="text-xl text-brandSand/80 max-w-2xl mb-12">
                    We are expanding rapidly! ParkEasy will be available in your city very soon.
                </p>
                <Link
                    to="/"
                    className="px-8 py-3 rounded-xl bg-brandSky text-brandNight font-semibold hover:bg-brandSky/90 transition-colors shadow-lg shadow-brandSky/20"
                >
                    Go Back Home
                </Link>
            </main>
        </>
    );
}
