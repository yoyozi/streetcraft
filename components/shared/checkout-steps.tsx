import React from 'react';
import { cn } from '@/lib/utils';

const CheckoutSteps = ({ current = 0 }) => {

    // We want flex-row on medium screens and higher 

    // There are four steps in the process and there index
    // 0. User login
    // 1. Shipping Address
    // 2. Payment Method
    // 3. Place Order

    return (
    
        <div className="flex-between flex-col md:flex-row space-x-2 space-y-2 mb-10">
            {['User login', 'Shipping Address', 'Payment Method', 'Place Order'].map((step, index) => (
                <React.Fragment key={step}>
                    <div className={cn(
                        'p-2 w-56 rounded-full text-center text-sm', 
                        index === current ? 'bg-secondary' : ''
                    )}>
                        {step}
                    </div>
                    {step !== 'Place Order' && (
                        <hr className="w-16 border-t border-gray-300 mx-2"></hr>
                    )}
                </React.Fragment>
            ))}
        </div>

    );

};

export default CheckoutSteps;