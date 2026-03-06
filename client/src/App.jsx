import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

const LoginPage = lazy(() => import("./pages/Login.jsx"));
const SignupPage = lazy(() => import("./pages/Signup.jsx"));
const AdminDashboard = lazy(() => import("./pages/dashboard/AdminDashboard.jsx"));
const AdminAnalytics = lazy(() => import("./pages/dashboard/AdminAnalytics.jsx"));
const AdminOrders = lazy(() => import("./pages/dashboard/AdminOrders.jsx"));
const AdminProducts = lazy(() => import("./pages/dashboard/AdminProducts.jsx"));
const AdminArchivedProducts = lazy(() => import("./pages/dashboard/AdminArchivedProducts.jsx"));
const AdminUsers = lazy(() => import("./pages/dashboard/AdminUsers.jsx"));
const AdminProductReviews = lazy(() => import("./pages/dashboard/AdminProductReviews.jsx"));
const AdminProductForm = lazy(() => import("./pages/dashboard/AdminProductForm.jsx"));
const AdminOrderDetail = lazy(() => import("./pages/dashboard/AdminOrderDetail.jsx"));
const AdminUserDetail = lazy(() => import("./pages/dashboard/AdminUserDetail.jsx"));
const AdminAccount = lazy(() => import("./pages/dashboard/AdminAccount.jsx"));
const AdminCoupons = lazy(() => import("./pages/dashboard/AdminCoupons.jsx"));
const AdminBanners = lazy(() => import("./pages/dashboard/AdminBanners.jsx"));
const AdminFeaturedCollections = lazy(
  () => import("./pages/dashboard/AdminFeaturedCollections.jsx")
);
const AdminSupportTickets = lazy(
  () => import("./pages/dashboard/AdminSupportTickets.jsx")
);
const AdminFaqs = lazy(() => import("./pages/dashboard/AdminFaqs.jsx"));
const AdminCategories = lazy(() => import("./pages/dashboard/AdminCategories.jsx"));
const Products = lazy(() => import("./pages/Products.jsx"));
const ProductDetail = lazy(() => import("./pages/ProductDetail.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const MyOrders = lazy(() => import("./pages/MyOrders.jsx"));
const MyOrderDetail = lazy(() => import("./pages/MyOrderDetail.jsx"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess.jsx"));
const MyAccount = lazy(() => import("./pages/MyAccount.jsx"));
const MyWishlist = lazy(() => import("./pages/MyWishlist.jsx"));
const Support = lazy(() => import("./pages/Support.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const TrackOrder = lazy(() => import("./pages/TrackOrder.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFound.jsx"));
const NotAuthorizedPage = lazy(() => import("./pages/NotAuthorized.jsx"));

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Suspense
        fallback={
          <div className="min-h-[60vh] bg-page flex items-center justify-center">
            <div className="h-10 w-10 rounded-full border-2 border-border-subtle border-t-accent-primary animate-spin" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
        <Route
          path="/cart"
          element={
            <PrivateRoute>
              <Cart />
            </PrivateRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <PrivateRoute>
              <Checkout />
            </PrivateRoute>
          }
        />
        <Route
          path="/help"
          element={
            <PrivateRoute>
              <Support />
            </PrivateRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <PrivateRoute>
              <Contact />
            </PrivateRoute>
          }
        />
        <Route
          path="/track-order"
          element={
            <PrivateRoute>
              <TrackOrder />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-orders"
          element={
            <PrivateRoute>
              <MyOrders />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-orders/:id"
          element={
            <PrivateRoute>
              <MyOrderDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/order-success"
          element={
            <PrivateRoute>
              <OrderSuccess />
            </PrivateRoute>
          }
        />
        <Route
          path="/account"
          element={
            <PrivateRoute>
              <MyAccount />
            </PrivateRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <PrivateRoute>
              <MyWishlist />
            </PrivateRoute>
          }
        />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <AdminAnalytics />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders/:id"
          element={
            <AdminRoute>
              <AdminOrderDetail />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminProducts />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products/new"
          element={
            <AdminRoute>
              <AdminProductForm />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products/:id/edit"
          element={
            <AdminRoute>
              <AdminProductForm />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products/:id/reviews"
          element={
            <AdminRoute>
              <AdminProductReviews />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products/archived"
          element={
            <AdminRoute>
              <AdminArchivedProducts />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users/:id"
          element={
            <AdminRoute>
              <AdminUserDetail />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/account"
          element={
            <AdminRoute>
              <AdminAccount />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/marketing/coupons"
          element={
            <AdminRoute>
              <AdminCoupons />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/marketing/banners"
          element={
            <AdminRoute>
              <AdminBanners />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/marketing/categories"
          element={
            <AdminRoute>
              <AdminCategories />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/marketing/featured-collections"
          element={
            <AdminRoute>
              <AdminFeaturedCollections />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/support/tickets"
          element={
            <AdminRoute>
              <AdminSupportTickets />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/support/faqs"
          element={
            <AdminRoute>
              <AdminFaqs />
            </AdminRoute>
          }
        />
          <Route path="/not-authorized" element={<NotAuthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Footer />
    </BrowserRouter>
  );
}

function AdminRoute({ children }) {
  const stored = localStorage.getItem("auth");
  const session = stored ? JSON.parse(stored) : null;

  if (!session || !session.user?.isAdmin) {
    if (!session) {
      return <Navigate to="/login" replace />;
    }

    return <Navigate to="/not-authorized" replace />;
  }

  return children;
}

function PrivateRoute({ children }) {
  const stored = localStorage.getItem("auth");
  const session = stored ? JSON.parse(stored) : null;

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.user?.isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

export default App;
