/**
 * Swiggy Clone - Main Application Coordinator
 */

const App = (() => {
  let allRestaurants = [];
  let currentFilter = {
    category: '',
    veg_only: false,
    fast_delivery: false,
    rating: null,
    sort: 'default'
  };
  let activeRestaurant = null;
  let activeRestaurantMenu = [];
  let favorites = { restaurants: [], dishes: [] };

  // DOM Elements
  const categoriesList = document.getElementById('categories-list');
  const restaurantsGrid = document.getElementById('restaurants-grid');
  const searchNavBtn = document.getElementById('search-nav-btn');
  const searchModalOverlay = document.getElementById('search-modal-overlay');
  const searchCloseBtn = document.getElementById('search-close-btn');
  const searchInput = document.getElementById('search-input');
  const searchResultsArea = document.getElementById('search-results-area');
  const favNavBtn = document.getElementById('fav-nav-btn');
  const favBadgeCount = document.getElementById('fav-badge-count');
  const ordersNavBtn = document.getElementById('orders-nav-btn');

  // Restaurant Modal
  const restModalOverlay = document.getElementById('rest-modal-overlay');
  const restModalClose = document.getElementById('rest-modal-close');
  const restMenuScrollArea = document.getElementById('rest-menu-scroll-area');
  const restModalVegToggle = document.getElementById('rest-modal-veg-toggle');

  // Orders / Live Tracking Modal
  const orderModalOverlay = document.getElementById('order-modal-overlay');
  const orderModalClose = document.getElementById('order-modal-close');
  const trackingContainer = document.getElementById('tracking-container');

  // Location Modal
  const locPickerBtn = document.getElementById('loc-picker-btn');
  const locModalOverlay = document.getElementById('loc-modal-overlay');
  const locCloseBtn = document.getElementById('loc-close-btn');
  const currentCityText = document.getElementById('current-city-text');

  async function init() {
    try { if (window.Auth && Auth.init) Auth.init(); } catch (e) { console.warn('Auth init err:', e); }
    try { if (window.Cart && Cart.init) Cart.init(); } catch (e) { console.warn('Cart init err:', e); }
    bindEvents();
    try { await loadFavorites(); } catch (e) { console.warn('Fav init err:', e); }
    try { await loadData(); } catch (e) { console.error('Data load err:', e); }
  }

  function bindEvents() {
    // Search
    if (searchNavBtn) searchNavBtn.addEventListener('click', openSearch);
    if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearch);
    if (searchModalOverlay) {
      searchModalOverlay.addEventListener('click', (e) => {
        if (e.target === searchModalOverlay) closeSearch();
      });
    }
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => handleSearch(e.target.value), 250);
      });
    }

    // Favorites Nav
    if (favNavBtn) favNavBtn.addEventListener('click', showFavoritesModal);

    // Orders Nav
    if (ordersNavBtn) ordersNavBtn.addEventListener('click', showPastOrders);

    // Restaurant Menu Modal Close
    if (restModalClose) restModalClose.addEventListener('click', closeRestaurantModal);
    if (restModalOverlay) {
      restModalOverlay.addEventListener('click', (e) => {
        if (e.target === restModalOverlay) closeRestaurantModal();
      });
    }

    // Veg-only toggle inside Restaurant Modal
    if (restModalVegToggle) {
      restModalVegToggle.addEventListener('change', (e) => {
        if (activeRestaurant) {
          loadRestaurantDetails(activeRestaurant.id, e.target.checked);
        }
      });
    }

    // Order Tracking Modal Close
    if (orderModalClose) orderModalClose.addEventListener('click', closeOrderModal);
    if (orderModalOverlay) {
      orderModalOverlay.addEventListener('click', (e) => {
        if (e.target === orderModalOverlay) closeOrderModal();
      });
    }

    // Location Picker
    if (locPickerBtn) locPickerBtn.addEventListener('click', openLocModal);
    if (locCloseBtn) locCloseBtn.addEventListener('click', closeLocModal);
    if (locModalOverlay) {
      locModalOverlay.addEventListener('click', (e) => {
        if (e.target === locModalOverlay) closeLocModal();
      });
    }

    // Filter Chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', handleFilterClick);
    });

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentFilter.sort = e.target.value;
        loadData();
      });
    }
  }

  // ==========================================
  // DATA LOADING & RESTAURANT RENDERING
  // ==========================================
  async function loadData() {
    const params = {};
    if (currentFilter.category) params.category = currentFilter.category;
    if (currentFilter.veg_only) params.veg_only = 1;
    if (currentFilter.fast_delivery) params.fast_delivery = 1;
    if (currentFilter.rating) params.rating = currentFilter.rating;
    if (currentFilter.sort) params.sort = currentFilter.sort;

    restaurantsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        <div style="display:inline-block; width:30px; height:30px; border:3px solid #fc8019; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite;"></div>
        <div style="margin-top:10px; font-weight:600;">Finding top food places near you...</div>
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    `;

    const data = await API.getRestaurants(params);
    if (data && data.success) {
      allRestaurants = data.restaurants;
      renderCategories(data.categories || []);
      renderRestaurants(data.restaurants);
    }
  }

  function renderCategories(cats) {
    if (!categoriesList) return;
    if (!cats || !Array.isArray(cats) || cats.length === 0) {
      cats = (window.API && API.getCachedCategories) ? API.getCachedCategories() : [];
    }
    if (cats.length === 0) return;
    categoriesList.innerHTML = cats.map(c => `
      <div class="category-pill ${currentFilter.category === c.slug ? 'active' : ''}" onclick="App.selectCategory('${c.slug}')">
        <div class="cat-img-box">
          <img src="${c.icon_url}" alt="${c.name}">
        </div>
        <span class="cat-label">${c.name}</span>
      </div>
    `).join('');
  }

  function selectCategory(slug) {
    if (currentFilter.category === slug) {
      currentFilter.category = '';
    } else {
      currentFilter.category = slug;
    }
    loadData();
  }

  function renderRestaurants(list) {
    if (!restaurantsGrid) return;

    if (list.length === 0) {
      restaurantsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 60px 20px;">
          <h3>No restaurants found matching your filters</h3>
          <p style="color:var(--text-muted); margin-top:6px;">Try resetting your filters or search for something else.</p>
          <button class="btn" style="background:var(--primary); color:#fff; padding:10px 20px; border-radius:8px; margin-top:16px; font-weight:700;" onclick="App.resetFilters()">
            RESET FILTERS
          </button>
        </div>
      `;
      return;
    }

    restaurantsGrid.innerHTML = list.map(r => {
      const isFav = favorites.restaurants.some(fav => fav.id === r.id);
      return `
        <div class="restaurant-card" onclick="App.openRestaurantModal(${r.id})">
          <div class="restaurant-img-wrapper">
            <img src="${r.image_url}" alt="${r.name}" loading="lazy">
            <div class="img-overlay-gradient">
              <span class="discount-badge-text">${r.discount_text || 'OFFERS AVAILABLE'}</span>
            </div>
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); App.toggleRestaurantFavorite(${r.id})" title="Favorite">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
          <div class="restaurant-info">
            <div class="restaurant-name">${r.name}</div>
            <div class="restaurant-meta">
              <span class="rating-badge">★ ${r.rating}</span>
              <span class="bullet-dot">•</span>
              <span class="delivery-time">${r.delivery_time_mins} MINS</span>
            </div>
            <div class="cuisines-text">${r.cuisine}</div>
            <div class="location-text">${r.address}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function handleFilterClick(e) {
    const chip = e.currentTarget;
    const filterType = chip.dataset.filter;

    if (filterType === 'veg') {
      currentFilter.veg_only = !currentFilter.veg_only;
      chip.classList.toggle('active', currentFilter.veg_only);
    } else if (filterType === 'fast') {
      currentFilter.fast_delivery = !currentFilter.fast_delivery;
      chip.classList.toggle('active', currentFilter.fast_delivery);
    } else if (filterType === 'rating') {
      currentFilter.rating = currentFilter.rating ? null : 4.0;
      chip.classList.toggle('active', currentFilter.rating !== null);
    }

    loadData();
  }

  function resetFilters() {
    currentFilter = { category: '', veg_only: false, fast_delivery: false, rating: null, sort: 'default' };
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    loadData();
  }

  // ==========================================
  // RESTAURANT DETAILS & MENU MODAL
  // ==========================================
  async function openRestaurantModal(id) {
    restModalOverlay.classList.add('open');
    if (restModalVegToggle) restModalVegToggle.checked = false;
    await loadRestaurantDetails(id, false);
  }

  async function loadRestaurantDetails(id, vegOnly = false) {
    restMenuScrollArea.innerHTML = `
      <div style="text-align:center; padding: 40px; color: var(--text-muted);">
        Loading menu delicacies...
      </div>
    `;

    const res = await API.getRestaurantMenu(id, vegOnly);
    if (res && res.success) {
      activeRestaurant = res.restaurant;
      activeRestaurantMenu = res.menu_items;

      // Update header details
      document.getElementById('rest-head-name').textContent = activeRestaurant.name;
      document.getElementById('rest-head-cuisine').textContent = activeRestaurant.cuisine;
      document.getElementById('rest-head-addr').textContent = `${activeRestaurant.address} | ${activeRestaurant.delivery_time_mins} mins delivery`;
      document.getElementById('rest-head-rating-val').textContent = `★ ${activeRestaurant.rating}`;
      document.getElementById('rest-head-rating-cnt').textContent = `${(activeRestaurant.rating_count || 1000).toLocaleString()} ratings`;

      renderMenuCategories(res.menu_by_category);
    }
  }

  function renderMenuCategories(groupedMenu) {
    const categories = Object.keys(groupedMenu);

    if (categories.length === 0) {
      restMenuScrollArea.innerHTML = `
        <div style="text-align:center; padding: 40px;">
          <p style="color:var(--text-muted)">No items match the veg filter for this restaurant.</p>
        </div>
      `;
      return;
    }

    restMenuScrollArea.innerHTML = categories.map(catName => {
      const items = groupedMenu[catName];
      const itemsHtml = items.map(dish => {
        const qty = Cart.getItemQty(dish.id);
        const isFav = favorites.dishes.some(f => f.id === dish.id);

        return `
          <div class="menu-item-row" id="dish-row-${dish.id}">
            <div class="menu-item-info">
              <div class="menu-item-diet">
                <span class="diet-icon ${dish.is_veg == 1 ? 'veg' : 'non-veg'}">
                  <span class="diet-icon-dot"></span>
                </span>
                ${dish.is_bestseller == 1 ? '<span style="font-size:11px; font-weight:800; color:#fc8019; margin-left:6px;">★ BESTSELLER</span>' : ''}
              </div>
              <div class="menu-item-name">${dish.name}</div>
              <div class="menu-item-price">₹${dish.price}</div>
              <div class="menu-item-desc">${dish.description || ''}</div>
            </div>
            <div class="menu-item-media">
              <img src="${dish.image_url}" alt="${dish.name}" loading="lazy">
              <div class="add-btn-wrapper" id="btn-wrap-${dish.id}">
                ${renderDishButton(dish, qty)}
              </div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="menu-category-group">
          <div class="menu-cat-title">
            <span>${catName} (${items.length})</span>
          </div>
          ${itemsHtml}
        </div>
      `;
    }).join('');
  }

  function renderDishButton(dish, qty) {
    if (qty > 0) {
      return `
        <div class="qty-stepper">
          <button class="qty-btn" onclick="Cart.removeItem(${dish.id})">−</button>
          <span class="qty-val">${qty}</span>
          <button class="qty-btn" onclick="App.addDishToCart(${dish.id})">+</button>
        </div>
      `;
    } else {
      return `
        <button class="add-btn" onclick="App.addDishToCart(${dish.id})">ADD</button>
      `;
    }
  }

  function addDishToCart(dishId) {
    const dish = activeRestaurantMenu.find(d => d.id === dishId);
    if (dish && activeRestaurant) {
      Cart.addItem(dish, activeRestaurant);
      updateItemSteppers();
    }
  }

  function updateItemSteppers() {
    if (!activeRestaurantMenu) return;
    activeRestaurantMenu.forEach(dish => {
      const wrap = document.getElementById(`btn-wrap-${dish.id}`);
      if (wrap) {
        const qty = Cart.getItemQty(dish.id);
        wrap.innerHTML = renderDishButton(dish, qty);
      }
    });
  }

  function closeRestaurantModal() {
    restModalOverlay.classList.remove('open');
    activeRestaurant = null;
  }

  // ==========================================
  // SEARCH FUNCTIONALITY
  // ==========================================
  function openSearch() {
    searchModalOverlay.classList.add('open');
    setTimeout(() => searchInput && searchInput.focus(), 150);
  }

  function closeSearch() {
    searchModalOverlay.classList.remove('open');
    if (searchInput) searchInput.value = '';
    if (searchResultsArea) searchResultsArea.innerHTML = '';
  }

  async function handleSearch(q) {
    if (!q || !q.trim()) {
      searchResultsArea.innerHTML = '';
      return;
    }

    searchResultsArea.innerHTML = `
      <div style="text-align:center; padding: 20px; color:var(--text-muted);">
        Searching delicious dishes and restaurants...
      </div>
    `;

    const res = await API.search(q);
    if (res && res.success) {
      renderSearchResults(res);
    }
  }

  function renderSearchResults(data) {
    const { restaurants, dishes, query } = data;

    if (restaurants.length === 0 && dishes.length === 0) {
      searchResultsArea.innerHTML = `
        <div style="text-align:center; padding: 40px;">
          <h4>No results found for "${query}"</h4>
          <p style="color:var(--text-muted); font-size:14px; margin-top:6px;">Try searching for Biryani, Pizza, Burger, Momos, or Haldiram's</p>
        </div>
      `;
      return;
    }

    let html = '';

    // Matching Dishes
    if (dishes.length > 0) {
      html += `<div style="font-size:16px; font-weight:800; margin-bottom:14px;">Dishes (${dishes.length})</div>`;
      html += `<div class="search-items-list" style="margin-bottom:28px;">`;
      html += dishes.map(d => `
        <div class="dish-search-card">
          <div class="dish-search-info">
            <div class="dish-search-rest">By ${d.restaurant_name} • ${d.delivery_time_mins || 25} mins</div>
            <div class="dish-search-name">${d.name}</div>
            <div class="dish-search-price">₹${d.price}</div>
          </div>
          <div class="dish-search-img-wrap">
            <img src="${d.image_url}" alt="${d.name}">
          </div>
          <div style="margin-left:14px;">
            <button class="add-btn" onclick="App.addSearchDishToCart(${d.id}, ${d.restaurant_id}, '${d.restaurant_name.replace(/'/g, "\\'")}', '${d.name.replace(/'/g, "\\'")}', ${d.price}, ${d.is_veg}, '${d.image_url}')">ADD</button>
          </div>
        </div>
      `).join('');
      html += `</div>`;
    }

    // Matching Restaurants
    if (restaurants.length > 0) {
      html += `<div style="font-size:16px; font-weight:800; margin-bottom:14px;">Restaurants (${restaurants.length})</div>`;
      html += `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:16px;">`;
      html += restaurants.map(r => `
        <div class="restaurant-card" onclick="App.closeSearch(); App.openRestaurantModal(${r.id});">
          <div class="restaurant-img-wrapper" style="height:130px;">
            <img src="${r.image_url}" alt="${r.name}">
          </div>
          <div class="restaurant-info">
            <div class="restaurant-name" style="font-size:15px;">${r.name}</div>
            <div class="restaurant-meta">
              <span class="rating-badge">★ ${r.rating}</span>
              <span class="bullet-dot">•</span>
              <span class="delivery-time">${r.delivery_time_mins} MINS</span>
            </div>
            <div class="cuisines-text">${r.cuisine}</div>
          </div>
        </div>
      `).join('');
      html += `</div>`;
    }

    searchResultsArea.innerHTML = html;
  }

  function quickSearch(term) {
    if (searchInput) {
      searchInput.value = term;
      handleSearch(term);
    }
  }

  function addSearchDishToCart(dishId, restId, restName, dishName, price, isVeg, imgUrl) {
    const fakeRest = { id: restId, name: restName, address: 'Bangalore', image_url: imgUrl };
    const fakeDish = { id: dishId, name: dishName, price, is_veg: isVeg, image_url: imgUrl };
    Cart.addItem(fakeDish, fakeRest);
  }

  // ==========================================
  // FAVORITES / WISHLIST
  // ==========================================
  async function loadFavorites() {
    favorites = await API.getFavorites();
    updateFavBadge();
  }

  function updateFavBadge() {
    const totalFavs = (favorites.restaurants?.length || 0) + (favorites.dishes?.length || 0);
    if (favBadgeCount) {
      favBadgeCount.textContent = totalFavs;
      favBadgeCount.style.display = totalFavs > 0 ? 'inline-block' : 'none';
    }
  }

  async function toggleRestaurantFavorite(restId) {
    const rest = allRestaurants.find(r => r.id === restId);
    if (!rest) return;

    const res = await API.toggleFavorite('restaurant', rest);
    if (res && res.success) {
      await loadFavorites();
      renderRestaurants(allRestaurants);
      showToast(res.message);
    }
  }

  function showFavoritesModal() {
    let content = `
      <div class="search-header-bar">
        <h2 style="font-size:20px; font-weight:800;">Your Favorites (${(favorites.restaurants?.length || 0) + (favorites.dishes?.length || 0)})</h2>
        <button class="search-close-btn" onclick="App.closeSearch()">✕</button>
      </div>
      <div class="search-body">
    `;

    if ((!favorites.restaurants || favorites.restaurants.length === 0) && (!favorites.dishes || favorites.dishes.length === 0)) {
      content += `
        <div style="text-align:center; padding: 60px 20px;">
          <div style="font-size:40px; margin-bottom:12px;">❤️</div>
          <h3>No Favorites Added Yet</h3>
          <p style="color:var(--text-muted); margin-top:6px;">Tap the heart icon on any restaurant or dish to bookmark them here for quick reordering!</p>
        </div>
      `;
    } else {
      if (favorites.restaurants && favorites.restaurants.length > 0) {
        content += `<h3 style="margin-bottom:16px; font-weight:800;">Favorite Restaurants</h3>`;
        content += `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:16px; margin-bottom:30px;">`;
        content += favorites.restaurants.map(r => `
          <div class="restaurant-card" onclick="App.closeSearch(); App.openRestaurantModal(${r.id})">
            <div class="restaurant-img-wrapper" style="height:140px;">
              <img src="${r.image_url}" alt="${r.name}">
            </div>
            <div class="restaurant-info">
              <div class="restaurant-name">${r.name}</div>
              <div class="cuisines-text">${r.cuisine}</div>
            </div>
          </div>
        `).join('');
        content += `</div>`;
      }

      if (favorites.dishes && favorites.dishes.length > 0) {
        content += `<h3 style="margin-bottom:16px; font-weight:800;">Favorite Dishes</h3>`;
        content += `<div class="search-items-list">`;
        content += favorites.dishes.map(d => `
          <div class="dish-search-card">
            <div class="dish-search-info">
              <div class="dish-search-name">${d.name}</div>
              <div class="dish-search-price">₹${d.price}</div>
            </div>
          </div>
        `).join('');
        content += `</div>`;
      }
    }

    content += `</div>`;

    document.getElementById('search-container-box').innerHTML = content;
    searchModalOverlay.classList.add('open');
  }

  // ==========================================
  // LIVE ORDER TRACKING & PAST ORDERS
  // ==========================================
  function showLiveTracking(order) {
    if (!trackingContainer) return;

    trackingContainer.innerHTML = `
      <div class="tracking-header">
        <div class="tracking-check-icon">✓</div>
        <div class="tracking-title">Order Confirmed!</div>
        <div class="tracking-order-num">Order ID: <strong>${order.order_number}</strong> • Total: ₹${order.final_amount}</div>
        <div style="color:var(--primary); font-weight:700; margin-top:4px;">Estimated Delivery in 30-35 mins</div>
      </div>

      <!-- Live Delivery Partner Card -->
      <div class="rider-info-card">
        <img class="rider-avatar" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80" alt="Rider">
        <div class="rider-details">
          <div class="rider-name">Ramesh Kumar (Delivery Partner)</div>
          <div class="rider-sub">⭐ 4.9 • Honda Activa (KA-01-EQ-9874)</div>
        </div>
        <button class="rider-call-btn" onclick="alert('Calling delivery partner (+91 98450 12345)...')">📞 Call</button>
      </div>

      <!-- 5-Stage Animated Tracking Timeline -->
      <div class="timeline-stages">
        <div class="timeline-step completed">
          <div class="step-marker">✓</div>
          <div class="step-info-title">Order Placed & Paid</div>
          <div class="step-info-desc">We have received your order and notified the kitchen.</div>
        </div>

        <div class="timeline-step completed">
          <div class="step-marker">✓</div>
          <div class="step-info-title">Food is being prepared 🍳</div>
          <div class="step-info-desc">${order.restaurant_name || 'Restaurant'} is preparing your fresh meal with safety hygiene standards.</div>
        </div>

        <div class="timeline-step active">
          <div class="step-marker">🚴</div>
          <div class="step-info-title">Delivery partner assigned</div>
          <div class="step-info-desc">Ramesh has arrived at the restaurant to pick up your order.</div>
        </div>

        <div class="timeline-step">
          <div class="step-marker">📍</div>
          <div class="step-info-title">Out for Delivery</div>
          <div class="step-info-desc">Order on the way to ${order.delivery_address || 'your doorstep'}.</div>
        </div>

        <div class="timeline-step">
          <div class="step-marker">🎉</div>
          <div class="step-info-title">Delivered</div>
          <div class="step-info-desc">Enjoy your delicious meal!</div>
        </div>
      </div>

      <button class="btn" style="width:100%; background:var(--primary); color:#fff; padding:14px; border-radius:8px; font-weight:800;" onclick="App.closeOrderModal()">
        CONTINUE BROWSING
      </button>
    `;

    orderModalOverlay.classList.add('open');
  }

  async function showPastOrders() {
    const orders = await API.getOrders();
    let content = `
      <div class="tracking-header" style="text-align:left; border-bottom:1px solid var(--border-color); padding-bottom:16px;">
        <h2 style="font-size:22px; font-weight:800;">Your Past Orders</h2>
      </div>
      <div style="margin-top:20px; display:flex; flex-direction:column; gap:20px;">
    `;

    if (!orders || orders.length === 0) {
      content += `
        <div style="text-align:center; padding:40px;">
          <h3>No Orders Yet</h3>
          <p style="color:var(--text-muted); margin-top:6px;">You haven't placed any orders yet. Treat yourself today!</p>
        </div>
      `;
    } else {
      content += orders.map(ord => `
        <div style="border:1px solid var(--border-color); border-radius:12px; padding:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div style="font-size:16px; font-weight:800;">${ord.restaurant_name || 'Restaurant'}</div>
            <span style="background:#e8f7ed; color:#15803d; font-size:12px; font-weight:700; padding:3px 8px; border-radius:6px;">${ord.order_status || 'DELIVERED'}</span>
          </div>
          <div style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">
            Order #${ord.order_number} • ${new Date(ord.created_at || Date.now()).toLocaleDateString()}
          </div>
          <div style="font-size:13px; color:var(--text-main); margin-bottom:12px;">
            ${ord.items ? ord.items.map(i => `${i.quantity}x ${i.name || i.item_name}`).join(', ') : 'Order items'}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--border-color); padding-top:10px;">
            <div style="font-weight:800; font-size:15px;">Total Paid: ₹${ord.final_amount}</div>
            <button class="btn" style="background:var(--primary); color:#fff; padding:6px 14px; border-radius:6px; font-size:13px; font-weight:700;" onclick="App.showLiveTracking(${JSON.stringify(ord).replace(/"/g, '&quot;')})">
              TRACK
            </button>
          </div>
        </div>
      `).join('');
    }

    content += `</div>`;
    trackingContainer.innerHTML = content;
    orderModalOverlay.classList.add('open');
  }

  function closeOrderModal() {
    orderModalOverlay.classList.remove('open');
  }

  // Location Picker
  function openLocModal() { locModalOverlay.classList.add('open'); }
  function closeLocModal() { locModalOverlay.classList.remove('open'); }
  function selectCity(city) {
    if (currentCityText) currentCityText.textContent = city;
    closeLocModal();
    showToast(`Location set to ${city}!`);
  }

  return {
    init,
    selectCategory,
    openRestaurantModal,
    closeRestaurantModal,
    addDishToCart,
    updateItemSteppers,
    openSearch,
    closeSearch,
    quickSearch,
    addSearchDishToCart,
    toggleRestaurantFavorite,
    showFavoritesModal,
    showLiveTracking,
    showPastOrders,
    closeOrderModal,
    openLocModal,
    closeLocModal,
    selectCity,
    resetFilters
  };
})();

// Bootstrap app once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
