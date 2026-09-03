<?php
/**
 * Admin Panel API Endpoint
 */

require_once __DIR__ . '/../config/db.php';

$pdo = getDB();
$action = isset($_GET['action']) ? trim($_GET['action']) : 'stats';

$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true) ?: $_POST;

switch ($action) {
    case 'stats':
        $totalOrders = (int)$pdo->query("SELECT COUNT(*) FROM orders")->fetchColumn();
        $totalRevenue = (float)$pdo->query("SELECT COALESCE(SUM(final_amount), 0) FROM orders WHERE payment_status = 'PAID' OR payment_status = 'COMPLETED'")->fetchColumn();
        $totalRestaurants = (int)$pdo->query("SELECT COUNT(*) FROM restaurants")->fetchColumn();
        $totalDishes = (int)$pdo->query("SELECT COUNT(*) FROM menu_items")->fetchColumn();
        $totalUsers = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

        jsonResponse([
            'success' => true,
            'stats' => [
                'total_orders' => $totalOrders,
                'total_revenue' => $totalRevenue,
                'total_restaurants' => $totalRestaurants,
                'total_dishes' => $totalDishes,
                'total_users' => $totalUsers
            ]
        ]);
        break;

    case 'orders':
        $stmt = $pdo->query("
            SELECT o.*, r.name as restaurant_name, u.name as user_name, u.phone as user_phone
            FROM orders o
            LEFT JOIN restaurants r ON o.restaurant_id = r.id
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        ");
        $orders = $stmt->fetchAll();

        foreach ($orders as &$ord) {
            $itemStmt = $pdo->prepare("SELECT item_name, price, quantity, subtotal FROM order_items WHERE order_id = ?");
            $itemStmt->execute([$ord['id']]);
            $ord['items'] = $itemStmt->fetchAll();
        }

        jsonResponse([
            'success' => true,
            'orders' => $orders
        ]);
        break;

    case 'update_order_status':
        $orderId = isset($inputData['order_id']) ? (int)$inputData['order_id'] : 0;
        $status = isset($inputData['status']) ? strtoupper(trim($inputData['status'])) : '';

        if (!$orderId || empty($status)) {
            jsonResponse(['success' => false, 'message' => 'Order ID and status are required.'], 400);
        }

        $stmt = $pdo->prepare("UPDATE orders SET order_status = ? WHERE id = ?");
        $stmt->execute([$status, $orderId]);

        jsonResponse([
            'success' => true,
            'message' => "Order #$orderId status updated to $status"
        ]);
        break;

    case 'add_restaurant':
        $name = isset($inputData['name']) ? trim($inputData['name']) : '';
        $cuisine = isset($inputData['cuisine']) ? trim($inputData['cuisine']) : '';
        $deliveryTime = isset($inputData['delivery_time_mins']) ? (int)$inputData['delivery_time_mins'] : 30;
        $priceForTwo = isset($inputData['price_for_two']) ? (int)$inputData['price_for_two'] : 400;
        $discountText = isset($inputData['discount_text']) ? trim($inputData['discount_text']) : '20% OFF';
        $isVegOnly = isset($inputData['is_veg_only']) ? (int)$inputData['is_veg_only'] : 0;
        $address = isset($inputData['address']) ? trim($inputData['address']) : 'Bangalore';
        $imageUrl = isset($inputData['image_url']) ? trim($inputData['image_url']) : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80';
        $slug = strtolower(preg_replace('/[^A-Za-z0-9-]+/', '-', $name)) . '-' . rand(100, 999);

        if (empty($name) || empty($cuisine)) {
            jsonResponse(['success' => false, 'message' => 'Restaurant name and cuisines are required.'], 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO restaurants (name, slug, image_url, cuisine, rating, rating_count, delivery_time_mins, price_for_two, discount_text, is_veg_only, address)
            VALUES (?, ?, ?, ?, 4.5, 10, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$name, $slug, $imageUrl, $cuisine, $deliveryTime, $priceForTwo, $discountText, $isVegOnly, $address]);

        jsonResponse([
            'success' => true,
            'message' => "Restaurant '$name' added successfully!",
            'restaurant_id' => $pdo->lastInsertId()
        ], 201);
        break;

    case 'add_dish':
        $restaurantId = isset($inputData['restaurant_id']) ? (int)$inputData['restaurant_id'] : 0;
        $name = isset($inputData['name']) ? trim($inputData['name']) : '';
        $description = isset($inputData['description']) ? trim($inputData['description']) : '';
        $price = isset($inputData['price']) ? (float)$inputData['price'] : 0.0;
        $isVeg = isset($inputData['is_veg']) ? (int)$inputData['is_veg'] : 1;
        $isBestseller = isset($inputData['is_bestseller']) ? (int)$inputData['is_bestseller'] : 0;
        $imageUrl = isset($inputData['image_url']) ? trim($inputData['image_url']) : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80';

        if (!$restaurantId || empty($name) || $price <= 0) {
            jsonResponse(['success' => false, 'message' => 'Please provide valid restaurant, dish name, and price.'], 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO menu_items (restaurant_id, name, description, price, image_url, is_veg, is_bestseller)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$restaurantId, $name, $description, $price, $imageUrl, $isVeg, $isBestseller]);

        jsonResponse([
            'success' => true,
            'message' => "Dish '$name' added to menu successfully!",
            'dish_id' => $pdo->lastInsertId()
        ], 201);
        break;

    case 'delete_dish':
        $dishId = isset($inputData['dish_id']) ? (int)$inputData['dish_id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);
        if (!$dishId) {
            jsonResponse(['success' => false, 'message' => 'Dish ID is required.'], 400);
        }

        $stmt = $pdo->prepare("DELETE FROM menu_items WHERE id = ?");
        $stmt->execute([$dishId]);

        jsonResponse([
            'success' => true,
            'message' => "Dish #$dishId deleted successfully."
        ]);
        break;

    default:
        jsonResponse(['success' => false, 'message' => 'Invalid admin action.'], 400);
        break;
}
