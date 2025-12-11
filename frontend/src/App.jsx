// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import AuthScreen from './pages/AuthScreen';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminProfile from './pages/AdminProfile';
import ComingSoon from './pages/ComingSoon';
import UserProfile from './pages/UserProfile';
import UserBookings from './pages/UserBookings';

import UserFavorites from "./pages/UserFavorites";
import ParkingDetails from "./pages/ParkingDetails";
import AboutUs from "./pages/AboutUs";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/bookings" element={<UserBookings />} />
        <Route path="/favorites" element={<UserFavorites />} />
        <Route path="/parking/:id" element={<ParkingDetails />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/dashboard" element={<Navigate to="/user" replace />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}