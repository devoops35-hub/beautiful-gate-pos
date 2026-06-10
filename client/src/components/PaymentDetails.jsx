import React, { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBill, faMobileAlt, faPrint, faRedo, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { api } from '../config/api';
import { PAYSTACK_PUBLIC_KEY } from '../config/paystack';

const PaymentDetails = () => {
  const { cart, clearCart } = useContext(CartContext);
  const [processing, setProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Cash');
  const [customerPhone, setCustomerPhone] = useState('+233');
  
  // Fixed tax rate - no longer fetched from admin settings
  const TAX_RATE = 0.075; // 7.5% tax rate

  const subTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const tax = subTotal * TAX_RATE;
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const total = subTotal + tax;

  const handlePayment = () => {
    if (cart.length === 0) return;
    setShowConfirmModal(true);
  };

  const confirmSale = async () => {
    if (cart.length === 0) return;
    
    // Validate customer information for mobile money payments
    if (selectedPaymentMethod === 'Mobile Money') {
      if (!customerPhone || customerPhone === '+233') {
        toast.error('Please provide customer phone number for mobile money payment');
        setProcessing(false);
        return;
      }
      
      // Handle phone number - if it starts with 0, replace with +233
      let finalPhone = customerPhone;
      if (finalPhone.startsWith('0')) {
        finalPhone = '+233' + finalPhone.substring(1);
      } else if (!finalPhone.startsWith('+233')) {
        // If it doesn't start with +233 or 0, add +233
        finalPhone = '+233' + finalPhone;
      }
      setCustomerPhone(finalPhone);
      
      // Validate phone format (should be 13 characters: +233 + 9 digits)
      const phoneRegex = /^\+233\d{9}$/;
      if (!phoneRegex.test(finalPhone)) {
        toast.error('Please enter a valid Ghanaian phone number (10 digits starting with 0 or +233)');
        setProcessing(false);
        return;
      }
    }
    
    setProcessing(true);
    try {
      // Prepare sale data
      const saleData = {
        products: cart.map(item => ({
          product: item._id,
          quantity: item.qty,
          price: item.price
        })),
        total: total,
        paymentMethod: selectedPaymentMethod,
        customerEmail: 'moneycustomer@beautifulgate.com',  // Valid email for mobile money
        customerPhone: selectedPaymentMethod === 'Mobile Money' ? customerPhone : '0000000000'
      };
      
      // Debug: Log the saleData being sent
      console.log('Sale data being sent:', saleData);
      
      // If payment method is Mobile Money, process with Paystack
      if (selectedPaymentMethod === 'Mobile Money') {
        // Check if Paystack is available
        if (typeof window.PaystackPop === 'undefined') {
          toast.error('Payment gateway not available. Please try again later.');
          setProcessing(false);
          return;
        }
        
        // Check if Paystack public key is properly configured
        if (!PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY === 'your_paystack_public_key') {
          toast.error('Paystack public key is not properly configured. Please check your environment variables.');
          setProcessing(false);
          return;
        }
        
        // Initialize Paystack inline payment
        const handler = window.PaystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY,
          email: 'moneycustomer@beautifulgate.com',
          amount: Math.round(total * 100), // Amount in kobo
          currency: 'GHS',
          ref: '' + Math.floor((Math.random() * 1000000000) + 1),
          metadata: {
            custom_fields: [
              {
                display_name: 'POS Sale',
                variable_name: 'pos_sale',
                value: 'POS Sale Transaction'
              }
            ]
          },
          callback: function(response) {
            // Verify transaction with backend
            (async () => {
              try {
                // Include customer information in the verification request
                const verifyData = {
                  ...saleData,
                  customerPhone: customerPhone
                };
                
                console.log('Verify data being sent:', verifyData);
                const verifyResponse = await api.sales.verify(response.reference, verifyData);
                
                if (verifyResponse.data.success) {
                  clearCart();
                  setShowConfirmModal(false);
                  toast.success('Payment successful and sale completed!');
                } else {
                  toast.error(verifyResponse.data.message || 'Payment verification failed. Please try again.');
                }
              } catch (err) {
                console.error('Error verifying transaction:', err);
                if (err.response && err.response.data && err.response.data.message) {
                  toast.error(err.response.data.message);
                } else {
                  toast.error('Failed to verify payment. Please contact support.');
                }
              } finally {
                setProcessing(false);
              }
            })();
          },
          onClose: () => {
            setProcessing(false);
            toast.error('Payment cancelled');
          }
        });
        
        handler.openIframe();
        return;
      }
      
      // For Cash payments, save sale directly
      console.log('Creating cash sale with data:', saleData);
      await api.sales.create(saleData);
      
      // Clear cart after successful sale
      clearCart();
      setShowConfirmModal(false);
      toast.success('Sale completed successfully!');
    } catch (err) {
      console.error('Error saving sale:', err);
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Failed to complete sale. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    if (cart.length === 0) return;
    
    // Create a receipt HTML template
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Receipt</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .receipt-container {
              max-width: 400px;
              margin: 0 auto;
              background-color: white;
              padding: 20px;
              border: 1px solid #ddd;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .receipt-header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .logo {
              width: 60px;
              height: 60px;
              margin: 0 auto 10px;
              display: block;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #333;
            }
            .company-desc {
              font-size: 12px;
              color: #666;
            }
            .receipt-date {
              font-size: 12px;
              color: #999;
              margin-top: 5px;
            }
            .receipt-items {
              margin-bottom: 20px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              border-bottom: 1px dotted #ddd;
              padding-bottom: 8px;
              font-size: 14px;
            }
            .item-name {
              flex-grow: 1;
            }
            .item-qty {
              width: 50px;
              text-align: center;
            }
            .item-price {
              width: 70px;
              text-align: right;
            }
            .receipt-summary {
              border-top: 2px solid #333;
              border-bottom: 2px solid #333;
              padding: 10px 0;
              margin-bottom: 10px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 14px;
            }
            .summary-row.total {
              font-weight: bold;
              font-size: 16px;
              margin-top: 10px;
            }
            .receipt-footer {
              text-align: center;
              font-size: 12px;
              color: #999;
              margin-top: 20px;
            }
            .divider {
              border-bottom: 1px dotted #ddd;
              margin: 10px 0;
            }
            @media print {
              body {
                background-color: white;
              }
              .receipt-container {
                box-shadow: none;
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <img src="/beautiful-gate-logo.png" alt="Beautiful Gate Logo" class="logo" onerror="this.style.display='none'">
              <div class="company-name">Beautiful Gate</div>
              <div class="company-desc">Stationery & Printing Hub</div>
              <div class="receipt-date">${new Date().toLocaleString()}</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="receipt-items">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: bold; font-size: 12px; padding-bottom: 8px; border-bottom: 1px solid #333;">
                <span>Item</span>
                <span style="text-align: center; width: 50px;">Qty</span>
                <span style="text-align: right; width: 70px;">Price</span>
              </div>
              ${cart.map(item => `
                <div class="item">
                  <span class="item-name">${item.name}</span>
                  <span class="item-qty">${item.qty}</span>
                  <span class="item-price">₵${(item.price * item.qty).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            
            <div class="receipt-summary">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>₵${subTotal.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Tax (${(TAX_RATE * 100).toFixed(1)}%):</span>
                <span>₵${tax.toFixed(2)}</span>
              </div>
              <div class="summary-row total">
                <span>TOTAL:</span>
                <span>₵${total.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="receipt-footer">
              <p>Thank you for your purchase!</p>
              <p>Payment Method: ${selectedPaymentMethod}</p>
              <p style="margin-top: 10px; font-size: 10px;">Receipt printed on ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <script>
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          </script>
        </body>
      </html>
    `;
    
    // Open print window
    const printWindow = window.open('', '', 'height=600,width=500');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  const handleReset = () => {
    if (cart.length === 0) return;
    clearCart();
    toast.success('Cart has been reset');
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  const cancelSale = () => {
    setShowConfirmModal(false);
  };

  return (
    <div className="p-0">
      <div className="px-6 pt-6">
        <h2 className="text-xl font-bold mb-4">Details</h2>
        <div className="flex justify-between mb-2">
          <span>Sub Total:</span>
          <span>₵{subTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Tax ({(TAX_RATE * 100).toFixed(1)}%):</span>
          <span className="text-red-500">₵{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-4">
          <span>Total Items:</span>
          <span>{totalItems}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-4">
          <span>Total:</span>
          <span>₵{total.toFixed(2)}</span>
        </div>
        <div className="mt-6">
          <div className="flex items-center mb-4">
            <input 
              type="checkbox" 
              id="cash" 
              className="mr-2" 
              checked={selectedPaymentMethod === 'Cash'}
              onChange={() => handlePaymentMethodSelect('Cash')}
            />
            <label htmlFor="cash">Cash</label>
          </div>
          <div className="flex items-center mb-4">
            <input 
              type="checkbox" 
              id="mobile-money" 
              className="mr-2" 
              checked={selectedPaymentMethod === 'Mobile Money'}
              onChange={() => handlePaymentMethodSelect('Mobile Money')}
            />
            <label htmlFor="mobile-money">Mobile Money</label>
          </div>
        </div>
      </div>
      <div className="px-6 pb-6 mt-6">
        <div className="flex space-x-2">
          <button 
            onClick={handlePayment}
            disabled={processing || cart.length === 0}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg w-full flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {processing ? 'Processing...' : (
              <>
                <FontAwesomeIcon icon={faMoneyBill} className="mr-2" />
                Pay
              </>
            )}
          </button>
          <button 
            onClick={handlePrintReceipt}
            disabled={cart.length === 0}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg w-full flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faPrint} className="mr-2" />
            Print Receipt
          </button>
        </div>
        <button 
          onClick={handleReset}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg w-full mt-2 flex items-center justify-center transition-colors"
        >
          <FontAwesomeIcon icon={faRedo} className="mr-2" />
          Reset
        </button>
      </div>

      {/* Confirm Sale Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Confirm Sale</h3>
              <button 
                onClick={cancelSale}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="mb-4">
              <p className="mb-2">Payment Method: <span className="font-semibold">{selectedPaymentMethod}</span></p>
              <p className="mb-2">Total Items: <span className="font-semibold">{totalItems}</span></p>
              <p className="text-lg font-bold">Total Amount: <span className="font-semibold">₵{total.toFixed(2)}</span></p>
              {selectedPaymentMethod === 'Mobile Money' && (
                <div className="mt-4">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => {
                        let value = e.target.value;
                        // If user starts typing with 0, convert to +233
                        if (value === '0') {
                          setCustomerPhone('+2330');
                        } else if (value.startsWith('0') && !value.startsWith('+233')) {
                          // Replace leading 0 with +233
                          setCustomerPhone('+233' + value.substring(1));
                        } else {
                          setCustomerPhone(value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+233XXXXXXXXX or 0XXXXXXXXX"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="mb-4">
              <h4 className="font-bold mb-2">Items:</h4>
              <div className="max-h-40 overflow-y-auto">
                {cart.map(item => (
                  <div key={item._id} className="flex justify-between py-1 border-b">
                    <span>{item.name} x {item.qty}</span>
                    <span>₵{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelSale}
                disabled={processing}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSale}
                disabled={processing}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"
              >
                {processing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} className="mr-2" />
                    Confirm Sale
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDetails;