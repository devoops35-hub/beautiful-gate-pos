import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Sales from './components/Sales';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterCompanyPage from './pages/RegisterCompanyPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const location = useLocation();
  const showSidebar = location.pathname !== '/login' && location.pathname !== '/register' && location.pathname !== '/register-company';
  // Hide header on authenticated pages - sidebar will be the only navigation
  const showHeader = false;

  return (
    <div className="App bg-gray-100 min-h-screen flex flex-col">
      {showHeader && <Header />}
      <div className="flex flex-1">
        {showSidebar && <Sidebar />}
        <main className={showSidebar ? "flex-1" : "w-full"}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register-company" element={<RegisterCompanyPage />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/sales" 
              element={
                <ProtectedRoute>
                  <Sales />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/inventory" 
              element={
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;