# 🍔 Triggy - Online Food Ordering Platform

A full-featured, responsive food delivery platform **Triggy**, built with **HTML5, CSS3, Modern JavaScript**, and a **PHP + MySQL/SQLite Database** backend.

---

## 🌟 Key Features

1. **Triggy Brand UI & Navigation**:
   - Signature vibrant orange (`#fc8019`) brand styling.
   - Sticky navbar with Triggy logo, location selector dropdown, search, favorites badge counter, profile/sign-in, and cart counter.
   - Food Delivery, Instamart, and Dineout service tabs.
   - Promotional discount banners ("UP TO 60% OFF", "FREE DELIVERY", "ITEMS AT ₹129").

2. **Smart Category Navigation & Filters**:
   - "What's on your mind?" circular category pills (Biryani, Pizza, Burger, North Indian, Chinese, Rolls, South Indian, Desserts).
   - Fast Delivery filter (< 25 mins).
   - Pure Veg toggle filter with green/red badges.
   - Ratings 4.0+ filter.
   - Sorting by Relevance, Rating, Delivery Time, and Price (Low to High, High to Low).

3. **Live Instant Search**:
   - Search bar with debounced real-time matching.
   - Searches across both dishes and restaurants simultaneously.
   - Popular search suggestions (Chicken Biryani, Margherita Pizza, Whopper Burger, etc.).
   - Direct "ADD" to cart buttons from search results.

4. **Restaurant Details & Dynamic Menu Modal**:
   - Restaurant banner, rating badge, address, and delivery time.
   - In-menu veg-only switch.
   - Items grouped by categories (Recommended, Starters, Mains, Desserts, etc.).
   - Signature Swiggy "ADD" button transforming into a quantity stepper (`− 1 +`).

5. **Slide-Over Order Cart & Bill Details**:
   - Right-side slide-over cart drawer matching Swiggy.
   - Veg / Non-veg indicators for each item.
   - Quantity increment and decrement with instant recalculations.
   - Promo coupon validation (`SWIGGY50`, `SWIGGYIT`, `FREEDEL`).
   - Detailed bill breakdown: Item Total, Delivery Fee (Free over ₹199), Platform Fee (₹5), GST/Taxes (5%), Coupon Discount, and **TO PAY** total.
   - Cross-restaurant cart replacement confirmation dialog.

6. **Checkout & Multi-Method Payment**:
   - Interactive payment modal supporting:
     - UPI (Google Pay, PhonePe, Paytm, Any UPI ID)
     - Credit & Debit Cards
     - Net Banking
     - Cash on Delivery (COD)

7. **Live Order Tracking & Past Orders**:
   - Animated 5-stage live order status timeline:
     - 1. Order Placed & Paid
     - 2. Food Being Prepared in Kitchen
     - 3. Delivery Partner Assigned (with rider photo, vehicle number, phone)
     - 4. Out for Delivery
     - 5. Delivered!
   - Past Orders drawer with dates, item lists, amounts, and track buttons.

8. **Favorites / Wishlist**:
   - Heart button on every restaurant and food item.
   - Dedicated favorites modal.
   - Persistent across browser sessions.

9. **User Authentication (Sign In & Sign Up)**:
   - Slide-in login & registration drawer.
   - Password hashing with `password_hash()` and verification with `password_verify()`.
   - Header profile menu with user name, email, past orders, favorites, and logout.

---

## 📁 Directory Structure

```
swiggy-clone/
├── index.html                 # Main Swiggy marketplace homepage
├── setup_db.php               # One-click database health check & setup
├── README.md                  # This documentation guide
├── config/
│   └── db.php                 # PDO database connection (MySQL + SQLite fallback)
├── database/
│   ├── schema.sql             # MySQL schema & seed data (phpMyAdmin ready)
│   └── seed_data.php          # Programmatic database seeder
├── api/
│   ├── auth.php               # Login, Register, Logout, Session check
│   ├── restaurants.php        # Restaurants list & menu details with filters
│   ├── search.php             # Search dishes and restaurants
│   ├── favorites.php          # Add/remove/list user favorites
│   ├── orders.php             # Order placement, history & live tracking
│   └── coupons.php            # Promo coupons validation
└── assets/
    ├── css/
    │   └── style.css          # Swiggy design system styles
    └── js/
        ├── api.js             # API layer with automatic offline mock fallback
        ├── auth.js            # Auth modal, session sync & profile dropdown
        ├── cart.js            # Order cart, coupons, bill calculation & checkout
        └── app.js             # Core app, search, filters, menu modal & tracking
```

---

## 🚀 How to Run

### Option 1: Zero-Config Instant Preview (Any Web Browser)
The frontend includes a built-in offline mock layer. You can simply double-click or open `index.html` in Chrome, Edge, Firefox, or Safari, and all features (Search, Cart, Favorites, Restaurant Menus, Checkout, Order Tracking, and Auth) will work right away!

---

### Option 2: Running with XAMPP (Apache + MySQL)
1. Copy the entire `swiggy-clone` folder into your XAMPP `htdocs` directory:
   `C:\xampp\htdocs\swiggy`
2. Start **Apache** and **MySQL** from the XAMPP Control Panel.
3. Open phpMyAdmin (`http://localhost/phpmyadmin`) and import `database/schema.sql` (or simply visit `http://localhost/swiggy/setup_db.php` which automatically initializes the database!).
4. Open your browser and navigate to:
   **`http://localhost/swiggy/`**

---

### Option 3: Running with PHP Built-in Server
If you have PHP installed on your system:
1. Open PowerShell or Command Prompt in the `swiggy-clone` folder.
2. Run:
   ```bash
   php -S localhost:8000
   ```
3. Open **`http://localhost:8000`** in your browser.
   *(The database automatically creates and uses `database/swiggy.sqlite` if MySQL is not running, requiring zero manual configuration!)*

---

## 🔑 Demo Account Credentials

- **Email:** `rahul@example.com`
- **Password:** `swiggy123`

---

## 🎟️ Active Promo Codes

| Code | Benefit | Minimum Order |
| :--- | :--- | :--- |
| `SWIGGY50` | 50% OFF (up to ₹50) | ₹149 |
| `SWIGGYIT` | 20% OFF (up to ₹100) | ₹199 |
| `FREEDEL` | Free Delivery (saves ₹35) | ₹99 |
