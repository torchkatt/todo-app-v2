import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { SubscriptionPlanProvider } from './context/SubscriptionPlanContext';
import { ChatUIProvider } from './context/ChatUIContext';
import { AIChatButton } from './components/chat/AIChat';
import BottomTabs from './components/layout/BottomTabs';
import SEO from './components/seo/SEO';
import ErrorBoundary from './components/ErrorBoundary';
import { PWAInstallPrompt } from './components/ui/PWAInstallPrompt';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { ReloadPrompt } from './components/ui/ReloadPrompt';
import Onboarding from './components/onboarding/Onboarding';

const Landing = lazy(() => import('./pages/Landing'));
const AppHome = lazy(() => import('./pages/AppHome'));
const Explore = lazy(() => import('./pages/Explore'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Cart = lazy(() => import('./pages/Cart'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const ListingDetail = lazy(() => import('./pages/ListingDetail'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'));
const SellerProfile = lazy(() => import('./pages/SellerProfile'));
const SellerStorefront = lazy(() => import('./pages/SellerStorefront'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const RevenueDashboard = lazy(() => import('./pages/RevenueDashboard'));
const GroupDealPage = lazy(() => import('./pages/GroupDealPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const SellerAnalyticsPage = lazy(() => import('./pages/SellerAnalyticsPage'));

const Loading = () => (
  <div className="min-h-screen bg-brand-bg dark:bg-gray-900 flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <ThemeProvider>
            <SubscriptionPlanProvider>
            <ChatUIProvider>
            <SEO />
            <OfflineBanner />
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
              <div className="pb-20">
                <Routes>
                  {/* App (marketplace) — home por defecto */}
                  <Route path="/" element={<AppHome />} />
                  <Route path="/app" element={<AppHome />} />
                  {/* Marketing Landing */}
                  <Route path="/landing" element={<Landing />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/category/:slug" element={<CategoryPage />} />
                  <Route path="/listing/:id" element={<ListingDetail />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                  <Route path="/seller" element={<SellerDashboard />} />
                  <Route path="/seller/:id" element={<SellerProfile />} />
                  <Route path="/seller/:id/store" element={<SellerStorefront />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/reviews" element={<ReviewsPage />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/revenue" element={<RevenueDashboard />} />
                  <Route path="/wallet" element={<WalletPage />} />
                  <Route path="/group-deal/:id" element={<GroupDealPage />} />
                  <Route path="/seller/analytics" element={<SellerAnalyticsPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="*" element={<div className="p-8 text-center"><h1 className="text-xl font-extrabold mb-2 text-text-primary">404</h1><a href="/" className="text-purple-600 font-bold text-sm">Volver al inicio</a></div>} />
                </Routes>
              </div>
              <BottomTabs />
              </ErrorBoundary>
            </Suspense>
            <PWAInstallPrompt />
            <ReloadPrompt />
            <Onboarding />
            <AIChatButton />
            </ChatUIProvider>
            </SubscriptionPlanProvider>
          </ThemeProvider>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
