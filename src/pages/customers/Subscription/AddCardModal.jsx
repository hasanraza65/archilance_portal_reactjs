import React, { useState } from 'react';

const AddCardModal = ({ isOpen, onClose, onAddCard }) => {
    const [cardDetails, setCardDetails] = useState({
        name: 'John Doe',
        number: '0000 0000 0000 0000',
        expiry: 'MM/YY',
        cvc: '123',
    });

    if (!isOpen) {
        return null;
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Clear placeholder on first focus/change
        if (value !== cardDetails[name] && (cardDetails[name] === 'John Doe' || cardDetails[name] === '0000 0000 0000 0000' || cardDetails[name] === 'MM/YY' || cardDetails[name] === '123')) {
            setCardDetails(prev => ({...prev, [name]: value}));
        } else {
            setCardDetails(prev => ({ ...prev, [name]: value }));
        }
    };
    
    // Clear placeholder text on focus
    const handleFocus = (e) => {
        const { name, value } = e.target;
        if (value === 'John Doe' || value === '0000 0000 0000 0000' || value === 'MM/YY' || value === '123') {
            setCardDetails(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!cardDetails.name || !cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || cardDetails.number === '0000 0000 0000 0000') {
            alert('Please fill all the fields correctly.');
            return;
        }
        onAddCard(cardDetails);
    };

    // --- YAHAN STYLES KO UPDATE KIYA GAYA HAI ---
    const inputClasses = "block w-full px-4 py-3 bg-gray-100 rounded-lg text-gray-500 border border-transparent focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-white focus:text-gray-900";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-2";

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center mt-12 items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative transition-transform transform-gpu scale-100">
                <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Credit Card</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className={labelClasses}>Card Holder Name</label>
                        <input type="text" name="name" value={cardDetails.name} onChange={handleInputChange} onFocus={handleFocus} className={inputClasses}/>
                    </div>
                     <div>
                        <label className={labelClasses}>Card Number</label>
                        <input type="text" name="number" value={cardDetails.number} onChange={handleInputChange} onFocus={handleFocus} className={inputClasses}/>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className={labelClasses}>Expiry Date</label>
                            <input type="text" name="expiry" value={cardDetails.expiry} onChange={handleInputChange} onFocus={handleFocus} className={inputClasses}/>
                        </div>
                        <div className="flex-1">
                            <label className={labelClasses}>CVC</label>
                            <input type="text" name="cvc" value={cardDetails.cvc} onChange={handleInputChange} onFocus={handleFocus} className={inputClasses}/>
                        </div>
                    </div>
                    <div className="pt-4">
                         <button type="submit" className="w-full text-center py-3 bg-gray-800 text-white rounded-lg text-base font-semibold hover:bg-gray-900 transition-all shadow-md hover:shadow-lg">
                            Add Card
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCardModal;