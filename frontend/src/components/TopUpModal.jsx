import { useState } from 'react';
import api from '../services/api';

export default function TopUpModal({ onClose, onSuccess }) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTopUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Simulate Payment Flow
            const confirm = window.confirm(`Simulating UPI Payment of ₹${amount}. Proceed?`);
            if (!confirm) {
                setLoading(false);
                return;
            }

            await api.post('/user/wallet/topup', { amount: parseInt(amount) });
            alert(`Successfully added ${amount} Tokens!`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Top up failed", error);
            alert("Failed to top up wallet.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-brandIndigo rounded-3xl w-full max-w-sm p-6 border border-white/10 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-brandSky/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brandSky">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                            <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
                            <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">Top Up Wallet</h2>
                    <p className="text-gray-400 text-sm mt-1">1 INR = 1 Token</p>
                </div>

                <form onSubmit={handleTopUp} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Amount (INR)</label>
                        <input
                            type="number"
                            min="1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount, e.g. 100"
                            className="w-full bg-brandNight border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brandSky focus:outline-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brandSky text-brandNight font-bold py-3 rounded-xl hover:bg-brandSky/90 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : `Pay ₹${amount || '0'} via UPI`}
                    </button>
                </form>
            </div>
        </div>
    );
}
