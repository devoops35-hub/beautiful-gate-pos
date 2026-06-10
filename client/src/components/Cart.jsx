import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

const Cart = () => {
  const { cart, removeFromCart } = useContext(CartContext);

  const total = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div className="p-0">
      <div className="flex justify-between items-center mb-4 p-4 bg-green-100">
        <h2 className="text-xl font-bold">Cart</h2>
        <span className="bg-red-500 text-white rounded-full px-3 py-1 text-sm font-bold">{total} items</span>
      </div>
      <div className="overflow-x-auto px-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cart.length > 0 ? (
              cart.map(item => (
                <tr key={item._id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.qty}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">₵{item.price.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">₵{(item.price * item.qty).toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => {
                        removeFromCart(item._id);
                        // Removed toast notification as requested
                      }} 
                      className="text-red-500 hover:text-red-700"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                  Your cart is empty
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Cart;