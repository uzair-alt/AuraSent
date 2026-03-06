import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";

function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [shipping, setShipping] = useState({
    fullName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponFeedback, setCouponFeedback] = useState("");
  const [couponError, setCouponError] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const formRef = useRef(null);

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

    // Mock saved addresses - in real app, fetch from API
    setSavedAddresses([
      {
        id: 1,
        fullName: "John Doe",
        address: "123 Main St",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
        phone: "9876543210",
        isDefault: true,
      }
    ]);
  }, []);

  const syncCart = (nextItems) => {
    setItems(nextItems);
    localStorage.setItem("cartItems", JSON.stringify(nextItems));
    window.dispatchEvent(new Event("cartItemsUpdated"));
  };

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
  const taxPrice = Math.round(itemsPrice * 0.05); // 5% tax
  const effectiveDiscount = Math.max(
    0,
    Math.min(couponDiscount, itemsPrice)
  );
  const totalPrice = itemsPrice - effectiveDiscount + shippingPrice + taxPrice;

  const handleQuantityChange = (productId, value) => {
    const nextQuantity = Math.max(1, Number(value) || 1);

    const nextItems = items.map((item) =>
      item.productId === productId ? { ...item, quantity: nextQuantity } : item
    );

    syncCart(nextItems);
  };

  const handleQuantityStep = (productId, delta) => {
    const nextItems = items.map((item) => {
      if (item.productId !== productId) {
        return item;
      }

      const nextQuantity = Math.max(1, (item.quantity || 1) + delta);

      return {
        ...item,
        quantity: nextQuantity,
      };
    });

    syncCart(nextItems);
  };

  const handleRemove = (productId) => {
    const nextItems = items.filter((item) => item.productId !== productId);
    syncCart(nextItems);
  };

  const handleShippingChange = (event) => {
    const { name, value } = event.target;
    setShipping((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setShipping(address);
  };

  const validate = () => {
    if (!items.length) {
      setError("Your cart is empty.");
      return false;
    }

    const requiredFields = [
      "fullName",
      "address",
      "city",
      "state",
      "postalCode",
      "country",
      "phone",
    ];

    const missing = requiredFields.filter((field) => !shipping[field]?.trim());

    if (missing.length > 0) {
      setError("Please fill in all shipping details.");
      return false;
    }

    if (!paymentMethod) {
      setError("Please choose a payment method.");
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validate()) {
      setActiveStep(2);
      return;
    }

    try {
      setIsPlacingOrder(true);

      const payload = {
        orderItems: items.map((item) => ({
          product: item.productId,
          qty: item.quantity,
        })),
        shippingAddress: shipping,
        paymentMethod,
        shippingPrice,
        taxPrice,
        couponCode: appliedCouponCode || undefined,
      };

      const response = await api.post("/api/orders", payload);

      localStorage.removeItem("cartItems");
      setItems([]);
      setCouponCode("");
      setCouponDiscount(0);
      setAppliedCouponCode("");
      setCouponFeedback("");
      setSuccess("Order placed successfully!");

      setTimeout(() => {
        navigate("/my-orders?placed=1", { replace: true, state: { orderId: response.data._id } });
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

  const steps = [
    { id: 1, name: "Cart", icon: "🛒" },
    { id: 2, name: "Shipping", icon: "🚚" },
    { id: 3, name: "Payment", icon: "💳" },
  ];

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
              Looks like you haven't added any fragrances to your cart yet.
              Explore our collection and find your perfect scent!
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
    <div className="min-h-screen bg-page pb-24 md:pb-10">
      {/* Checkout Steps */}
      <div className="border-b border-border-subtle bg-surface-primary/80 backdrop-blur-sm sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-2 md:gap-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${
                  activeStep >= step.id ? 'text-accent-primary' : 'text-muted'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activeStep > step.id
                      ? 'bg-success/20 text-success'
                      : activeStep === step.id
                      ? 'bg-accent-primary text-white'
                      : 'bg-surface-secondary text-muted'
                  }`}>
                    {activeStep > step.id ? '✓' : step.icon}
                  </div>
                  <span className="hidden md:inline text-sm font-medium">
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    activeStep > step.id ? 'bg-success' : 'bg-border-subtle'
                  }`} />
                )}
              </div>
            ))}
          </div>
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
              {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          <Link
            to="/products"
            className="btn-outline inline-flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Continue Shopping</span>
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

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Cart Items & Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <span>🛒</span> Cart Items
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-4 p-4 rounded-xl border border-border-subtle bg-surface-secondary hover-lift transition-all"
                  >
                    {item.image && (
                      <div className="h-24 w-24 flex-none overflow-hidden rounded-lg border border-border-subtle bg-surface-tertiary">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-medium text-primary">{item.name}</h3>
                        <p className="text-sm text-accent-primary mt-1">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted">Qty:</span>
                          <div className="inline-flex items-center rounded-lg border border-border-subtle bg-surface-primary">
                            <button
                              type="button"
                              onClick={() => handleQuantityStep(item.productId, -1)}
                              className="px-3 py-1 text-primary hover:bg-surface-secondary transition-colors"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                              className="w-16 bg-transparent px-2 py-1 text-center text-primary outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuantityStep(item.productId, 1)}
                              className="px-3 py-1 text-primary hover:bg-surface-secondary transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-accent-primary">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => handleRemove(item.productId)}
                            className="text-muted hover:text-error transition-colors"
                          >
                            <span className="text-lg">🗑️</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Addresses */}
            {savedAddresses.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                  <span>📍</span> Saved Addresses
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedAddress?.id === addr.id
                          ? 'border-accent-primary bg-accent-soft'
                          : 'border-border-subtle bg-surface-secondary hover:border-accent-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-primary">{addr.fullName}</span>
                        {addr.isDefault && (
                          <span className="text-xs px-2 py-1 rounded-full bg-accent-soft text-accent-primary">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted">{addr.address}</p>
                      <p className="text-sm text-muted">
                        {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                      <p className="text-sm text-muted">{addr.country}</p>
                      <p className="text-sm text-muted mt-2">📞 {addr.phone}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Form */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <span>🚚</span> Shipping Address
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  name="fullName"
                  value={shipping.fullName}
                  onChange={handleShippingChange}
                  placeholder="Full Name *"
                  className="input w-full"
                />
                <input
                  type="text"
                  name="phone"
                  value={shipping.phone}
                  onChange={handleShippingChange}
                  placeholder="Phone Number *"
                  className="input w-full"
                />
                <input
                  type="text"
                  name="address"
                  value={shipping.address}
                  onChange={handleShippingChange}
                  placeholder="Address *"
                  className="input w-full sm:col-span-2"
                />
                <input
                  type="text"
                  name="city"
                  value={shipping.city}
                  onChange={handleShippingChange}
                  placeholder="City *"
                  className="input w-full"
                />
                <input
                  type="text"
                  name="state"
                  value={shipping.state}
                  onChange={handleShippingChange}
                  placeholder="State *"
                  className="input w-full"
                />
                <input
                  type="text"
                  name="postalCode"
                  value={shipping.postalCode}
                  onChange={handleShippingChange}
                  placeholder="Postal Code *"
                  className="input w-full"
                />
                <select
                  name="country"
                  value={shipping.country}
                  onChange={handleShippingChange}
                  className="input w-full"
                >
                  <option value="India">India</option>
                  <option value="USA">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="UAE">UAE</option>
                </select>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <span>💳</span> Payment Method
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 rounded-xl border border-border-subtle bg-surface-secondary hover:border-accent-primary transition-colors cursor-pointer">
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

                <label className="flex items-center gap-3 p-4 rounded-xl border border-border-subtle bg-surface-secondary hover:border-accent-primary transition-colors cursor-pointer opacity-50">
                  <input
                    type="radio"
                    disabled
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-primary">Credit/Debit Card</p>
                    <p className="text-xs text-muted">Coming soon</p>
                  </div>
                  <span className="text-2xl">💳</span>
                </label>

                <label className="flex items-center gap-3 p-4 rounded-xl border border-border-subtle bg-surface-secondary hover:border-accent-primary transition-colors cursor-pointer opacity-50">
                  <input
                    type="radio"
                    disabled
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-primary">UPI / NetBanking</p>
                    <p className="text-xs text-muted">Coming soon</p>
                  </div>
                  <span className="text-2xl">📱</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-32">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <span>📋</span> Order Summary
              </h2>

              {/* Coupon Section */}
              <div className="mb-6">
                {appliedCouponCode ? (
                  <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-success">Coupon Applied</span>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-muted hover:text-error transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-sm text-primary">{appliedCouponCode}</p>
                    <p className="text-xs text-success mt-1">{couponFeedback}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code"
                        className="input flex-1 text-sm"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon}
                        className="btn-primary px-4 py-2 text-sm whitespace-nowrap"
                      >
                        {isApplyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-error">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm mb-6">
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

                {itemsPrice > 999 && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-xs text-success flex items-center gap-2">
                      <span>🎉</span>
                      Free shipping applied! (Orders over ₹999)
                    </p>
                  </div>
                )}

                <div className="border-t border-border-subtle pt-3 mt-3">
                  <div className="flex justify-between font-semibold">
                    <span className="text-primary">Total</span>
                    <span className="text-xl font-bold text-accent-primary">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Inclusive of all taxes
                  </p>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full btn-primary py-3 text-base font-medium group disabled:opacity-50"
              >
                {isPlacingOrder ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Place Order</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                )}
              </button>

              <p className="text-xs text-muted text-center mt-4">
                By placing your order, you agree to our{" "}
                <Link to="/terms" className="text-accent-primary hover:text-accent-secondary">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-accent-primary hover:text-accent-secondary">
                  Privacy Policy
                </Link>
              </p>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-border-subtle">
                <div className="flex items-center justify-center gap-4 text-xs text-muted">
                  <div className="flex items-center gap-1">
                    <span className="text-success">✓</span>
                    Secure Checkout
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-success">✓</span>
                    100% Safe
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-success">✓</span>
                    Cash on Delivery
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Checkout Bar */}
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface-primary/95 backdrop-blur-sm md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted">Total</p>
                <p className="text-lg font-bold text-accent-primary">
                  {formatCurrency(totalPrice)}
                </p>
                {effectiveDiscount > 0 && (
                  <p className="text-xs text-success">
                    Saved {formatCurrency(effectiveDiscount)}
                  </p>
                )}
              </div>
              <button
                onClick={() => formRef.current?.requestSubmit()}
                disabled={isPlacingOrder}
                className="flex-1 btn-primary py-2 text-sm font-medium max-w-50"
              >
                {isPlacingOrder ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;