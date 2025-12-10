// src/pages/AuthScreen.jsx
import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { authApi } from '../services/api.js';

const fields = {
  signup: [
    { id: 'name', label: 'Full Name' },
    { id: 'email', label: 'Email Address' },
    { id: 'password', label: 'Password', type: 'password' },
    { id: 'phone', label: 'Contact Number' },
  ],
  login: [
    { id: 'email', label: 'Email Address' },
    { id: 'password', label: 'Password', type: 'password' },
  ],
};

export default function AuthScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const role = params.get('role') || 'user';
  const [mode, setMode] = useState('login');
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const title = useMemo(
    () => (role === 'admin' ? 'Admin Portal' : 'User Portal'),
    [role]
  );
  const subtitle =
    role === 'admin'
      ? 'Manage slot inventory, pricing, amenities, and vehicle analytics.'
      : 'Book verified parking spots with flexible plans and EV filters.';

  useEffect(() => {
    setFormValues({ name: '', email: '', password: '', phone: '' });
    setErrorMessage('');
    setSuccessMessage('');
  }, [mode, role]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const payload =
        mode === 'signup'
          ? {
            fullName: formValues.name,
            email: formValues.email,
            password: formValues.password,
            phone: formValues.phone || undefined,
            upiId: formValues.upiId,
            role,
          }
          : {
            email: formValues.email,
            password: formValues.password,
          };

      const response =
        mode === 'signup'
          ? await authApi.signup(payload)
          : await authApi.login(payload);

      const { token, user } = response;
      localStorage.setItem('pe_token', token);
      localStorage.setItem('pe_user', JSON.stringify(user));

      console.log("Login successful:", user);

      if (mode === 'signup') {
        setSuccessMessage('Account created! Redirecting...');
      }

      const userRole = (user.role || '').toLowerCase();
      console.log("Redirecting based on role:", userRole);

      // Enforce Admin Role Check
      if (role === 'admin' && userRole !== 'admin') {
        throw new Error("Access Denied: You are not an admin.");
      }

      // Enforce User Role Check
      if (role === 'user' && userRole === 'admin') {
        throw new Error("Access Denied: Please use the Admin Portal.");
      }

      const destination = userRole === 'admin' ? '/admin' : '/user';
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, mode === 'signup' ? 800 : 0);
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Something went wrong";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <main className="relative min-h-screen py-16 px-4 bg-brandNight text-brandSand">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-brandSky/30 blur-[160px]" />
          <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-brandIris/40 blur-[220px]" />
        </div>
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10">
          <section className="rounded-[32px] border border-white/15 bg-white/5 backdrop-blur-2xl p-10 space-y-6 shadow-glow">
            <p className="uppercase text-xs tracking-[0.4em] text-brandSky">
              {role.toUpperCase()} ACCESS
            </p>
            <h1 className="text-4xl font-semibold">{title}</h1>
            <p className="text-white/70">{subtitle}</p>
            <ul className="space-y-4 text-sm text-white/80">
              <li className="flex items-start gap-3">
                <span className="h-2.5 w-2.5 mt-2 rounded-full bg-brandSky" />
                Secure OTP and document verification for every admin account.
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2.5 w-2.5 mt-2 rounded-full bg-brandSky" />
                Pricing logic split by vehicle and duration with live controls.
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2.5 w-2.5 mt-2 rounded-full bg-brandSky" />
                Booking analytics, heatmaps, and EV-only visibility boosts.
              </li>
            </ul>
          </section>

          <section className="rounded-[32px] bg-brandIndigo p-10 text-white shadow-2xl space-y-6 border border-white/5">
            <div className="flex gap-4 bg-brandNight/50 rounded-2xl p-1">
              {['login', 'signup'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMode(tab)}
                  className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${mode === tab
                    ? 'bg-brandIris text-white shadow-glow'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {tab === 'login' ? 'Login' : 'Create Account'}
                </button>
              ))}
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {fields[mode].map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {field.label}
                    {role === 'admin' && field.id === 'email' && (
                      <span className="text-brandIris ml-1">*</span>
                    )}
                  </label>
                  <input
                    type={field.type || "text"}
                    className="w-full border border-white/10 rounded-2xl px-4 py-3 bg-brandNight text-white placeholder-gray-500 focus:ring-2 focus:ring-brandIris focus:outline-none focus:border-transparent transition-all"
                    placeholder={field.label}
                    name={field.id}
                    value={formValues[field.id] || ""}
                    onChange={handleChange}
                    required={field.id !== "phone"}
                  />
                </div>
              ))}

              {role === 'admin' && mode === 'signup' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      UPI ID (for receiving payments) <span className="text-brandIris">*</span>
                    </label>
                    <input
                      type="text"
                      name="upiId"
                      value={formValues.upiId || ""}
                      onChange={handleChange}
                      placeholder="e.g. username@upi"
                      className="w-full border border-white/10 rounded-2xl px-4 py-3 bg-brandNight text-white placeholder-gray-500 focus:ring-2 focus:ring-brandIris focus:outline-none focus:border-transparent transition-all"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This ID will be used to receive payments from customers.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">
                      Parking Space Documents
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        className="w-full border border-dashed border-white/20 rounded-2xl px-4 py-8 text-sm text-gray-400 bg-brandNight/50"
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.3em] text-gray-500 pointer-events-none">
                        Upload PDFs / Images
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <p className="text-sm text-rose-500 font-medium">{errorMessage}</p>
              )}
              {successMessage && (
                <p className="text-sm text-emerald-600 font-medium">{successMessage}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brandSky text-brandNight font-semibold py-3 rounded-2xl hover:bg-brandIris hover:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Sign In Securely"
                    : "Create Account"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
