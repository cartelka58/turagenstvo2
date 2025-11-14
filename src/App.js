import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import { ServicesProvider } from './contexts/ServicesContext';
import Navigation from './common/Navigation';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './cart/Cart';
import Login from './auth/Login';
import Register from './auth/Register';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import AdminPanel from './components/admin/AdminPanel';
import UserManagement from './components/admin/UserManagement';
import TourManagement from './components/admin/TourManagement';
import CategoryManagement from './components/admin/CategoryManagement';
import BookingManagement from './components/admin/BookingManagement';
import CouponManagement from './components/admin/CouponManagement';
import ProtectedRoute from './common/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CartProvider>
          <ServicesProvider>
            <Router>
              <div className="App">
                <Navigation />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/bookings" 
                      element={
                        <ProtectedRoute>
                          <Bookings />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <AdminPanel />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/users" 
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <UserManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/tours" 
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <TourManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/categories" 
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <CategoryManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/bookings" 
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <BookingManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/coupons" 
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <CouponManagement />
                        </ProtectedRoute>
                      } 
                    />
                  </Routes>
                </main>
              </div>
            </Router>
          </ServicesProvider>
        </CartProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;