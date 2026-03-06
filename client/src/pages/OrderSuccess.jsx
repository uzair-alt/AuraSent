import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const [isExiting, setIsExiting] = useState(false);
  const searchParams = new URLSearchParams(location.search);
  const orderId =
    searchParams.get("orderId") || location.state?.orderId || "";

  const orderDetails = {
    orderNumber: orderId ? orderId.slice(-8).toUpperCase() : "",
    date: "",
    total: 2499,
    estimatedDelivery: "",
    paymentMethod: "Cash on Delivery",
    items: [
      { name: "Midnight Rose Eau de Parfum", quantity: 1, price: 1899 },
      { name: "Ocean Breeze Body Mist", quantity: 2, price: 600 },
    ],
  };

  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b']
    });

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleViewOrders = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (orderId) {
        navigate(`/my-orders/${orderId}`);
      } else {
        navigate("/my-orders");
      }
    }, 300);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  return (
    <div className="min-h-screen bg-page relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-page-gradient" />
      <div className="absolute inset-0 bg-accent-gradient opacity-5" />
      
      {/* Floating Decorative Elements */}
      <div className="absolute left-0 top-1/4 text-7xl opacity-10 animate-float-slow">
        🎉
      </div>
      <div className="absolute right-0 bottom-1/4 text-7xl opacity-10 animate-float-slower">
        ✨
      </div>
      <div className="absolute left-1/4 bottom-1/4 text-6xl opacity-10 animate-float">
        🌸
      </div>
      
      {/* Animated Circles */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-success/10 blur-3xl animate-pulse-slow" />
      <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-accent-primary/10 blur-3xl animate-pulse-slower" />

      {/* Main Content */}
      <div className={`relative min-h-screen flex items-center justify-center p-4 transition-all duration-500 ${
        isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
        <div className="max-w-2xl w-full">
          {/* Success Card */}
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-success via-accent-primary to-accent-secondary rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
            
            <div className="relative bg-surface-primary border border-border-subtle rounded-3xl shadow-2xl overflow-hidden">
              {/* Animated Header Bar */}
              <div className="h-2 bg-gradient-to-r from-success via-accent-primary to-accent-secondary animate-gradient-x" />
              
              {/* Content */}
              <div className="p-8 md:p-12">
                {/* Success Animation */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-32 w-32 rounded-full bg-success/10 animate-ping" />
                  </div>
                  <div className="relative flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-success to-accent-primary flex items-center justify-center text-white text-4xl animate-bounce-slow">
                      ✓
                    </div>
                  </div>
                </div>

                {/* Success Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-6">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-success">
                    Order Confirmed • #{orderDetails.orderNumber}
                  </span>
                </div>

                {/* Main Message */}
                <h1 className="text-3xl md:text-5xl font-bold text-gradient mb-4">
                  Thank You!
                </h1>
                
                <p className="text-xl text-primary mb-2">
                  Your order has been placed successfully
                </p>
                
                <p className="text-muted mb-8 max-w-md mx-auto">
                  We've received your order and will send you a confirmation email shortly.
                  You can track your order status in real-time.
                </p>

                {/* Order Summary Card */}
                <div className="mb-8 p-6 rounded-2xl bg-surface-secondary border border-border-subtle">
                  <h3 className="text-sm font-semibold text-primary mb-4 text-left">
                    Order Summary
                  </h3>
                  
                  <div className="space-y-3 mb-4">
                    {orderDetails.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-primary">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="text-accent-primary">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border-subtle pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Order Date</span>
                      <span className="text-primary">{orderDetails.date}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Payment Method</span>
                      <span className="text-primary">{orderDetails.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Estimated Delivery</span>
                      <span className="text-success font-medium">{orderDetails.estimatedDelivery}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2">
                      <span className="text-primary">Total</span>
                      <span className="text-xl text-accent-primary">
                        {formatCurrency(orderDetails.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleViewOrders}
                    className="btn-primary px-8 py-3 text-base group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span>View Order Details</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                    <span className="absolute inset-0 bg-linear-to-r from-accent-primary to-accent-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  
                  <Link
                    to="/products"
                    className="btn-outline px-8 py-3 text-base group"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>Continue Shopping</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </Link>
                </div>

                {/* Auto-redirect Countdown */}
                <div className="mt-8 text-sm text-muted">
                  <p>Redirecting to order details in</p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          className="text-border-subtle"
                          strokeWidth="2"
                          stroke="currentColor"
                          fill="transparent"
                          r="28"
                          cx="32"
                          cy="32"
                        />
                        <circle
                          className="text-accent-primary transition-all duration-1000"
                          strokeWidth="2"
                          strokeDasharray={175.9}
                          strokeDashoffset={175.9 * (1 - countdown / 10)}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="28"
                          cx="32"
                          cy="32"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-primary">
                        {countdown}
                      </span>
                    </div>
                    <span className="text-xs text-muted">seconds</span>
                  </div>
                </div>

                {/* Help Links */}
                <div className="mt-8 pt-6 border-t border-border-subtle">
                  <div className="flex flex-wrap justify-center gap-4 text-xs">
                    <Link to="/contact" className="text-muted hover:text-primary transition-colors">
                      Need Help?
                    </Link>
                    <span className="text-muted">•</span>
                    <Link to="/shipping" className="text-muted hover:text-primary transition-colors">
                      Shipping Info
                    </Link>
                    <span className="text-muted">•</span>
                    <Link to="/returns" className="text-muted hover:text-primary transition-colors">
                      Returns Policy
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Confirmation Note */}
          <div className="mt-6 text-center text-xs text-muted">
            <p className="flex items-center justify-center gap-2">
              <span className="text-lg">📧</span>
              A confirmation email has been sent to your registered email address
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
