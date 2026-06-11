import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Layout from './components/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import {
  Privacy,
  Terms,
  FAQs,
  Shipping,
  Returns,
  NotFound
} from './pages/Placeholders';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import About from './pages/About';
import Contact from './pages/Contact';
import Wishlist from './pages/Wishlist';
import Account from './pages/Account';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import ProductForm from './pages/admin/ProductForm';
import Orders from './pages/admin/Orders';
import Customers from './pages/admin/Customers';
import Reviews from './pages/admin/Reviews';
import Categories from './pages/admin/Categories';
import Discounts from './pages/admin/Discounts';
import ContentManager from './pages/admin/ContentManager';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.error('App crash:', error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F4] text-center px-6">
          <div className="space-y-4">
            <p className="font-script text-4xl text-[#5C3D2E]">Fuzzy Soft Studio</p>
            <p className="text-sm text-gray-500">Something went wrong. Please refresh the page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#DCA29A] text-white rounded-full text-sm"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        // Query the general settings row first
        const { data: generalData } = await supabase
          .from('store_settings')
          .select('value')
          .eq('key', 'general')
          .single();
        
        if (generalData?.value) {
          const val = generalData.value;
          if (val.store_open === false || val.store_open === 'false') {
            setMaintenance(true);
            return;
          }
        }

        // Fallback to checking store_open key directly
        const { data } = await supabase
          .from('store_settings')
          .select('value')
          .eq('key', 'store_open')
          .single();
        if (data && (data.value === false || data.value === 'false')) {
          setMaintenance(true);
        }
      } catch (err) {
        console.warn('Failed to fetch store status:', err);
      }
    };
    checkMaintenance();
  }, []);

  const isAdminRoute = window.location.pathname.startsWith('/admin');

  if (maintenance && !isAdminRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg text-center px-4">
        <img src="/logo.png" className="h-16 mb-8" alt="Fuzzy Soft Studio Logo" />
        <h1 className="font-serif text-4xl text-brand-heading mb-4">
          We'll Be Back Soon 🌸
        </h1>
        <p className="text-brand-body/70 text-lg mb-2">
          Our website is currently under maintenance.
        </p>
        <p className="text-brand-body/50 text-sm">
          Follow us on Instagram @fuzzysoftstudio for updates.
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Admin routes are completely separate from main website layout */}
          <Route path="/admin" element={<Admin />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/edit/:id" element={<ProductForm />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="categories" element={<Categories />} />
            <Route path="discounts" element={<Discounts />} />
            <Route path="content" element={<ContentManager />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/admin/login" element={<AdminLogin />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/account" element={<Account />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/returns" element={<Returns />} />
            {/* Catch-all maps to NotFound */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
