import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faShoppingCart, faBox, faSignOutAlt, faSignInAlt } from '@fortawesome/free-solid-svg-icons';

const Header = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: faTachometerAlt },
    { name: 'Sales', path: '/sales', icon: faShoppingCart },
    { name: 'Inventory', path: '/inventory', icon: faBox },
  ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-10 border-b border-gray-200">
      <div className="container mx-auto px-4 py-2">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0 flex items-center gap-3 text-center sm:text-left">
            <img 
              src="/beautiful-gate-logo.png" 
              alt="Beautiful Gate Logo" 
              className="h-14 w-14"
            />
            <div>
              <h1 className="text-2xl font-bold text-blue-800">Beautiful Gate</h1>
              <p className="text-xs text-gray-600">Stationery & Printing Hub</p>
            </div>
          </div>
          <nav className="flex flex-wrap justify-center gap-2 sm:gap-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${location.pathname === item.path
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-2" />
                <span>{item.name}</span>
              </Link>
            ))}
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                <span>Logout</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
                <span>Login</span>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;