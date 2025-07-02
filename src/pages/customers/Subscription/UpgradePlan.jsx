// src/pages/app/Subscription/UpgradePlan.jsx

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Naya (yellow) icon
const FeatureCheckIcon = () => (
    <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

// Naya Data (archilance.net se)
const pricingData = [
    {
        name: 'Basic',
        price: '1895',
        unit: '/mo',
        hoursInfo: '160 hours',
        rateInfo: '$11.84/hr | 40 hrs /w',
        secondaryButtonText: 'How Our Subscription Works?',
        features: ['Unlimited design requests', 'Unlimited revisions', '40 hours a week', 'Cancel Anytime', 'Pause Anytime', 'Weekly meeting', 'One active task at a time', '1 team member dedicated to your project'],
        isPopular: false,
    },
    {
        name: 'Standard',
        price: '2500',
        unit: '/mo',
        hoursInfo: '240 hours',
        rateInfo: '$10.42/hr | 60 hrs /w',
        secondaryButtonText: 'How Our Subscription Works?',
        features: ['Unlimited design requests', 'Unlimited revisions', '60 hours a week', 'Cancel Anytime', 'Pause Anytime', 'Weekly meeting', 'Multiple active tasks at a time', 'Dedicated project manager', 'Time Tracking', '2 team members dedicated to your project'],
        isPopular: true, // Is se default selection hoga
    },
    {
        name: 'Hourly',
        price: '28',
        unit: '/hr',
        hoursInfo: 'Pay as you go',
        rateInfo: 'Billed weekly',
        secondaryButtonText: 'How Our Hourly Works?',
        features: ['1 day free trial', 'Unlimited design requests', 'Unlimited revisions', 'Unlimited hours a week', 'Cancel Anytime', 'Pause Anytime', 'Weekly meeting', 'Multiple active tasks at a time', 'Dedicated project manager', 'Time Tracking'],
        isPopular: false,
    },
];

// PricingCard ko naye design ke liye update kiya gaya hai
const PricingCard = ({ plan, isCurrentPlan, isSelected, onSelectPlan, isAnnual }) => {
    const { name, price, unit, hoursInfo, rateInfo, secondaryButtonText, features, isPopular } = plan;

    return (
        // Click aur selection ki functionality waisi hi hai
        <div 
            onClick={() => onSelectPlan(name)}
            className={`p-8 rounded-2xl relative flex flex-col cursor-pointer transition-all duration-300
                ${isSelected 
                    ? 'border-2 border-gray-800 bg-white shadow-xl scale-105' 
                    : 'border border-gray-200 bg-gray-50 hover:shadow-lg'
                }`}
        >
            {/* Tags ki functionality bhi waisi hi hai */}
            {isPopular && !isCurrentPlan && (<div className="absolute top-0 -translate-y-1/2 w-full flex justify-center"><span className="bg-gray-800 text-white text-xs font-semibold px-4 py-1.5 rounded-full uppercase">Most Popular</span></div>)}
            {isCurrentPlan && (<div className="absolute top-0 -translate-y-1/2 w-full flex justify-center"><span className="bg-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full uppercase">Current Plan</span></div>)}
            
            <h3 className="text-xl font-semibold text-gray-800">{name}</h3>
            
            <div className="flex items-baseline mt-4">
                <span className="text-5xl font-bold text-gray-900">${price}</span>
                <span className="text-xl font-semibold text-gray-500">{unit}</span>
            </div>
            
            <p className="mt-4 text-sm font-medium text-gray-700">{hoursInfo}</p>
            <p className="text-xs text-gray-500">{rateInfo}</p>

          
            
            <div className="border-t border-gray-200 my-8"></div>

            <div className="flex-grow">
                <h4 className="font-semibold text-gray-800 mb-4">Features</h4>
                <ul className="space-y-3">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5"><FeatureCheckIcon /></div>
                            <span className="ml-3 text-sm text-gray-600">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
             <div className="border-t border-gray-200 my-8"></div>
             <div className="mt-6 space-y-3">
                 <Link
                    to="/checkout"
                    state={{ plan: plan, billingCycle: isAnnual ? 'Yearly' : 'Monthly' }}
                    className={`block w-full text-center py-3 font-semibold rounded-full 
                        ${isSelected ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-800'}`}
                >
                    {isCurrentPlan ? 'Current Plan' : 'Subscribe'}
                </Link>
                {/* <button className="w-full py-3 font-semibold border border-gray-300 rounded-full text-gray-800">
                    {secondaryButtonText}
                </button> */}
            </div>
        </div>
    );
};


// Main component ki structure waisi hi hai
const UpgradePlan = () => {
    const [isAnnual, setIsAnnual] = useState(true);
    const location = useLocation();
    const currentPlan = location.state?.currentPlan;
    const [selectedPlan, setSelectedPlan] = useState(null);

    useEffect(() => {
        // Default plan ko select karein
        const defaultPlan = pricingData.find(p => p.name === currentPlan) || pricingData.find(p => p.isPopular);
        if (defaultPlan) {
            setSelectedPlan(defaultPlan.name);
        }
    }, [currentPlan]);

    const handleSelectPlan = (planName) => {
        setSelectedPlan(planName);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-extrabold text-gray-900 text-center">Billing</h1>
                
                {/* Monthly/Annual toggle barkarar hai */}
                <div className="flex justify-center mt-8">
                    <div className="relative bg-gray-200 p-1 rounded-full flex items-center">
                        <button onClick={() => setIsAnnual(false)} className={`w-full px-8 py-2 text-sm font-semibold rounded-full relative z-10 transition-colors duration-300 ${!isAnnual ? 'text-gray-800' : 'text-gray-500'}`}>Monthly</button>
                        <button onClick={() => setIsAnnual(true)} className={`w-full px-8 py-2 text-sm font-semibold rounded-full relative z-10 transition-colors duration-300 ${isAnnual ? 'text-gray-800' : 'text-gray-500'}`}>Annually</button>
                        <span className={`absolute top-1 bottom-1 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${isAnnual ? 'translate-x-full' : 'translate-x-0'}`} style={{ width: 'calc(50% - 4px)', left: '4px' }}></span>
                    </div>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8">
                    {pricingData.map((plan) => (
                        <PricingCard 
                            key={plan.name} 
                            plan={plan}
                            isCurrentPlan={plan.name === currentPlan}
                            isSelected={plan.name === selectedPlan}
                            onSelectPlan={handleSelectPlan}
                        />
                    ))}
                </div>

            </div>
        </div>
    );
};

export default UpgradePlan;