import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import AddCardModal from './AddCardModal';

// Icons
const CreditCardIcon = () => (
    <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
);
const NoCardIcon = () => (
    <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);
const VisaIcon = () => (
    <svg className="w-12 h-auto" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg"><g fill="none"><path fill="#282828" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/><path fill="#fff" d="M14.3 18.5c.3.2.7.3 1.2.3.8 0 1.3-.2 1.3-.8 0-.4-.2-.6-.9-.8-.7-.2-2.4-.7-2.4-2.2 0-1 .8-1.7 2.2-1.7.6 0 1.2.2 1.6.4l-.3 1c-.3-.2-.7-.3-1.1-.3-.5 0-.8.2-.8.6s.3.5.9.7c.8.2 2.5.7 2.5 2.3 0 1.7-1.5 2-2.8 2-.8 0-1.4-.2-1.7-.4l.4-1.1zm7.2-6.3h-1.6c-.5 0-.8.3-1 .8l-2.8 5.4h1.9l.5-1.1h2.4l.3 1.1h1.8l-2.4-6.2zm-1.1 4.1h-1.4l.7-2 1.1-.1.4 2.1h-1.2zm-10-4.1h-1.8l-1.3 6.2h1.8l.2-1.2h1.6l.3 1.2h1.8l-1.6-6.2zm-1 .9c.2 1.3.4 2.2.5 2.7h-1c.2-.5.3-1.4.5-2.7z"/></g></svg>
);


const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [savedCards, setSavedCards] = useState([]);

    const { plan, billingCycle } = location.state || {};
    
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phone: '', company: '',
        address: '', zip: '', city: '', state: '', country: 'Canada',
    });
    
    const [promoCode, setPromoCode] = useState('');

    useEffect(() => {
        if (!plan) {
            navigate('/upgrade-plan');
        }
    }, [plan, navigate]);
    
    useEffect(() => {
        if (isModalOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isModalOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddCard = (cardDetails) => {
        const newCard = { id: Date.now(), type: 'Visa', last4: cardDetails.number.slice(-4) };
        setSavedCards(prev => [...prev, newCard]);
        setIsModalOpen(false);
    };
    
    const subtotal = plan ? parseFloat(plan.price) : 0;
    const tax = 0;
    const total = subtotal + tax;

    // --- Reusable Components for clean code ---
    const inputClasses = "block w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg shadow-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-600 transition-shadow";
    const labelClasses = "block text-sm font-semibold text-gray-600 mb-2";

    const OrderSummary = () => (
        <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
                <div className="space-y-4 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Package Name</span><span className="font-semibold text-gray-900">{plan?.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">User Email</span><span className="font-semibold text-gray-900 break-all">{formData.email || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Billing Cycle</span><span className="font-semibold text-gray-900">{billingCycle}</span></div>
                </div>
                <div className="border-t border-gray-200 my-6"></div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Cart Totals</h2>
                <div className="space-y-4 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Tax</span><span className="font-semibold text-gray-900">${tax.toFixed(2)}</span></div>
                </div>
                <div className="mt-4"><label className="block text-sm font-medium text-gray-700">Do you have a promo code?</label><div className="mt-1 flex"><input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="flex-1 block w-full border-gray-300 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Enter coupon code"/><button className="px-4 py-2 bg-gray-200 text-gray-600 rounded-r-md text-sm font-medium hover:bg-gray-300">Apply</button></div></div>
                <div className="border-t border-gray-200 my-6"></div>
                <div className="flex justify-between text-lg font-bold text-gray-900"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
        </div>
    );
    
    // Guard clause agar plan abhi load na hua ho
    if (!plan) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">Billing</h1>
                
                <div className="flex items-center mb-10">
                    <div className={`flex items-center ${step >= 1 ? 'text-green-600' : 'text-gray-500'}`}><span className={`w-10 h-10 flex items-center justify-center rounded-full font-bold ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</span><span className="ml-4 font-semibold text-lg">Billing Information</span></div>
                    <div className={`flex-1 border-t-2 mx-4 ${step > 1 ? 'border-green-600' : 'border-gray-200'}`}></div>
                    <div className={`flex items-center ${step >= 2 ? 'text-green-600' : 'text-gray-500'}`}><span className={`w-10 h-10 flex items-center justify-center rounded-full font-bold ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</span><span className="ml-4 font-semibold text-lg">Payment Details</span></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    {step === 1 && (
                        <>
                            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm">
                                <form className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div><label className={labelClasses}>First name <span className="text-red-500 ml-1">*</span></label><input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className={inputClasses} /></div>
                                        <div><label className={labelClasses}>Last name <span className="text-red-500 ml-1">*</span></label><input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className={inputClasses} /></div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div><label className={labelClasses}>Email address <span className="text-red-500 ml-1">*</span></label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClasses} placeholder="you@example.com"/></div>
                                        <div><label className={labelClasses}>Phone Number <span className="text-red-500 ml-1">*</span></label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={inputClasses} placeholder="+1 (555) 123-4567"/></div>
                                    </div>
                                    <div><label className={labelClasses}>Company name <span className="text-red-500 ml-1">*</span></label><input type="text" name="company" value={formData.company} onChange={handleInputChange} className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Street Address <span className="text-red-500 ml-1">*</span></label><input type="text" name="address" value={formData.address} onChange={handleInputChange} className={inputClasses} placeholder="123 Main St"/></div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div><label className={labelClasses}>City <span className="text-red-500 ml-1">*</span></label><input type="text" name="city" value={formData.city} onChange={handleInputChange} className={inputClasses} /></div>
                                        <div><label className={labelClasses}>State / Province <span className="text-red-500 ml-1">*</span></label><input type="text" name="state" value={formData.state} onChange={handleInputChange} className={inputClasses} /></div>
                                        <div><label className={labelClasses}>ZIP / Postcode <span className="text-red-500 ml-1">*</span></label><input type="text" name="zip" value={formData.zip} onChange={handleInputChange} className={inputClasses} /></div>
                                    </div>
                                    <div><label className={labelClasses}>Country <span className="text-red-500 ml-1">*</span></label><select name="country" value={formData.country} onChange={handleInputChange} className={inputClasses}><option>Canada</option><option>United States</option><option>Pakistan</option></select></div>
                                </form>
                                <div className="mt-10 flex justify-end">
                                    <button onClick={() => setStep(2)} className="w-auto text-center px-8 py-3 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition shadow-sm">Next</button>
                                </div>
                            </div>
                            <OrderSummary />
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Your Payment Method</h3>
                                <div className="flex gap-4 mb-8">
                                    <div className="w-48 p-4 border-2 border-green-500 rounded-lg flex flex-col items-center justify-center cursor-pointer"><CreditCardIcon /><span className="mt-2 text-sm font-medium text-gray-700">Credit Card</span></div>
                                </div>
                                {savedCards.length === 0 ? (
                                    <div className="text-center py-12 border-t border-b border-gray-200"><div className="mx-auto mb-4"><NoCardIcon /></div><p className="text-gray-500 mb-6">No card on file.</p><button onClick={() => setIsModalOpen(true)} className="text-green-600 font-semibold text-sm hover:underline">Add New Credit Card</button></div>
                                ) : (
                                    <div className="border-t border-b border-gray-200 py-6 space-y-4">
                                        {savedCards.map(card => (<div key={card.id} className="flex items-center justify-between p-4 border rounded-lg"><div className="flex items-center"><VisaIcon /><div className="ml-4"><p className="font-semibold text-gray-800">{card.type} ending in {card.last4}</p><p className="text-sm text-gray-500">Default Card</p></div></div><button className="text-sm font-medium text-red-600 hover:underline">Remove</button></div>))}
                                        <button onClick={() => setIsModalOpen(true)} className="mt-4 text-green-600 font-semibold text-sm hover:underline">Add Another Card</button>
                                    </div>
                                )}
                                <div className="mt-10 flex justify-between">
                                    <button onClick={() => setStep(1)} className="w-auto text-center px-8 py-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition">Back</button>
                                    <button className="w-auto text-center px-8 py-3 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition shadow-sm">Pay Now</button>
                                </div>
                            </div>
                            <OrderSummary />
                        </>
                    )}
                </div>
            </div>
            
            <AddCardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddCard={handleAddCard}/>
        </div>
    );
};

export default Checkout;