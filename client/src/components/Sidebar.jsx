import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faShoppingCart, faBox, faSignOutAlt, faBars, faTimes, faUser, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const Sidebar = () => {
  const { isAuthenticated, logout, user, company } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: faTachometerAlt },
    { name: 'Sales', path: '/sales', icon: faShoppingCart },
    { name: 'Inventory', path: '/inventory', icon: faBox },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user && user.name) {
      const names = user.name.split(' ');
      let initials = names[0].substring(0, 1).toUpperCase();
      if (names.length > 1) {
        initials += names[names.length - 1].substring(0, 1).toUpperCase();
      }
      return initials;
    }
    return 'U';
  };

  // Use company branding if available, otherwise use defaults
  const companyName = company?.name || 'Beautiful Gate';
  const companyDescription = company?.industry ? `${company.industry} Business` : 'Stationery & Printing Hub';
  const companyLogo = company?.logo_url || '/beautiful-gate-logo.png';
  const primaryColor = company?.primary_color || '#1e40af'; // blue-800

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 bg-blue-500 text-white p-2 rounded-lg shadow-lg lg:hidden"
      >
        <FontAwesomeIcon icon={isOpen ? faTimes : faBars} size="lg" />
      </button>

      {/* Sidebar overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`top-0 left-0 h-screen bg-white shadow-lg z-50 overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'fixed translate-x-0' : 'fixed -translate-x-full'
        } lg:sticky lg:top-0 lg:translate-x-0 ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Sidebar header */}
        <div className={`p-4 border-b border-gray-200 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`} style={{ borderBottomColor: primaryColor, borderBottomWidth: '2px' }}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <img 
                src={companyLogo} 
                alt={`${companyName} Logo`} 
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  e.target.src = '/beautiful-gate-logo.png';
                }}
              />
              <div>
                <h1 className="text-lg font-bold" style={{ color: primaryColor }}>{companyName}</h1>
                <p className="text-xs text-gray-600">{companyDescription}</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <img 
              src={companyLogo} 
              alt={companyName.substring(0, 2)} 
              className="h-10 w-10 object-contain"
              onError={(e) => {
                e.target.src = '/beautiful-gate-logo.png';
              }}
            />
          )}
          <button
            onClick={toggleCollapse}
            className={`text-gray-500 hover:text-gray-700 ${isCollapsed ? 'ml-0' : 'ml-auto'}`}
          >
            <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden">
          <ul className="py-4">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-4 py-3 text-base font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={location.pathname === item.path ? { backgroundColor: primaryColor } : {}}
                >
                  <FontAwesomeIcon icon={item.icon} className={`${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section at bottom */}
        {isAuthenticated && (
          <div className={`p-4 border-t border-gray-200 ${isCollapsed ? 'text-center' : ''}`}>
            {!isCollapsed && (
              <div className="flex items-center mb-4">
                <div className="text-white rounded-full p-2 mr-3 flex items-center justify-center w-10 h-10" style={{ backgroundColor: primaryColor }}>
                  <span className="font-medium">{getUserInitials()}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{user?.name || 'User'}</p>
                  <p className="text-sm text-gray-500">{user?.email || ''}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`flex items-center w-full px-4 py-2 text-base font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <FontAwesomeIcon icon={faSignOutAlt} className={isCollapsed ? '' : 'mr-3'} />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;