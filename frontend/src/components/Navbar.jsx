import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg";

export default function Navbar({ children }) {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-brandNight/80 border-b border-white/10">
      <div className="max-w-6xl mx-auto flex items-center justify-between py-4 px-6">
        <Link
          to="/"
          className="flex items-center gap-3 text-2xl font-semibold text-white tracking-tight"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brandSky to-brandIris shadow-glow">
            <img src={logo} alt="ParkEasy" className="w-6 h-6" />
          </span>
          ParkEasy
        </Link>
        {children && <div className="flex items-center gap-6">{children}</div>}
      </div>
    </header>
  );
}
