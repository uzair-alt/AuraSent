import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";

function Checkout() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [step, setStep] = useState(1);
  const [contact, setContact] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [address, setAddress] = useState({
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponFeedback, setCouponFeedback] = useState("");
  const [couponError, setCouponError] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saveInfo, setSaveInfo] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cartItems");

    if (!stored) {
      setItems([]);
      return;
    }

    try {
      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        setItems(parsed);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const itemsPrice = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [items]
  );

  const shippingPrice = itemsPrice > 999 ? 0 : 99;
  const taxPrice = Math.round(itemsPrice * 0.05);
  const effectiveDiscount = Math.max(
    0,
    Math.min(couponDiscount, itemsPrice)
  );
  const totalPrice = itemsPrice - effectiveDiscount + shippingPrice + taxPrice;

  useEffect(() => {
    if (!appliedCouponCode) return;

    if (itemsPrice <= 0) {
      setCouponDiscount(0);
      setAppliedCouponCode("");
      setCouponFeedback("");
      return;
    }

    let isCancelled = false;

    const reapply = async () => {
      try {
        const response = await api.post("/api/coupons/apply", {
          code: appliedCouponCode,
          itemsPrice,
        });

        if (isCancelled) return;

        if (!response.data || !response.data.valid) {
          setCouponDiscount(0);
          setAppliedCouponCode("");
          setCouponFeedback("");
          setCouponError(
            response.data?.message ||
              "Coupon no longer applies to this cart."
          );
          return;
        }

        setCouponDiscount(response.data.discountAmount || 0);
        setCouponFeedback(
          response.data.message || "Coupon applied successfully."
        );
        setCouponError("");
      } catch {
        if (isCancelled) return;
      }
    };

    reapply();

    return () => {
      isCancelled = true;
    };
  }, [appliedCouponCode, itemsPrice]);

  useEffect(() => {
    if (items.length === 0) {
      setError("Your cart is empty.");
    } else {
      setError("");
    }
  }, [items]);

  const handleContactChange = (event) => {
    const { name, value } = event.target;
    setContact((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleAddressChange = (event) => {
    const { name, value } = event.target;
    setAddress((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();

    if (!code) {
      setCouponError("Enter a coupon code.");
      setCouponFeedback("");
      setCouponDiscount(0);
      setAppliedCouponCode("");
      return;
    }

    if (itemsPrice <= 0) {
      setCouponError("Add items to your cart before applying a coupon.");
      return;
    }

    try {
      setCouponError("");
      setCouponFeedback("");
      setIsApplyingCoupon(true);

      const response = await api.post("/api/coupons/apply", {
        code,
        itemsPrice,
      });

      if (!response.data || !response.data.valid) {
        const message =
          response.data?.message || "Coupon is not valid for this order.";
        setCouponError(message);
        setCouponDiscount(0);
        setAppliedCouponCode("");
        return;
      }

      setCouponDiscount(response.data.discountAmount || 0);
      setAppliedCouponCode(response.data.code || code.toUpperCase());
      setCouponFeedback(
        response.data.message || "Coupon applied successfully!"
      );
      setCouponError("");
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to apply coupon. Please try again.";
      setCouponError(message);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponDiscount(0);
    setAppliedCouponCode("");
    setCouponFeedback("");
    setCouponError("");
  };

  const canGoNextFromStep1 = () => {
    if (!items.length) {
      setError("Your cart is empty.");
      return false;
    }

    if (!contact.fullName.trim()) {
      setError("Enter your full name.");
      return false;
    }

    if (!contact.email.trim()) {
      setError("Enter your email address.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      setError("Enter a valid email address.");
      return false;
    }

    if (!contact.phone.trim()) {
      setError("Enter your phone number.");
      return false;
    }

    if (!/^\d{10}$/.test(contact.phone.replace(/\D/g, ''))) {
      setError("Enter a valid 10-digit phone number.");
      return false;
    }

    setError("");
    return true;
  };

  const canGoNextFromStep2 = () => {
    const requiredFields = [
      "address",
      "city",
      "state",
      "postalCode",
      "country",
    ];

    const missing = requiredFields.filter((field) => !address[field].trim());

    if (missing.length > 0) {
      setError("Please fill in all shipping address details.");
      return false;
    }

    if (!/^\d{6}$/.test(address.postalCode)) {
      setError("Enter a valid 6-digit postal code.");
      return false;
    }

    setError("");
    return true;
  };

  const canGoNextFromStep3 = () => {
    if (!paymentMethod) {
      setError("Please choose a payment method.");
      return false;
    }

    setError("");
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    const shippingAddress = {
      fullName: contact.fullName,
      address: address.address,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: contact.phone,
    };

    const requiredFields = [
      "fullName",
      "address",
      "city",
      "state",
      "postalCode",
      "country",
      "phone",
    ];

    const missing = requiredFields.filter(
      (field) => !shippingAddress[field]?.trim()
    );

    if (missing.length > 0) {
      setError("Please complete your contact and shipping information.");
      setStep(1);
      return;
    }

    if (!paymentMethod) {
      setError("Please choose a payment method.");
      setStep(3);
      return;
    }

    try {
      setError("");
      setIsPlacingOrder(true);

      const payload = {
        orderItems: items.map((item) => ({
          product: item.productId,
          qty: item.quantity,
        })),
        shippingAddress,
        paymentMethod: paymentMethod === 'cod' ? 'Cash on delivery' : paymentMethod,
        shippingPrice,
        taxPrice,
        couponCode: appliedCouponCode || undefined,
      };

      const response = await api.post("/api/orders", payload);

      localStorage.removeItem("cartItems");
      window.dispatchEvent(new Event("cartItemsUpdated"));

      setSuccess("Order placed successfully! Redirecting...");

      setTimeout(() => {
        navigate(`/order-success?orderId=${response.data._id}`, {
          replace: true,
          state: {
            orderId: response.data._id,
          },
        });
      }, 1500);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to place order. Please try again.";
      setError(message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const steps = [
    { id: 1, name: "Information", icon: "📝" },
    { id: 2, name: "Shipping", icon: "🚚" },
    { id: 3, name: "Payment", icon: "💳" },
    { id: 4, name: "Review", icon: "✓" },
  ];

  const renderStepHeader = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((item, index) => (
          <div key={item.id} className="flex items-center flex-1">
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  step > item.id
                    ? 'bg-success text-white'
                    : step === item.id
                    ? 'bg-accent-primary text-white'
                    : 'bg-surface-secondary text-muted'
                }`}
              >
                {step > item.id ? '✓' : item.icon}
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap text-muted hidden md:block">
                {item.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded-full ${
                  step > item.id ? 'bg-success' : 'bg-border-subtle'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStepBody = () => {
    if (step === 1) {
      return (
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
            <span>📝</span> Contact Information
          </h2>
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Full Name *
                </label>
                <input
                  name="fullName"
                  value={contact.fullName}
                  onChange={handleContactChange}
                  placeholder="John Doe"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Email Address *
                </label>
                <input
                  name="email"
                  value={contact.email}
                  onChange={handleContactChange}
                  placeholder="john@example.com"
                  type="email"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Phone Number *
                </label>
                <input
                  name="phone"
                  value={contact.phone}
                  onChange={handleContactChange}
                  placeholder="9876543210"
                  className="input w-full"
                />
                <p className="text-xs text-muted mt-1">
                  We'll only use this for order updates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saveInfo"
                checked={saveInfo}
                onChange={(e) => setSaveInfo(e.target.checked)}
                className="w-4 h-4 rounded border-border-subtle text-accent-primary"
              />
              <label htmlFor="saveInfo" className="text-sm text-muted">
                Save this information for next time
              </label>
            </div>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
            <span>🚚</span> Shipping Address
          </h2>
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Street Address *
                </label>
                <input
                  name="address"
                  value={address.address}
                  onChange={handleAddressChange}
                  placeholder="123 Main St"
                  className="input w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    City *
                  </label>
                  <input
                    name="city"
                    value={address.city}
                    onChange={handleAddressChange}
                    placeholder="Mumbai"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    State *
                  </label>
                  <input
                    name="state"
                    value={address.state}
                    onChange={handleAddressChange}
                    placeholder="Maharashtra"
                    className="input w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Postal Code *
                  </label>
                  <input
                    name="postalCode"
                    value={address.postalCode}
                    onChange={handleAddressChange}
                    placeholder="400001"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Country *
                  </label>
                  <select
                    name="country"
                    value={address.country}
                    onChange={handleAddressChange}
                    className="input w-full"
                  >
                    <option value="India">India</option>
                    <option value="USA">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="UAE">UAE</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
            <span>💳</span> Payment Method
          </h2>
          <div className="space-y-3">
            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
              paymentMethod === 'cod'
                ? 'border-accent-primary bg-accent-soft'
                : 'border-border-subtle bg-surface-secondary hover:border-accent-primary/50'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-4 h-4 text-accent-primary"
              />
              <div className="flex-1">
                <p className="font-medium text-primary">Cash on Delivery</p>
                <p className="text-xs text-muted">Pay when you receive your order</p>
              </div>
              <span className="text-2xl">💵</span>
            </label>

            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer opacity-50 ${
              paymentMethod === 'upi'
                ? 'border-accent-primary bg-accent-soft'
                : 'border-border-subtle bg-surface-secondary'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="upi"
                checked={paymentMethod === "upi"}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-4 h-4 text-accent-primary"
                disabled
              />
              <div className="flex-1">
                <p className="font-medium text-primary">UPI / NetBanking</p>
                <p className="text-xs text-muted">Coming soon</p>
              </div>
              <span className="text-2xl">📱</span>
            </label>

            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer opacity-50 ${
              paymentMethod === 'card'
                ? 'border-accent-primary bg-accent-soft'
                : 'border-border-subtle bg-surface-secondary'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === "card"}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-4 h-4 text-accent-primary"
                disabled
              />
              <div className="flex-1">
                <p className="font-medium text-primary">Credit/Debit Card</p>
                <p className="text-xs text-muted">Coming soon</p>
              </div>
              <span className="text-2xl">💳</span>
            </label>
          </div>
          <p className="text-sm text-muted bg-warning/10 p-4 rounded-xl border border-warning/20">
            <span className="font-medium text-warning">Note:</span> Other payment methods are simulated for now. The order will be created in an unpaid state until marked as paid.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
          <span>✓</span> Review Your Order
        </h2>
        
        {/* Contact & Shipping Review */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-xl bg-surface-secondary border border-border-subtle">
            <h3 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
              <span>👤</span> Contact Information
            </h3>
            <div className="space-y-1 text-sm">
              <p className="text-primary">{contact.fullName}</p>
              <p className="text-muted">{contact.email}</p>
              <p className="text-muted">{contact.phone}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-secondary border border-border-subtle">
            <h3 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
              <span>📍</span> Shipping Address
            </h3>
            <div className="space-y-1 text-sm">
              <p className="text-primary">{contact.fullName}</p>
              <p className="text-muted">{address.address}</p>
              <p className="text-muted">
                {address.city}, {address.state} {address.postalCode}
              </p>
              <p className="text-muted">{address.country}</p>
            </div>
          </div>
        </div>

        {/* Payment Method Review */}
        <div className="p-4 rounded-xl bg-surface-secondary border border-border-subtle">
          <h3 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
            <span>💳</span> Payment Method
          </h3>
          <p className="text-primary">Cash on Delivery</p>
          <p className="text-xs text-muted mt-1">You'll pay when you receive your order</p>
        </div>

        {/* Coupon Section */}
        <div className="space-y-3">
          {appliedCouponCode ? (
            <div className="p-4 rounded-xl bg-success/10 border border-success/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-success">Coupon Applied</p>
                  <p className="text-xs text-primary">{appliedCouponCode}</p>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-muted hover:text-error transition-colors"
                >
                  ✕
                </button>
              </div>
              {couponFeedback && (
                <p className="text-xs text-success mt-2">{couponFeedback}</p>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Have a coupon code?"
                className="input flex-1 text-sm"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon || items.length === 0}
                className="btn-primary px-6 py-2 text-sm whitespace-nowrap"
              >
                {isApplyingCoupon ? '...' : 'Apply'}
              </button>
            </div>
          )}
          {couponError && (
            <p className="text-xs text-error">{couponError}</p>
          )}
        </div>

        {/* Order Total */}
        <div className="p-4 rounded-xl bg-surface-secondary border border-border-subtle">
          <h3 className="text-sm font-medium text-primary mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="text-primary">{formatCurrency(itemsPrice)}</span>
            </div>
            {effectiveDiscount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount ({appliedCouponCode})</span>
                <span>-{formatCurrency(effectiveDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted">Shipping</span>
              <span className={shippingPrice === 0 ? 'text-success' : 'text-primary'}>
                {shippingPrice === 0 ? 'Free' : formatCurrency(shippingPrice)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Tax (5%)</span>
              <span className="text-primary">{formatCurrency(taxPrice)}</span>
            </div>
            <div className="border-t border-border-subtle pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-primary">Total</span>
                <span className="text-xl text-accent-primary">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={isPlacingOrder || items.length === 0}
          className="w-full btn-primary py-3 text-base font-medium group disabled:opacity-50"
        >
          {isPlacingOrder ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Placing Order...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>Place Order</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          )}
        </button>

        <p className="text-xs text-muted text-center">
          By placing your order, you agree to our{" "}
          <Link to="/terms" className="text-accent-primary hover:text-accent-secondary">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-accent-primary hover:text-accent-secondary">
            Privacy Policy
          </Link>
        </p>
      </div>
    );
  };

  const handleNext = () => {
    if (step === 1 && !canGoNextFromStep1()) return;
    if (step === 2 && !canGoNextFromStep2()) return;
    if (step === 3 && !canGoNextFromStep3()) return;

    setStep((previous) => Math.min(previous + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setError("");
    setStep((previous) => Math.max(previous - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-page">
        <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-8xl mb-6 animate-bounce-slow">🛒</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-muted mb-8 max-w-md mx-auto">
              Add some fragrances to your cart before proceeding to checkout.
            </p>
            <Link
              to="/products"
              className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-3 group"
            >
              <span>Browse Fragrances</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Progress Bar */}
      <div className="border-b border-border-subtle bg-surface-primary/80 backdrop-blur-sm sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          {renderStepHeader()}
        </div>
      </div>

      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">
              Checkout
            </h1>
            <p className="text-muted">
              {steps.find(s => s.id === step)?.name} - Step {step} of 4
            </p>
          </div>
          <Link
            to="/cart"
            className="btn-outline inline-flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Cart</span>
          </Link>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-xl border border-error/20 bg-error/10 p-4 animate-shake">
            <div className="flex items-center gap-3">
              <span className="text-error text-lg">⚠️</span>
              <p className="text-sm text-error">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 rounded-xl border border-success/20 bg-success/10 p-4 animate-slide-up">
            <div className="flex items-center gap-3">
              <span className="text-success text-lg">✓</span>
              <p className="text-sm text-success">{success}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              {renderStepBody()}

              {/* Navigation Buttons */}
              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={handleBack}
                  disabled={step === 1}
                  className="btn-outline px-6 py-2 text-sm disabled:opacity-40"
                >
                  ← Back
                </button>
                {step < 4 && (
                  <button
                    onClick={handleNext}
                    className="btn-primary px-6 py-2 text-sm group"
                  >
                    <span className="flex items-center gap-2">
                      <span>Continue</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-32">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <span>📋</span> Order Summary
              </h2>

              {/* Items List */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 mb-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-3 p-2 rounded-lg hover:bg-surface-secondary transition-colors"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-12 w-12 rounded-lg object-cover border border-border-subtle"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary truncate">{item.name}</p>
                      <p className="text-xs text-muted">
                        Qty {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-accent-primary">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-sm pt-4 border-t border-border-subtle">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="text-primary">{formatCurrency(itemsPrice)}</span>
                </div>
                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-{formatCurrency(effectiveDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">Shipping</span>
                  <span className={shippingPrice === 0 ? 'text-success' : 'text-primary'}>
                    {shippingPrice === 0 ? 'Free' : formatCurrency(shippingPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Tax (5%)</span>
                  <span className="text-primary">{formatCurrency(taxPrice)}</span>
                </div>
                <div className="border-t border-border-subtle pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-primary">Total</span>
                    <span className="text-xl text-accent-primary">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Free Shipping Message */}
              {itemsPrice > 999 && (
                <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-xs text-success flex items-center gap-2">
                    <span>🎉</span>
                    You've qualified for free shipping!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Checkout;