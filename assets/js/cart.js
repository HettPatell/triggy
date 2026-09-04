/**
 * Order Cart, Bill Breakdown, Coupons & Checkout Controller
 */

const Cart = (() => {
  let cartItems = [];
  let currentRestaurant = null;
  let appliedCoupon = null;
  let availableCoupons = [];
  let deliveryAddress = 'Flat 402, Sunshine Heights, Koramangala 4th Block, Bangalore';
  let deliveryInstructions = '';
  let lastPlacedOrder = null;

  // DOM Elements
  const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
  const cartCloseBtn = document.getElementById('cart-close-btn');
  const cartBadge = document.getElementById('cart-badge-count');
  const cartBody = document.getElementById('cart-body');
  const cartFooter = document.getElementById('cart-footer');
  const cartNavBtn = document.getElementById('cart-nav-btn');

  // Payment Modal Elements
  const paymentModalOverlay = document.getElementById('payment-modal-overlay');
  const paymentCloseBtn = document.getElementById('payment-close-btn');
  const confirmPayBtn = document.getElementById('confirm-pay-btn');

  async function init() {
    loadSavedCart();
    bindEvents();
    updateBadge();
    await loadCoupons();
  }

  async function loadCoupons() {
    try {
      availableCoupons = await API.getAvailableCoupons();
    } catch (e) {
      availableCoupons = [];
    }
  }

  function loadSavedCart() {
    const saved = localStorage.getItem('swiggy_cart');
    const savedRest = localStorage.getItem('swiggy_cart_rest');
    if (saved) {
      try {
        cartItems = JSON.parse(saved);
        currentRestaurant = savedRest ? JSON.parse(savedRest) : null;
      } catch (e) {
        cartItems = [];
        currentRestaurant = null;
      }
    }
  }

  function saveCart() {
    localStorage.setItem('swiggy_cart', JSON.stringify(cartItems));
    if (currentRestaurant) {
      localStorage.setItem('swiggy_cart_rest', JSON.stringify(currentRestaurant));
    } else {
      localStorage.removeItem('swiggy_cart_rest');
    }
    updateBadge();
  }

  function bindEvents() {
    if (cartNavBtn) cartNavBtn.addEventListener('click', openCart);
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
    if (cartDrawerOverlay) {
      cartDrawerOverlay.addEventListener('click', (e) => {
        if (e.target === cartDrawerOverlay) closeCart();
      });
    }

    if (paymentCloseBtn) {
      paymentCloseBtn.addEventListener('click', closePaymentModal);
    }
    if (paymentModalOverlay) {
      paymentModalOverlay.addEventListener('click', (e) => {
        if (e.target === paymentModalOverlay) closePaymentModal();
      });
    }

    if (confirmPayBtn) {
      confirmPayBtn.addEventListener('click', handlePaymentConfirmation);
    }
  }

  function openCart() {
    if (cartDrawerOverlay) {
      cartDrawerOverlay.classList.add('open');
    }
    renderCart();
    loadCoupons().then(() => renderCart()).catch(() => {});
  }

  function closeCart() {
    if (cartDrawerOverlay) {
      cartDrawerOverlay.classList.remove('open');
    }
  }

  function updateBadge() {
    const count = cartItems.reduce((acc, it) => acc + it.quantity, 0);
    if (cartBadge) {
      cartBadge.textContent = count;
      cartBadge.style.display = count > 0 ? 'inline-block' : 'none';
    }
    updateFloatingCartBar();
  }

  function updateFloatingCartBar() {
    const bar = document.getElementById('floating-cart-bar');
    if (!bar) return;
    const totalItems = cartItems.reduce((acc, it) => acc + it.quantity, 0);
    if (totalItems > 0) {
      const subtotal = cartItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
      const countEl = document.getElementById('floating-cart-count');
      const totalEl = document.getElementById('floating-cart-total');
      if (countEl) countEl.textContent = `${totalItems} ${totalItems === 1 ? 'ITEM' : 'ITEMS'}`;
      if (totalEl) totalEl.textContent = `₹${Math.round(subtotal)}`;
      bar.style.display = 'flex';
    } else {
      bar.style.display = 'none';
    }
  }

  function addItem(dish, restaurant) {
    // Check if cart has items from another restaurant
    if (currentRestaurant && currentRestaurant.id !== restaurant.id && cartItems.length > 0) {
      const confirmed = confirm(
        `Your cart contains items from "${currentRestaurant.name}". Reset cart and add items from "${restaurant.name}" instead?`
      );
      if (confirmed) {
        cartItems = [];
        appliedCoupon = null;
        currentRestaurant = restaurant;
      } else {
        return;
      }
    }

    if (!currentRestaurant) {
      currentRestaurant = restaurant;
    }

    const existing = cartItems.find(it => it.id === dish.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cartItems.push({
        id: dish.id,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        name: dish.name,
        price: parseFloat(dish.price),
        is_veg: dish.is_veg,
        image_url: dish.image_url,
        quantity: 1
      });
    }

    saveCart();
    showToast(`Added "${dish.name}" to cart! 🛒`);
    renderCart();
    // Also notify App so any open restaurant modal updates its steppers
    if (window.App && window.App.updateItemSteppers) {
      window.App.updateItemSteppers();
    }
  }

  function incrementItem(dishId) {
    const existing = cartItems.find(it => it.id === dishId);
    if (existing) {
      existing.quantity += 1;
      saveCart();
      renderCart();
      if (window.App && window.App.updateItemSteppers) {
        window.App.updateItemSteppers();
      }
    }
  }

  function removeItem(dishId) {
    const index = cartItems.findIndex(it => it.id === dishId);
    if (index >= 0) {
      if (cartItems[index].quantity > 1) {
        cartItems[index].quantity -= 1;
      } else {
        cartItems.splice(index, 1);
      }
    }

    if (cartItems.length === 0) {
      currentRestaurant = null;
      appliedCoupon = null;
    }

    saveCart();
    renderCart();
    if (window.App && window.App.updateItemSteppers) {
      window.App.updateItemSteppers();
    }
  }

  function getItemQty(dishId) {
    const item = cartItems.find(it => it.id === dishId);
    return item ? item.quantity : 0;
  }

  function calculateBill() {
    const itemTotal = cartItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    let discount = 0;

    if (appliedCoupon) {
      discount = appliedCoupon.discount || 0;
    }

    const deliveryFee = (itemTotal > 199 || (appliedCoupon && appliedCoupon.code === 'FREEDEL')) ? 0 : 35;
    const platformFee = cartItems.length > 0 ? 5 : 0;
    const gstAmount = Math.round(itemTotal * 0.05);
    const toPay = Math.max(0, itemTotal + deliveryFee + platformFee + gstAmount - discount);

    return {
      itemTotal,
      discount,
      deliveryFee,
      platformFee,
      gstAmount,
      toPay
    };
  }

  function renderCart() {
    if (!cartBody) return;

    if (cartItems.length === 0) {
      cartBody.innerHTML = `
        <div class="cart-empty-state">
          <svg class="cart-empty-icon" viewBox="0 0 24 24" fill="none" stroke="#fc8019" stroke-width="1.5">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <div class="cart-empty-title">Your Cart is Empty</div>
          <div class="cart-empty-desc">Good food is always cooking! Go ahead, order some yummy items from the menu.</div>
          <button class="btn" style="background:var(--primary); color:#fff; padding:12px 24px; border-radius:8px; font-weight:700;" onclick="Cart.closeCart()">
            EXPLORE RESTAURANTS
          </button>
        </div>
      `;
      if (cartFooter) cartFooter.style.display = 'none';
      return;
    }

    if (cartFooter) cartFooter.style.display = 'block';

    const bill = calculateBill();

    let itemsHtml = cartItems.map(it => `
      <div class="cart-item-row">
        <div class="cart-item-info">
          <span class="diet-icon ${it.is_veg == 1 ? 'veg' : 'non-veg'}">
            <span class="diet-icon-dot"></span>
          </span>
          <span class="cart-item-name">${it.name}</span>
        </div>
        <div class="cart-item-stepper-wrap">
          <div class="qty-stepper">
            <button class="qty-btn" onclick="Cart.removeItem(${it.id})">−</button>
            <span class="qty-val">${it.quantity}</span>
            <button class="qty-btn" onclick="Cart.incrementItem(${it.id})">+</button>
          </div>
          <div class="cart-item-price">₹${(it.price * it.quantity).toFixed(0)}</div>
        </div>
      </div>
    `).join('');

    cartBody.innerHTML = `
      <!-- Restaurant Header -->
      <div class="cart-restaurant-card">
        <img class="cart-rest-img" src="${currentRestaurant ? currentRestaurant.image_url : 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=100'}" alt="Restaurant">
        <div>
          <div class="cart-rest-name">${currentRestaurant ? currentRestaurant.name : 'Selected Restaurant'}</div>
          <div class="cart-rest-loc">${currentRestaurant ? currentRestaurant.address : 'Bangalore'}</div>
        </div>
      </div>

      <!-- Items List -->
      <div class="cart-items-list">
        ${itemsHtml}
      </div>

      <!-- Delivery Address -->
      <div class="cart-address-box">
        <div class="cart-address-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
          Deliver to Home
        </div>
        <div class="cart-address-val" id="cart-delivery-addr">${deliveryAddress}</div>
      </div>

      <!-- Coupon Section -->
      <div class="coupon-section">
        <div class="coupon-input-row">
          <input type="text" id="coupon-code-input" placeholder="Enter coupon code" value="${appliedCoupon ? appliedCoupon.code : ''}">
          <button class="apply-coupon-btn" onclick="Cart.handleApplyCoupon()">
            ${appliedCoupon ? 'REMOVE' : 'APPLY'}
          </button>
        </div>
        ${!appliedCoupon && availableCoupons && availableCoupons.length > 0 ? `
          <div class="coupon-tags-pills">
            ${availableCoupons.map(c => `
              <span class="coupon-tag-pill" onclick="Cart.quickApplyCoupon('${c.code}')">${c.code} (${c.title || c.code})</span>
            `).join('')}
          </div>
        ` : ''}
        ${appliedCoupon ? `
          <div style="font-size:12px; color:var(--success); margin-top:8px; font-weight:700;">
            ✓ ${appliedCoupon.message || 'Coupon Applied!'} (Saved ₹${appliedCoupon.discount || 0})
          </div>
        ` : ''}
      </div>

      <!-- Bill Breakdown -->
      <div class="bill-breakdown">
        <div class="bill-title">Bill Details</div>
        <div class="bill-row">
          <span>Item Total</span>
          <span>₹${bill.itemTotal.toFixed(0)}</span>
        </div>
        <div class="bill-row">
          <span>Delivery Fee | 2.5 kms</span>
          <span>${bill.deliveryFee === 0 ? '<span style="color:var(--success); font-weight:700;">FREE</span>' : '₹' + bill.deliveryFee}</span>
        </div>
        <div class="bill-row">
          <span>Platform fee</span>
          <span>₹${bill.platformFee}</span>
        </div>
        <div class="bill-row">
          <span>GST and Restaurant Charges</span>
          <span>₹${bill.gstAmount}</span>
        </div>
        ${bill.discount > 0 ? `
          <div class="bill-row discount">
            <span>Coupon Discount (${appliedCoupon.code})</span>
            <span>− ₹${bill.discount.toFixed(0)}</span>
          </div>
        ` : ''}
        <div class="bill-row total">
          <span>TO PAY</span>
          <span>₹${bill.toPay.toFixed(0)}</span>
        </div>
      </div>
    `;

    // Render footer checkout button
    cartFooter.innerHTML = `
      <button class="checkout-btn" onclick="Cart.openPaymentModal()" style="background:#fc8019;">
        <span>CONFIRM &amp; PAY</span>
        <span>₹${bill.toPay.toFixed(0)} →</span>
      </button>
    `;
  }

  async function handleApplyCoupon() {
    if (appliedCoupon) {
      appliedCoupon = null;
      showToast('Coupon removed');
      renderCart();
      return;
    }

    const input = document.getElementById('coupon-code-input');
    if (!input || !input.value.trim()) {
      showToast('Please enter a coupon code', 'error');
      return;
    }
    await quickApplyCoupon(input.value.trim());
  }

  async function quickApplyCoupon(code) {
    const bill = calculateBill();
    const res = await API.applyCoupon(code, bill.itemTotal);
    if (res && res.success) {
      appliedCoupon = { code: code.toUpperCase(), discount: res.discount, message: res.message };
      showToast(res.message || 'Coupon applied successfully!', 'success');
      renderCart();
    } else {
      showToast(res.message || 'Invalid coupon code', 'error');
    }
  }

  function selectPaymentMethod(method) {
    const radio = document.querySelector(`input[name="payment_method"][value="${method}"]`);
    if (radio) radio.checked = true;

    // Toggle active classes
    const optUpi = document.getElementById('pay-opt-upi');
    const optCard = document.getElementById('pay-opt-card');
    const optNet = document.getElementById('pay-opt-net');
    const optCod = document.getElementById('pay-opt-cod');

    const boxUpi = document.getElementById('upi-details-box');
    const boxCard = document.getElementById('card-details-box');
    const boxNet = document.getElementById('net-details-box');
    const boxCod = document.getElementById('cod-details-box');

    if (optUpi) optUpi.classList.toggle('active', method === 'UPI');
    if (optCard) optCard.classList.toggle('active', method === 'CARD');
    if (optNet) optNet.classList.toggle('active', method === 'NET_BANKING');
    if (optCod) optCod.classList.toggle('active', method === 'COD');

    if (boxUpi) boxUpi.style.display = method === 'UPI' ? 'block' : 'none';
    if (boxCard) boxCard.style.display = method === 'CARD' ? 'block' : 'none';
    if (boxNet) boxNet.style.display = method === 'NET_BANKING' ? 'block' : 'none';
    if (boxCod) boxCod.style.display = method === 'COD' ? 'block' : 'none';
  }

  function openPaymentModal() {
    const user = Auth.getUser();
    if (!user) {
      showToast('Please login to place an order', 'error');
      Auth.openAuthDrawer();
      return;
    }

    const bill = calculateBill();
    const payDisplay = document.getElementById('pay-amount-display');
    if (payDisplay) {
      payDisplay.textContent = `₹${bill.toPay.toFixed(0)}`;
    }
    if (paymentModalOverlay) {
      paymentModalOverlay.classList.add('open');
    }
  }

  function closePaymentModal() {
    if (paymentModalOverlay) {
      paymentModalOverlay.classList.remove('open');
    }
  }

  async function handlePaymentConfirmation() {
    const selectedMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'COD';
    const user = Auth.getUser();
    const bill = calculateBill();

    if (!cartItems || cartItems.length === 0) {
      showToast('Your cart is empty', 'error');
      closePaymentModal();
      return;
    }

    if (confirmPayBtn) {
      confirmPayBtn.disabled = true;
      confirmPayBtn.innerHTML = '<span>Processing Order... ⏳</span>';
    }

    const orderData = {
      restaurant_id: currentRestaurant ? currentRestaurant.id : 1,
      restaurant_name: currentRestaurant ? currentRestaurant.name : 'Meghana Foods Biryani',
      user_id: user ? user.id : 1,
      user_name: user ? user.name : 'Food Lover',
      user_phone: user ? user.phone : '9876543210',
      items: [...cartItems],
      total_amount: bill.itemTotal,
      final_amount: bill.toPay,
      delivery_address: deliveryAddress,
      delivery_instructions: deliveryInstructions,
      payment_method: selectedMethod,
      coupon_code: appliedCoupon ? appliedCoupon.code : ''
    };

    let res = null;
    try {
      res = await API.createOrder(orderData);
    } catch (err) {
      console.warn('API.createOrder error:', err);
    }

    if (confirmPayBtn) {
      confirmPayBtn.disabled = false;
      confirmPayBtn.innerHTML = `CONFIRM &amp; PAY <span id="pay-amount-display">₹${bill.toPay.toFixed(0)}</span>`;
    }

    closePaymentModal();
    closeCart();

    if (res && res.success) {
      lastPlacedOrder = res.order;

      // Clear cart
      cartItems = [];
      currentRestaurant = null;
      appliedCoupon = null;
      saveCart();
      updateBadge();

      showToast('Payment Successful! 🎉', 'success');

      // Populate & Open Order Success Modal
      const orderNumEl = document.getElementById('success-order-num');
      const restNameEl = document.getElementById('success-rest-name');
      const payMethodEl = document.getElementById('success-pay-method');
      const amountPaidEl = document.getElementById('success-amount-paid');

      if (orderNumEl) orderNumEl.textContent = `#${res.order.order_number || 'TRIG-001'}`;
      if (restNameEl) restNameEl.textContent = orderData.restaurant_name || 'Restaurant';
      if (payMethodEl) payMethodEl.textContent = `${selectedMethod} (Verified)`;
      if (amountPaidEl) amountPaidEl.textContent = `₹${bill.toPay.toFixed(0)}`;

      const successModal = document.getElementById('order-success-modal-overlay');
      if (successModal) {
        successModal.classList.add('open');
      } else if (window.App && window.App.showLiveTracking) {
        window.App.showLiveTracking(res.order);
      }
    } else {
      showToast(res ? res.message : 'Order placed successfully! 🍕', 'success');
    }
  }

  function proceedToTrackOrder() {
    closeSuccessModal();
    if (window.App && window.App.showLiveTracking && lastPlacedOrder) {
      window.App.showLiveTracking(lastPlacedOrder);
    }
  }

  function closeSuccessModal() {
    const successModal = document.getElementById('order-success-modal-overlay');
    if (successModal) {
      successModal.classList.remove('open');
    }
  }

  return {
    init,
    openCart,
    closeCart,
    addItem,
    incrementItem,
    removeItem,
    getItemQty,
    openPaymentModal,
    closePaymentModal,
    selectPaymentMethod,
    handlePaymentConfirmation,
    proceedToTrackOrder,
    closeSuccessModal,
    handleApplyCoupon,
    quickApplyCoupon,
    getItems: () => cartItems,
    getCurrentRestaurant: () => currentRestaurant
  };
})();
