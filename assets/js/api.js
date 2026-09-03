/**
 * API Communication Layer with Automatic Offline/Mock Fallback
 * Works seamlessly with both PHP Backend and standalone Browser preview!
 */

const API = (() => {
  const BASE_URL = 'api';

  const INITIAL_CATEGORIES = [
    { id: 1, name: 'Biryani', slug: 'biryani', icon_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=80' },
    { id: 2, name: 'Pizzas', slug: 'pizza', icon_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=80' },
    { id: 3, name: 'Burgers', slug: 'burger', icon_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80' },
    { id: 4, name: 'North Indian', slug: 'north-indian', icon_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&auto=format&fit=crop&q=80' },
    { id: 5, name: 'Chinese', slug: 'chinese', icon_url: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=200&auto=format&fit=crop&q=80' },
    { id: 6, name: 'Rolls', slug: 'rolls', icon_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&auto=format&fit=crop&q=80' },
    { id: 7, name: 'South Indian', slug: 'south-indian', icon_url: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=200&auto=format&fit=crop&q=80' },
    { id: 8, name: 'Desserts', slug: 'desserts', icon_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=200&auto=format&fit=crop&q=80' }
  ];

  const INITIAL_RESTAURANTS = [
    {
      id: 1,
      name: 'Meghana Foods Biryani',
      slug: 'meghana-foods',
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
      cuisine: 'Biryani, Andhra, Seafood',
      rating: 4.5,
      rating_count: 12500,
      delivery_time_mins: 24,
      price_for_two: 500,
      discount_text: '50% OFF UPTO ₹100',
      is_veg_only: 0,
      address: 'Koramangala 5th Block, Bangalore'
    },
    {
      id: 2,
      name: 'Pizza Hut & Italian Corner',
      slug: 'pizza-hut',
      image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80',
      cuisine: 'Pizzas, Italian, Pastas',
      rating: 4.2,
      rating_count: 8300,
      delivery_time_mins: 30,
      price_for_two: 400,
      discount_text: '60% OFF UPTO ₹120',
      is_veg_only: 0,
      address: 'Indiranagar 100ft Road, Bangalore'
    },
    {
      id: 3,
      name: 'Burger King - The King of Burgers',
      slug: 'burger-king',
      image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&auto=format&fit=crop&q=80',
      cuisine: 'Burgers, American, Shakes',
      rating: 4.3,
      rating_count: 9800,
      delivery_time_mins: 20,
      price_for_two: 350,
      discount_text: 'ITEMS AT ₹129',
      is_veg_only: 0,
      address: 'MG Road, Central Plaza, Bangalore'
    },
    {
      id: 4,
      name: "Haldiram's Sweets & Pure Veg",
      slug: 'haldirams',
      image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
      cuisine: 'North Indian, Chaat, Mithai',
      rating: 4.6,
      rating_count: 14200,
      delivery_time_mins: 25,
      price_for_two: 300,
      discount_text: '20% OFF ABOVE ₹299',
      is_veg_only: 1,
      address: 'Commercial Street, Bangalore'
    },
    {
      id: 5,
      name: 'Chinese Wok - Dragon Bowls',
      slug: 'chinese-wok',
      image_url: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&auto=format&fit=crop&q=80',
      cuisine: 'Chinese, Asian, Momos',
      rating: 4.1,
      rating_count: 4600,
      delivery_time_mins: 28,
      price_for_two: 450,
      discount_text: '₹125 OFF ON ₹399',
      is_veg_only: 0,
      address: 'HSR Layout Sector 2, Bangalore'
    },
    {
      id: 6,
      name: 'Punjabi Angithi & Tandoor',
      slug: 'punjabi-angithi',
      image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80',
      cuisine: 'North Indian, Mughlai, Dal Makhani',
      rating: 4.4,
      rating_count: 7100,
      delivery_time_mins: 32,
      price_for_two: 400,
      discount_text: 'FLAT ₹100 OFF',
      is_veg_only: 1,
      address: 'Whitefield Main Road, Bangalore'
    },
    {
      id: 7,
      name: 'Royal Shawarma & Kolkata Rolls',
      slug: 'royal-shawarma',
      image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
      cuisine: 'Rolls, Shawarma, Wraps',
      rating: 4.2,
      rating_count: 5300,
      delivery_time_mins: 18,
      price_for_two: 250,
      discount_text: 'FREE DELIVERY',
      is_veg_only: 0,
      address: 'BTM Layout 2nd Stage, Bangalore'
    },
    {
      id: 8,
      name: 'The Belgian Waffle & Bakery Co.',
      slug: 'belgian-waffle',
      image_url: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&auto=format&fit=crop&q=80',
      cuisine: 'Waffles, Desserts, Shakes',
      rating: 4.7,
      rating_count: 11400,
      delivery_time_mins: 22,
      price_for_two: 300,
      discount_text: '20% OFF ON DESSERTS',
      is_veg_only: 1,
      address: 'Church Street, Bangalore'
    }
  ];

  const INITIAL_MENU = {
    1: [
      { id: 101, restaurant_id: 1, category_name: 'Biryani Specials', name: 'Meghana Special Chicken Biryani', description: 'Slow-cooked spicy Andhra boneless chicken cubes layered over fragrant basmati rice.', price: 340, image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80', is_veg: 0, is_bestseller: 1 },
      { id: 102, restaurant_id: 1, category_name: 'Biryani Specials', name: 'Hyderabadi Paneer Dum Biryani', description: 'Fresh paneer cubes in aromatic biryani spices and saffron basmati rice.', price: 290, image_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80', is_veg: 1, is_bestseller: 1 },
      { id: 103, restaurant_id: 1, category_name: 'Starters', name: 'Andhra Chilli Chicken Gravy', description: 'Tender chicken tossed in green chilies, curry leaves, and spicy Andhra masala.', price: 280, image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=80', is_veg: 0, is_bestseller: 0 },
      { id: 104, restaurant_id: 1, category_name: 'Starters', name: 'Paneer 65 Crispy Bites', description: 'Crispy fried cottage cheese tossed in spicy South Indian tempered masala.', price: 240, image_url: 'https://images.unsplash.com/photo-1628294895950-9805252327bc?w=500&auto=format&fit=crop&q=80', is_veg: 1, is_bestseller: 0 }
    ],
    2: [
      { id: 201, restaurant_id: 2, category_name: 'Pizzas', name: 'Margherita Classic Cheesy Pizza', description: '100% mozzarella cheese, basil drizzle and classic herb tomato sauce.', price: 239, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80', is_veg: 1, is_bestseller: 1 },
      { id: 202, restaurant_id: 2, category_name: 'Pizzas', name: 'Chicken Pepperoni Loaded Pizza', description: 'Spiced chicken pepperoni slices with extra stretchy mozzarella cheese.', price: 399, image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=80', is_veg: 0, is_bestseller: 1 },
      { id: 203, restaurant_id: 2, category_name: 'Sides', name: 'Garlic Bread Stuffed with Cheese', description: 'Buttery loaf infused with roasted garlic oil and molten cheese filling.', price: 149, image_url: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500&auto=format&fit=crop&q=80', is_veg: 1, is_bestseller: 1 }
    ],
    3: [
      { id: 301, restaurant_id: 3, category_name: 'Burgers', name: 'Crispy Veg Whopper Double Patty', description: 'Double veg patty with fresh lettuce, onions, tomatoes and creamy mayo.', price: 189, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80', is_veg: 1, is_bestseller: 1 },
      { id: 302, restaurant_id: 3, category_name: 'Burgers', name: 'Crispy Chicken Whopper Deluxe', description: 'Flame grilled chicken patty with gherkins and creamy sauce in sesame bun.', price: 229, image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&auto=format&fit=crop&q=80', is_veg: 0, is_bestseller: 1 },
      { id: 303, restaurant_id: 3, category_name: 'Sides & Shakes', name: 'Peri Peri Seasoned French Fries', description: 'Crispy crinkle cut potatoes dusted with fiery Peri Peri seasoning.', price: 119, image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80', is_veg: 1, is_bestseller: 0 }
    ],
    4: [
      { id: 401, restaurant_id: 4, category_name: 'Thalis & Meals', name: 'Royal North Indian Deluxe Thali', description: 'Paneer Butter Masala, Dal Makhani, Mix Veg, Steamed Rice, 2 Butter Naans, Gulab Jamun.', price: 299, image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&auto=format&fit=crop&q=80', is_veg: 1, is_bestseller: 1 },
      { id: 402, restaurant_id: 4, category_name: 'Snacks', name: 'Chole Bhature Amritsari Special', description: '2 fluffy bhaturas with pindi chole, pickled onions and mint chutney.', price: 179, image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80', is_veg: 1, is_bestseller: 1 },
      { id: 403, restaurant_id: 4, category_name: 'Mithai', name: 'Gulab Jamun (Pack of 2)', description: 'Warm melt-in-mouth milk dumplings in rose and cardamom syrup.', price: 80, image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80', is_veg: 1, is_bestseller: 0 }
    ]
  };

  // LocalStorage Stores
  function getStoredRestaurants() {
    const stored = localStorage.getItem('swiggy_custom_restaurants');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    localStorage.setItem('swiggy_custom_restaurants', JSON.stringify(INITIAL_RESTAURANTS));
    return JSON.parse(JSON.stringify(INITIAL_RESTAURANTS));
  }

  function getStoredMenu() {
    const stored = localStorage.getItem('swiggy_custom_menu');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    localStorage.setItem('swiggy_custom_menu', JSON.stringify(INITIAL_MENU));
    return JSON.parse(JSON.stringify(INITIAL_MENU));
  }

  // Helper fetch with error handling and 2.5s timeout
  async function fetchJSON(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        signal: controller.signal,
        ...options
      });
      clearTimeout(timer);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errData.message || `Request failed with status ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      console.warn(`[API] Fallback triggered for ${url}:`, err.message);
      return null;
    }
  }

  return {
    // Restaurants
    async getRestaurants(params = {}) {
      const query = new URLSearchParams(params).toString();
      const res = await fetchJSON(`${BASE_URL}/restaurants.php?${query}`);
      if (res && res.success) {
        if (!res.categories || !Array.isArray(res.categories) || res.categories.length === 0) {
          res.categories = INITIAL_CATEGORIES;
        }
        return res;
      }

      // Mock Fallback using dynamic store
      let list = getStoredRestaurants();
      if (params.veg_only == 1) list = list.filter(r => r.is_veg_only == 1);
      if (params.fast_delivery == 1) list = list.filter(r => r.delivery_time_mins <= 25);
      if (params.rating) list = list.filter(r => r.rating >= parseFloat(params.rating));
      if (params.category) list = list.filter(r => r.cuisine.toLowerCase().includes(params.category.toLowerCase()));
      if (params.sort === 'rating') list.sort((a, b) => b.rating - a.rating);
      if (params.sort === 'delivery_time') list.sort((a, b) => a.delivery_time_mins - b.delivery_time_mins);
      if (params.sort === 'price_low') list.sort((a, b) => a.price_for_two - b.price_for_two);
      if (params.sort === 'price_high') list.sort((a, b) => b.price_for_two - a.price_for_two);

      return {
        success: true,
        categories: INITIAL_CATEGORIES,
        restaurants: list,
        total: list.length
      };
    },

    // Single Restaurant Menu
    async getRestaurantMenu(id, vegOnly = false) {
      const res = await fetchJSON(`${BASE_URL}/restaurants.php?id=${id}&veg_only=${vegOnly ? 1 : 0}`);
      if (res && res.success && res.menu_items && res.menu_items.length > 0) return res;

      // Robust Mock Fallback
      const allR = getStoredRestaurants();
      const rest = allR.find(r => r.id == id) || allR[0];
      const menuStore = getStoredMenu();
      let items = (menuStore && menuStore[id] && menuStore[id].length > 0)
        ? menuStore[id]
        : (INITIAL_MENU[id] || INITIAL_MENU[1]);

      if (vegOnly) items = items.filter(i => i.is_veg === 1);

      const grouped = {};
      items.forEach(it => {
        const cat = it.category_name || 'Recommended';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(it);
      });

      return {
        success: true,
        restaurant: rest,
        menu_items: items,
        menu_by_category: grouped
      };
    },

    // Get all dishes across all restaurants
    async getAllDishes() {
      const menuStore = getStoredMenu();
      const rests = getStoredRestaurants();
      const all = [];
      Object.keys(menuStore).forEach(restId => {
        const r = rests.find(x => x.id == restId) || { name: 'Restaurant #' + restId };
        menuStore[restId].forEach(d => {
          all.push({ ...d, restaurant_name: r.name });
        });
      });
      return all;
    },

    // Add Restaurant (Admin)
    async addRestaurant(data) {
      const res = await fetchJSON(`${BASE_URL}/admin.php?action=add_restaurant`, {
        method: 'POST',
        body: JSON.stringify(data)
      });

      // Always update local store
      const current = getStoredRestaurants();
      const newId = (res && res.restaurant_id) ? res.restaurant_id : Date.now();
      const newRest = {
        id: newId,
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000),
        image_url: data.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
        cuisine: data.cuisine,
        rating: 4.5,
        rating_count: 10,
        delivery_time_mins: parseInt(data.delivery_time_mins) || 25,
        price_for_two: parseInt(data.price_for_two) || 400,
        discount_text: data.discount_text || 'FLAT 20% OFF',
        is_veg_only: parseInt(data.is_veg_only) || 0,
        address: data.address || 'Bangalore'
      };
      current.unshift(newRest);
      localStorage.setItem('swiggy_custom_restaurants', JSON.stringify(current));

      return res || { success: true, restaurant_id: newId, restaurant: newRest };
    },

    // Add Dish (Admin)
    async addDish(data) {
      const res = await fetchJSON(`${BASE_URL}/admin.php?action=add_dish`, {
        method: 'POST',
        body: JSON.stringify(data)
      });

      const menuStore = getStoredMenu();
      const restId = parseInt(data.restaurant_id) || 1;
      if (!menuStore[restId]) menuStore[restId] = [];

      const newDishId = (res && res.dish_id) ? res.dish_id : Date.now();
      const newDish = {
        id: newDishId,
        restaurant_id: restId,
        category_name: data.category_name || 'Specials',
        name: data.name,
        description: data.description || '',
        price: parseFloat(data.price) || 200,
        image_url: data.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
        is_veg: parseInt(data.is_veg) === 1 ? 1 : 0,
        is_bestseller: data.is_bestseller ? 1 : 0
      };
      menuStore[restId].unshift(newDish);
      localStorage.setItem('swiggy_custom_menu', JSON.stringify(menuStore));

      return res || { success: true, dish_id: newDishId, dish: newDish };
    },

    // Delete Dish (Admin)
    async deleteDish(dishId) {
      dishId = parseInt(dishId);
      const res = await fetchJSON(`${BASE_URL}/admin.php?action=delete_dish&id=${dishId}`, {
        method: 'POST',
        body: JSON.stringify({ dish_id: dishId })
      });

      const menuStore = getStoredMenu();
      Object.keys(menuStore).forEach(restId => {
        menuStore[restId] = menuStore[restId].filter(d => d.id !== dishId);
      });
      localStorage.setItem('swiggy_custom_menu', JSON.stringify(menuStore));

      return res || { success: true };
    },

    // Search
    async search(query) {
      if (!query || !query.trim()) return { success: true, restaurants: [], dishes: [] };
      const res = await fetchJSON(`${BASE_URL}/search.php?q=${encodeURIComponent(query)}`);
      if (res && res.success) return res;

      // Mock search
      const q = query.toLowerCase();
      const restaurants = getStoredRestaurants().filter(r => 
        r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q)
      );

      const dishes = [];
      const menuStore = getStoredMenu();
      const allRests = getStoredRestaurants();

      Object.values(menuStore).flat().forEach(d => {
        if (d.name.toLowerCase().includes(q) || (d.description && d.description.toLowerCase().includes(q))) {
          const r = allRests.find(rest => rest.id === d.restaurant_id) || {};
          dishes.push({ ...d, restaurant_name: r.name, delivery_time_mins: r.delivery_time_mins });
        }
      });

      return {
        success: true,
        query,
        restaurants,
        dishes
      };
    },

    // Auth
    async login(email, password) {
      const res = await fetchJSON(`${BASE_URL}/auth.php?action=login`, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (res) return res;

      // Mock Auth
      if (email && password) {
        const mockUser = { id: 1, name: 'Rahul Sharma', email, phone: '9876543210', address: 'Koramangala, Bangalore' };
        localStorage.setItem('swiggy_user', JSON.stringify(mockUser));
        return { success: true, message: 'Logged in successfully (Demo mode)', user: mockUser };
      }
      return { success: false, message: 'Please enter valid credentials.' };
    },

    async register(data) {
      const res = await fetchJSON(`${BASE_URL}/auth.php?action=register`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res) return res;

      const newUser = { id: Date.now(), name: data.name, email: data.email, phone: data.phone, address: data.address || 'Bangalore' };
      localStorage.setItem('swiggy_user', JSON.stringify(newUser));
      return { success: true, message: 'Registered successfully!', user: newUser };
    },

    async logout() {
      await fetchJSON(`${BASE_URL}/auth.php?action=logout`);
      localStorage.removeItem('swiggy_user');
      return { success: true };
    },

    async checkAuth() {
      const res = await fetchJSON(`${BASE_URL}/auth.php?action=me`);
      if (res && res.logged_in) return res;

      const localUser = localStorage.getItem('swiggy_user');
      if (localUser) {
        try {
          return { logged_in: true, user: JSON.parse(localUser) };
        } catch (e) {}
      }
      return { logged_in: false, user: null };
    },

    // Favorites
    async getFavorites() {
      const res = await fetchJSON(`${BASE_URL}/favorites.php?action=list`);
      if (res && res.success) return res.favorites;

      // LocalStorage fallback
      const saved = localStorage.getItem('swiggy_favs');
      return saved ? JSON.parse(saved) : { restaurants: [], dishes: [] };
    },

    async toggleFavorite(itemType, itemData) {
      const res = await fetchJSON(`${BASE_URL}/favorites.php?action=toggle`, {
        method: 'POST',
        body: JSON.stringify({ item_type: itemType, item_id: itemData.id })
      });
      if (res && res.success) return res;

      // LocalStorage toggle fallback
      let favs = JSON.parse(localStorage.getItem('swiggy_favs') || '{"restaurants":[],"dishes":[]}');
      const listKey = itemType === 'restaurant' ? 'restaurants' : 'dishes';
      const index = favs[listKey].findIndex(x => x.id === itemData.id);
      let isFav = false;

      if (index >= 0) {
        favs[listKey].splice(index, 1);
        isFav = false;
      } else {
        favs[listKey].push(itemData);
        isFav = true;
      }

      localStorage.setItem('swiggy_favs', JSON.stringify(favs));
      return { success: true, is_favorited: isFav, message: isFav ? 'Added to favorites' : 'Removed from favorites' };
    },

    // Coupons
    async getAvailableCoupons() {
      const res = await fetchJSON(`${BASE_URL}/coupons.php`);
      if (res && res.success && Array.isArray(res.available_coupons)) {
        localStorage.setItem('triggy_available_coupons', JSON.stringify(res.available_coupons));
        return res.available_coupons;
      }
      const local = localStorage.getItem('triggy_available_coupons');
      if (local) {
        try { return JSON.parse(local); } catch (e) {}
      }
      return [
        { code: 'FREEDEL', title: 'FREE DELIVERY', description: 'Zero delivery fee on any order amount', min_order: 99, discount: 35, status: 'ACTIVE' }
      ];
    },

    async addCoupon(data) {
      const res = await fetchJSON(`${BASE_URL}/coupons.php?action=add`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      const current = await this.getAvailableCoupons();
      const code = data.code.toUpperCase();
      const filtered = current.filter(c => c.code !== code);
      filtered.push({
        code: code,
        title: data.title || (code + ' Discount'),
        description: data.description || 'Special promo',
        type: data.type || 'percentage',
        value: parseFloat(data.value) || 20,
        max_discount: parseFloat(data.max_discount) || 100,
        min_order: parseFloat(data.min_order) || 149,
        status: 'ACTIVE'
      });
      localStorage.setItem('triggy_available_coupons', JSON.stringify(filtered));
      return res || { success: true };
    },

    async deleteCoupon(code) {
      code = code.toUpperCase();
      const res = await fetchJSON(`${BASE_URL}/coupons.php?action=delete&code=${encodeURIComponent(code)}`, {
        method: 'POST',
        body: JSON.stringify({ code })
      });
      const current = await this.getAvailableCoupons();
      const filtered = current.filter(c => c.code !== code);
      localStorage.setItem('triggy_available_coupons', JSON.stringify(filtered));
      return res || { success: true };
    },

    async applyCoupon(code, total) {
      const res = await fetchJSON(`${BASE_URL}/coupons.php?code=${encodeURIComponent(code)}&total=${total}`);
      if (res) return res;

      // Local fallback evaluation based strictly on currently active coupons
      const c = code.toUpperCase();
      const available = await this.getAvailableCoupons();
      const found = available.find(x => x.code.toUpperCase() === c);
      if (!found) {
        return { success: false, message: 'Invalid or inactive coupon code.' };
      }
      if (found.min_order && total < parseFloat(found.min_order)) {
        return { success: false, message: `Minimum order amount for ${c} is ₹${found.min_order}` };
      }
      let disc = 0;
      if (found.type === 'percentage') {
        disc = Math.min(parseFloat(found.max_discount) || 100, Math.round((total * (parseFloat(found.value) || 20)) / 100));
      } else {
        disc = parseFloat(found.value) || parseFloat(found.discount) || 35;
      }
      return { success: true, discount: disc, message: `Coupon ${c} applied! Saved ₹${disc}` };
    },

    // Orders
    async createOrder(orderData) {
      const res = await fetchJSON(`${BASE_URL}/orders.php?action=create`, {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      // ALWAYS sync order to localStorage swiggy_orders so Admin Panel sees it immediately!
      const orderNumber = (res && res.order && res.order.order_number) ? res.order.order_number : ('TRIG-' + Math.floor(100000 + Math.random() * 900000));
      const newOrder = {
        id: (res && res.order && res.order.id) ? res.order.id : Date.now(),
        order_number: orderNumber,
        restaurant_id: orderData.restaurant_id || 1,
        restaurant_name: orderData.restaurant_name || 'Meghana Foods Biryani',
        user_name: orderData.user_name || 'Rahul Sharma',
        user_phone: orderData.user_phone || '9876543210',
        payment_method: orderData.payment_method || 'COD',
        final_amount: parseFloat(orderData.final_amount) || 0,
        items: orderData.items || [],
        delivery_address: orderData.delivery_address || 'Koramangala, Bangalore',
        created_at: new Date().toISOString(),
        order_status: 'CONFIRMED'
      };

      const pastOrders = JSON.parse(localStorage.getItem('swiggy_orders') || '[]');
      pastOrders.unshift(newOrder);
      localStorage.setItem('swiggy_orders', JSON.stringify(pastOrders));

      return {
        success: true,
        message: 'Order placed successfully! 🍕',
        order: (res && res.order) ? res.order : newOrder
      };
    },

    async getOrders() {
      let serverOrders = [];
      const res = await fetchJSON(`${BASE_URL}/orders.php?action=list`);
      if (res && res.success && Array.isArray(res.orders)) {
        serverOrders = res.orders;
      }

      const localOrders = JSON.parse(localStorage.getItem('swiggy_orders') || '[]');
      const map = new Map();
      localOrders.forEach(o => map.set(o.order_number, o));
      serverOrders.forEach(o => map.set(o.order_number, o));

      const merged = Array.from(map.values());
      merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      return merged;
    },

    async getAllAdminOrders() {
      let serverOrders = [];
      const res = await fetchJSON(`${BASE_URL}/admin.php?action=orders`);
      if (res && res.success && Array.isArray(res.orders)) {
        serverOrders = res.orders;
      }

      const localOrders = JSON.parse(localStorage.getItem('swiggy_orders') || '[]');
      const map = new Map();
      localOrders.forEach(o => map.set(o.order_number, o));
      serverOrders.forEach(o => map.set(o.order_number, o));

      let merged = Array.from(map.values());
      if (merged.length === 0) {
        merged = [
          { id: 101, order_number: 'SWIG-89421', restaurant_name: 'Meghana Foods Biryani', final_amount: 680, payment_method: 'UPI', order_status: 'CONFIRMED', user_name: 'Rahul Sharma', user_phone: '9876543210', items: [{name: 'Meghana Special Chicken Biryani', quantity: 2}], delivery_address: 'Koramangala 4th Block, Bangalore', created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
          { id: 102, order_number: 'SWIG-73125', restaurant_name: 'Pizza Hut', final_amount: 498, payment_method: 'CARD', order_status: 'PREPARING', user_name: 'Priya Patel', user_phone: '9811223344', items: [{name: 'Margherita Classic Pizza', quantity: 1}, {name: 'Garlic Bread', quantity: 1}], delivery_address: 'Indiranagar 100ft Rd, Bangalore', created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
          { id: 103, order_number: 'SWIG-65902', restaurant_name: 'Burger King', final_amount: 378, payment_method: 'COD', order_status: 'DELIVERED', user_name: 'Aman Verma', user_phone: '9988776655', items: [{name: 'Crispy Veg Whopper', quantity: 2}], delivery_address: 'MG Road, Bangalore', created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() }
        ];
        localStorage.setItem('swiggy_orders', JSON.stringify(merged));
      }

      merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      return merged;
    },

    async updateOrderStatus(orderId, newStatus) {
      await fetchJSON(`${BASE_URL}/admin.php?action=update_order_status`, {
        method: 'POST',
        body: JSON.stringify({ order_id: orderId, status: newStatus })
      });

      const localOrders = JSON.parse(localStorage.getItem('swiggy_orders') || '[]');
      const ord = localOrders.find(o => o.id == orderId || o.order_number == orderId);
      if (ord) {
        ord.order_status = newStatus;
        localStorage.setItem('swiggy_orders', JSON.stringify(localOrders));
      }
      return { success: true };
    },

    getCachedCategories() {
      return INITIAL_CATEGORIES;
    }
  };
})();
