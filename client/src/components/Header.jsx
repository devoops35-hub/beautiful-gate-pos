import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faShoppingCart, faBox, faSignOutAlt, faSignInAlt } from '@fortawesome/free-solid-svg-icons';

const Header = () => {
  const { isAuthenticated, logout, company } = useContext(AuthContext);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: faTachometerAlt },
    { name: 'Sales', path: '/sales', icon: faShoppingCart },
    { name: 'Inventory', path: '/inventory', icon: faBox },
  ];

  // Use company branding if available, otherwise use defaults
  const companyName = company?.name || 'Beautiful Gate';
  const companyDescription = company?.industry ? `${company.industry} Business` : 'Stationery & Printing Hub';
  const companyLogo = company?.logo_url || '/beautiful-gate-logo.png';
  const primaryColor = company?.primary_color || '#1e40af'; // blue-800

  return (
    <header className="bg-white shadow-md sticky top-0 z-10 border-b border-gray-200" style={{ borderTopColor: primaryColor, borderTopWidth: '3px' }}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0 flex items-center gap-3 text-center sm:text-left">
            <img 
              src={companyLogo} 
              alt={`${companyName} Logo`} 
              className="h-14 w-14 object-contain"
              onError={(e) => {
                // Fallback if company logo fails to load
                e.target.src = '/beautiful-gate-logo.png';
              }}
            />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
                {companyName}
              </h1>
              <p className="text-xs text-gray-600">{companyDescription}</p>
            </div>
          </div>
          <nav className="flex flex-wrap justify-center gap-2 sm:gap-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${location.pathname === item.path
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
                style={location.pathname === item.path ? { backgroundColor: primaryColor } : {}}
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