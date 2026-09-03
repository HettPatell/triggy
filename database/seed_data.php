<?php
/**
 * Programmatic Database Seeder for SQLite and MySQL
 */

function seedDatabase($pdo, $driver = 'sqlite') {
    if ($driver === 'sqlite') {
        // SQLite Table Creation
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                icon_url TEXT NOT NULL,
                display_order INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS restaurants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                image_url TEXT NOT NULL,
                cuisine TEXT NOT NULL,
                rating REAL DEFAULT 4.0,
                rating_count INTEGER DEFAULT 100,
                delivery_time_mins INTEGER DEFAULT 30,
                price_for_two INTEGER DEFAULT 350,
                discount_text TEXT DEFAULT '60% OFF UPTO ₹120',
                is_veg_only INTEGER DEFAULT 0,
                address TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS menu_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                restaurant_id INTEGER NOT NULL,
                category_id INTEGER,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                image_url TEXT NOT NULL,
                is_veg INTEGER DEFAULT 1,
                is_bestseller INTEGER DEFAULT 0,
                is_available INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_number TEXT UNIQUE NOT NULL,
                user_id INTEGER,
                restaurant_id INTEGER NOT NULL,
                total_amount REAL NOT NULL,
                discount_amount REAL DEFAULT 0,
                delivery_fee REAL DEFAULT 0,
                platform_fee REAL DEFAULT 5,
                gst_amount REAL DEFAULT 0,
                final_amount REAL NOT NULL,
                delivery_address TEXT NOT NULL,
                delivery_instructions TEXT,
                payment_method TEXT DEFAULT 'COD',
                payment_status TEXT DEFAULT 'COMPLETED',
                order_status TEXT DEFAULT 'PLACED',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
            );

            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                menu_item_id INTEGER NOT NULL,
                item_name TEXT NOT NULL,
                price REAL NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                subtotal REAL NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                item_type TEXT DEFAULT 'restaurant',
                item_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (user_id, item_type, item_id)
            );
        ");
    } else {
        // Execute SQL schema file for MySQL
        $sql = file_get_contents(__DIR__ . '/schema.sql');
        $pdo->exec($sql);
        return;
    }

    // Seed Categories for SQLite
    $categories = [
        [1, 'Biryani', 'biryani', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=80', 1],
        [2, 'Pizzas', 'pizza', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=80', 2],
        [3, 'Burgers', 'burger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80', 3],
        [4, 'North Indian', 'north-indian', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&auto=format&fit=crop&q=80', 4],
        [5, 'Chinese & Momos', 'chinese', 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=200&auto=format&fit=crop&q=80', 5],
        [6, 'Rolls & Shawarma', 'rolls', 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&auto=format&fit=crop&q=80', 6],
        [7, 'South Indian', 'south-indian', 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=200&auto=format&fit=crop&q=80', 7],
        [8, 'Desserts & Cakes', 'desserts', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=200&auto=format&fit=crop&q=80', 8],
    ];

    $catStmt = $pdo->prepare("INSERT OR IGNORE INTO categories (id, name, slug, icon_url, display_order) VALUES (?, ?, ?, ?, ?)");
    foreach ($categories as $cat) {
        $catStmt->execute($cat);
    }

    // Seed Restaurants
    $restaurants = [
        [1, 'Meghana Foods Biryani', 'meghana-foods', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80', 'Biryani, Andhra, North Indian, Seafood', 4.5, 12500, 24, 500, '50% OFF UPTO ₹100', 0, 'Koramangala 5th Block, Bangalore'],
        [2, 'Pizza Hut & Italian Corner', 'pizza-hut', 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80', 'Pizzas, Italian, Pastas, Desserts', 4.2, 8300, 30, 400, '60% OFF UPTO ₹120', 0, 'Indiranagar 100ft Road, Bangalore'],
        [3, 'Burger King - The King of Burgers', 'burger-king', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&auto=format&fit=crop&q=80', 'Burgers, American, Fast Food, Shakes', 4.3, 9800, 20, 350, 'ITEMS AT ₹129', 0, 'MG Road, Central Plaza, Bangalore'],
        [4, "Haldiram's Sweets & Pure Veg", 'haldirams', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80', 'North Indian, Chaat, Mithai, Thalis', 4.6, 14200, 25, 300, '20% OFF ABOVE ₹299', 1, 'Commercial Street, Bangalore'],
        [5, 'Chinese Wok - Dragon Bowls', 'chinese-wok', 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&auto=format&fit=crop&q=80', 'Chinese, Asian, Noodles, Dimsums', 4.1, 4600, 28, 450, '₹125 OFF ON ₹399', 0, 'HSR Layout Sector 2, Bangalore'],
        [6, 'Punjabi Angithi & Tandoor', 'punjabi-angithi', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80', 'North Indian, Mughlai, Dal Makhani, Breads', 4.4, 7100, 32, 400, 'FLAT ₹100 OFF', 1, 'Whitefield Main Road, Bangalore'],
        [7, 'Royal Shawarma & Kolkata Rolls', 'royal-shawarma', 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80', 'Rolls, Shawarma, Wraps, Fast Food', 4.2, 5300, 18, 250, 'FREE DELIVERY', 0, 'BTM Layout 2nd Stage, Bangalore'],
        [8, 'The Belgian Waffle & Bakery Co.', 'belgian-waffle', 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&auto=format&fit=crop&q=80', 'Waffles, Desserts, Shakes, Ice Cream', 4.7, 11400, 22, 300, '20% OFF ON DESSERTS', 1, 'Church Street, Bangalore']
    ];

    $restStmt = $pdo->prepare("INSERT OR IGNORE INTO restaurants (id, name, slug, image_url, cuisine, rating, rating_count, delivery_time_mins, price_for_two, discount_text, is_veg_only, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($restaurants as $r) {
        $restStmt->execute($r);
    }

    // Seed Menu Items
    $menuItems = [
        [1, 1, 'Meghana Special Chicken Biryani', 'Signature slow-cooked spicy Andhra style boneless chicken chunks layered over fragrant basmati rice, served with raita and mirchi ka salan.', 340.00, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80', 0, 1],
        [1, 1, 'Hyderabadi Paneer Dum Biryani', 'Fresh cottage cheese cubes marinated in special spices and sealed in handi with aromatic basmati rice and saffron.', 290.00, 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80', 1, 1],
        [1, 4, 'Andhra Chilli Chicken Gravy', 'Tender chicken tossed in green chilies, curry leaves, and spicy Andhra masala.', 280.00, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=80', 0, 0],
        [1, 4, 'Paneer 65 Crispy Bites', 'Deep-fried cottage cheese cubes coated in authentic South Indian spiced batter.', 240.00, 'https://images.unsplash.com/photo-1628294895950-9805252327bc?w=500&auto=format&fit=crop&q=80', 1, 0],

        [2, 2, 'Margherita Classic Cheesy Pizza', 'Single cheese topping with 100% real mozzarella cheese, basil drizzle and classic herb tomato sauce.', 239.00, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80', 1, 1],
        [2, 2, 'Chicken Pepperoni Loaded Pizza', 'American classic topped with authentic spiced chicken pepperoni slices and extra stringy mozzarella.', 399.00, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=80', 0, 1],
        [2, 2, 'Veggie Supreme Feast Pizza', 'Loaded with black olives, green bell peppers, crunchy red onions, golden sweet corn and mushrooms.', 349.00, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=80', 1, 0],
        [2, 8, 'Garlic Bread Stuffed with Cheese', 'Freshly baked buttery loaf infused with roasted garlic oil and filled with molten melted cheese.', 149.00, 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500&auto=format&fit=crop&q=80', 1, 1],

        [3, 3, 'Crispy Veg Whopper Double Patty', 'Signature flame-grilled double veg patty served with fresh lettuce, crunchy onions, juicy tomatoes and creamy mayo in toasted sesame bun.', 189.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80', 1, 1],
        [3, 3, 'Crispy Chicken Whopper Deluxe', 'Flame-grilled 100% chicken patty layered with gherkins, creamy thousand island dressing and crisp iceburg lettuce.', 229.00, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&auto=format&fit=crop&q=80', 0, 1],
        [3, 3, 'Peri Peri Seasoned French Fries', 'Golden crinkle cut crispy potatoes shaken in fiery African bird eye chili seasoning.', 119.00, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80', 1, 0],
        [3, 8, 'Thick Belgian Chocolate Shake', 'Rich creamy shake made with authentic imported chocolate gelato and topped with chocolate fudge.', 169.00, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80', 1, 0],

        [4, 4, 'Royal North Indian Deluxe Thali', 'Complete feast with Paneer Butter Masala, Dal Makhani, Mix Veg, Steamed Rice, 2 Butter Naans, Gulab Jamun, Papad and Raita.', 299.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&auto=format&fit=crop&q=80', 1, 1],
        [4, 4, 'Chole Bhature Amritsari Special', '2 fluffy golden fried bhaturas served with spicy authentic pindi chole, pickled onions and mint chutney.', 179.00, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80', 1, 1],
        [4, 7, 'Special Masala Dosa with Sambar', 'Crispy fermented crepe smeared with red garlic chutney, filled with potato onion bhaji, served with coconut chutney.', 140.00, 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=500&auto=format&fit=crop&q=80', 1, 0],
        [4, 8, 'Gulab Jamun (Pack of 2)', 'Warm melt-in-mouth milk solid dumplings dipped in green cardamom and rose scented sugar syrup.', 80.00, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80', 1, 1],

        [5, 5, 'Chilli Garlic Hakka Noodles', 'Wok-tossed thin noodles with crunchy julienned bell peppers, spring onions, cabbage and smoked garlic sauce.', 199.00, 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=500&auto=format&fit=crop&q=80', 1, 1],
        [5, 5, 'Crispy Chicken Steamed Momos (6 Pcs)', 'Delicate paper-thin steamed dumplings packed with spiced minced chicken, served with spicy red schezwan dip.', 189.00, 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500&auto=format&fit=crop&q=80', 0, 1],
        [5, 5, 'Kung Pao Chicken with Peanuts', 'Diced chicken tossed with dried red peppers, scallions, roasted peanuts and tangy savoury glaze.', 269.00, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500&auto=format&fit=crop&q=80', 0, 0],

        [6, 4, 'Authentic Dal Makhani Slow Cooked', 'Black lentils and kidney beans slow cooked overnight over charcoal fire with fresh cream and white butter.', 240.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&auto=format&fit=crop&q=80', 1, 1],
        [6, 4, 'Paneer Tikka Masala Gravy', 'Clay oven tandoor charred paneer tikka cubes cooked in rich silky tomato, cashew and butter gravy.', 270.00, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80', 1, 1],
        [6, 4, 'Garlic Butter Naan (2 Pcs)', 'Traditional tandoor baked refined flour bread infused with chopped garlic and generous melted butter.', 90.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80', 1, 0],

        [7, 6, 'Lebanese Chicken Shawarma Roll', 'Juicy shaved spit-roasted chicken wrapped in soft kuboos pita with garlic toum, french fries and pickled gherkins.', 170.00, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80', 0, 1],
        [7, 6, 'Double Paneer Tikka Kathi Roll', 'Flaky paratha layered with mint chutney, marinated grilled paneer cubes and crunchy spiced onions.', 150.00, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80', 1, 1],

        [8, 8, 'Nutella Dream Belgian Waffle', 'Warm crispy dark chocolate waffle layered with rich creamy Nutella and chocolate sprinkles.', 160.00, 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80', 1, 1],
        [8, 8, 'Triple Chocolate Overload Waffle', 'Crispy chocolate waffle smothered in milk chocolate, dark chocolate and white chocolate ganache.', 175.00, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80', 1, 1]
    ];

    $itemStmt = $pdo->prepare("INSERT OR IGNORE INTO menu_items (restaurant_id, category_id, name, description, price, image_url, is_veg, is_bestseller) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($menuItems as $item) {
        $itemStmt->execute($item);
    }

    // Seed Demo User
    $pwd = password_hash('swiggy123', PASSWORD_BCRYPT);
    $userStmt = $pdo->prepare("INSERT OR IGNORE INTO users (id, name, email, phone, password_hash, address) VALUES (1, ?, ?, ?, ?, ?)");
    $userStmt->execute(['Rahul Sharma', 'rahul@example.com', '9876543210', $pwd, 'Flat 402, Sunshine Heights, Koramangala 4th Block, Bangalore - 560034']);
}
