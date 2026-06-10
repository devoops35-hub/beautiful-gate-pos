import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';

const ConfirmationModal = ({ 
  isOpen, 
  title = 'Confirm Action',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  type = 'warning' // 'warning', 'danger', 'info'
}) => {
  if (!isOpen) return null;

  const getTypeClasses = () => {
    switch(type) {
      case 'danger':
        return {
          icon: faExclamationTriangle,
          iconColor: 'text-red-500',
          buttonColor: 'bg-red-500 hover:bg-red-600',
          bgColor: 'bg-red-50'
        };
      case 'info':
        return {
          icon: faExclamationTriangle,
          iconColor: 'text-blue-500',
          buttonColor: 'bg-blue-500 hover:bg-blue-600',
          bgColor: 'bg-blue-50'
        };
      default:
        return {
          icon: faExclamationTriangle,
          iconColor: 'text-yellow-500',
          buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
          bgColor: 'bg-yellow-50'
        };
    }
  };

  const typeClasses = getTypeClasses();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      {/* Modal with animation */}
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full transform transition-all duration-300 scale-100 animate-in fade-in zoom-in">
        {/* Header */}
        <div className={`${typeClasses.bgColor} px-6 py-4 border-b border-gray-200 flex items-start justify-between`}>
          <div className="flex items-start gap-3">
            <FontAwesomeIcon 
              icon={typeClasses.icon} 
              className={`${typeClasses.iconColor} text-xl mt-1`}
            />
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 ${typeClasses.buttonColor} text-white rounded-lg transition-colors disabled:opacity-50 font-medium flex items-center gap-2`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
