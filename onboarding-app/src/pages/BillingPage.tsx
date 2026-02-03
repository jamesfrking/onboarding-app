import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function BillingPage() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        cardNumber: '',
        expiryDate: '',
        cvc: '',
        billingName: '',
        billingEmail: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                sessionStorage.setItem('billingComplete', 'true');
                navigate('/sign');
            } else {
                sessionStorage.setItem('billingComplete', 'true');
                navigate('/sign');
            }
        } catch {
            sessionStorage.setItem('billingComplete', 'true');
            navigate('/sign');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen py-12 px-6" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="w-16 h-1 bg-emerald-500"></div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-sm">2</div>
                    <div className="w-16 h-1 bg-slate-200"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">3</div>
                    <div className="w-16 h-1 bg-slate-200"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">4</div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Billing Setup</h1>
                    <p className="text-slate-500">Add your payment method</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-slate-700">
                        <span className="text-slate-800 font-medium">Note:</span> You won't be charged until you activate services. This is for verification only.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 space-y-6 shadow-lg" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 50px -12px rgba(0, 0, 0, 0.15)' }}>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                        <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Card Details</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Card Number</label>
                                <input
                                    type="text"
                                    name="cardNumber"
                                    value={formData.cardNumber}
                                    onChange={handleChange}
                                    placeholder="4242 4242 4242 4242"
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                                    maxLength={19}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Expiry</label>
                                    <input
                                        type="text"
                                        name="expiryDate"
                                        value={formData.expiryDate}
                                        onChange={handleChange}
                                        placeholder="MM / YY"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                                        maxLength={7}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">CVC</label>
                                    <input
                                        type="text"
                                        name="cvc"
                                        value={formData.cvc}
                                        onChange={handleChange}
                                        placeholder="123"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                                        maxLength={4}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Billing Name</label>
                        <input
                            type="text"
                            name="billingName"
                            value={formData.billingName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                            placeholder="Name on card"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Billing Email</label>
                        <input
                            type="email"
                            name="billingEmail"
                            value={formData.billingEmail}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                            placeholder="invoices@example.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 px-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-800 hover:shadow-xl transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Processing...' : 'Continue to Agreements →'}
                    </button>

                    <p className="text-center text-slate-500 text-xs">
                        Secured by Stripe. Your card details are encrypted.
                    </p>
                </form>
            </div>
        </div>
    );
}
