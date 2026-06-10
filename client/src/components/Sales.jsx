import React from 'react';
import ProductList from './ProductList';
import Cart from './Cart';
import PaymentDetails from './PaymentDetails';

const Sales = () => {
  return (
    <div className="container mx-auto px-4 py-5 h-full">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Left side - Product List */}
        <div className="lg:flex-1">
          <ProductList />
        </div>
        
        {/* Right side - Cart and Payment Details in same container */}
        <div className="lg:w-100 flex flex-col">
          <div className="bg-white border border-sm rounded-lg shadow-sm h-full flex flex-col">
            {/* Scrollable cart area */}
            <div className="flex-grow overflow-y-auto">
              <Cart />
            </div>
            {/* Payment details at the bottom */}
            <div className="flex-shrink-0 border-t border-gray-200">
              <PaymentDetails />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;