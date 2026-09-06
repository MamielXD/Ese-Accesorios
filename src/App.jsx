import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from '@/components/Layout';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { PointsProvider } from '@/contexts/PointsContext';
import { CategoryProvider } from '@/contexts/CategoryContext';
import { Loader2 } from 'lucide-react';
import ScrollToTop from '@/components/ScrollToTop';
import { CampaignTheme } from '@/components/CampaignTheme';

const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-background">
    <Loader2 className="h-12 w-12 animate-spin text-foreground" />
  </div>
);

// lazy imports...
const HomePage = lazy(() => import('@/pages/HomePage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const PromotionsPage = lazy(() => import('@/pages/PromotionsPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const UserProfilePage = lazy(() => import('@/pages/UserProfilePage'));
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const UpdatePasswordPage = lazy(() => import('@/pages/UpdatePasswordPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const ShippingInfoPage = lazy(() => import('@/pages/ShippingInfoPage'));
const TransactionPage = lazy(() => import('./pages/TransactionPage'));
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));

function AppInner() {
  const { user } = useAuth();

  return (
    <CartProvider userId={user ? user.id : null}>
      <PointsProvider>
        <Router>
          <CampaignTheme />
          <ScrollToTop />
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/productos" element={<ProductsPage />} />
                <Route path="/productos/:category" element={<ProductsPage />} />
                <Route path="/producto/:productId/:slug" element={<ProductDetailPage />} />
                <Route path="/producto/:productId" element={<ProductDetailPage />} />
                <Route path="/categorias" element={<CategoriesPage />} />
                <Route path="/promociones" element={<PromotionsPage />} />
                <Route path="/carrito" element={<CartPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/actualizar-contrasena" element={<UpdatePasswordPage />} />
                <Route path="/terminos" element={<TermsPage />} />
                <Route path="/privacidad" element={<PrivacyPolicyPage />} />
                <Route path="/envios" element={<ShippingInfoPage />} />
                <Route path="/transaction" element={<TransactionPage />} />

                <Route 
                  path="/checkout" 
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/perfil" 
                  element={
                    <ProtectedRoute>
                      <UserProfilePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/pedidos" 
                  element={
                    <ProtectedRoute>
                      <OrdersPage />
                    </ProtectedRoute>
                  } 
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedAdminRoute>
                      <AdminPanel />
                    </ProtectedAdminRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </Layout>
          <Toaster />
        </Router>
      </PointsProvider>
    </CartProvider>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CategoryProvider>
          <AppInner />
        </CategoryProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;