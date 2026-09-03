<?php
/**
 * Orders and Checkout API
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/db.php';

$pdo = getDB();
$userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : (isset($_REQUEST['user_id']) ? (int)$_REQUEST['user_id'] : 1);
$action = isset($_GET['action']) ? trim($_GET['action']) : 'list';

$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true) ?: $_POST;

switch ($action) {
    case 'create':
        $items = isset($inputData['items']) && is_array($inputData['items']) ? $inputData['items'] : [];
        if (empty($items)) {
            jsonResponse(['success' => false, 'message' => 'Cart is empty. Please add items to place an order.'], 400);
        }

        $restaurantId = isset($inputData['restaurant_id']) ? (int)$inputData['restaurant_id'] : 1;
        $deliveryAddress = isset($inputData['delivery_address']) ? trim($inputData['delivery_address']) : 'Koramangala, Bangalore';
        $deliveryInstructions = isset($inputData['delivery_instructions']) ? trim($inputData['delivery_instructions']) : '';
        $paymentMethod = isset($inputData['payment_method']) ? trim($inputData['payment_method']) : 'COD';
        $couponCode = isset($inputData['coupon_code']) ? strtoupper(trim($inputData['coupon_code'])) : '';

        // Calculate item total
        $itemTotal = 0.0;
        foreach ($items as $item) {
            $price = (float)$item['price'];
            $qty = max(1, (int)$item['quantity']);
            $itemTotal += ($price * $qty);
        }

        // Apply coupons
        $discount = 0.0;
        if ($couponCode === 'SWIGGY50') {
            $discount = min(50.0, $itemTotal * 0.5);
        } elseif ($couponCode === 'SWIGGYIT') {
            $discount = min(100.0, $itemTotal * 0.20);
        } elseif ($couponCode === 'FREEDEL') {
            $discount = 35.0;
        }

        $deliveryFee = ($itemTotal > 199 || $couponCode === 'FREEDEL') ? 0.0 : 35.0;
        $platformFee = 5.0;
        $gstAmount = round($itemTotal * 0.05, 2);
        $finalAmount = max(0.0, round($itemTotal + $deliveryFee + $platformFee + $gstAmount - $discount, 2));

        $orderNumber = 'SWIG-' . strtoupper(substr(uniqid(), -6));

        try {
            $pdo->beginTransaction();

            $orderStmt = $pdo->prepare("
                INSERT INTO orders (
                    order_number, user_id, restaurant_id, total_amount, discount_amount,
                    delivery_fee, platform_fee, gst_amount, final_amount, delivery_address,
                    delivery_instructions, payment_method, payment_status, order_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $orderStmt->execute([
                $orderNumber,
                $userId,
                $restaurantId,
                $itemTotal,
                $discount,
                $deliveryFee,
                $platformFee,
                $gstAmount,
                $finalAmount,
                $deliveryAddress,
                $deliveryInstructions,
                $paymentMethod,
                'PAID',
                'CONFIRMED'
            ]);

            $orderId = $pdo->lastInsertId();

            // Insert order items
            $itemStmt = $pdo->prepare("
                INSERT INTO order_items (order_id, menu_item_id, item_name, price, quantity, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            foreach ($items as $it) {
                $subtotal = (float)$it['price'] * (int)$it['quantity'];
                $itemStmt->execute([
                    $orderId,
                    isset($it['id']) ? (int)$it['id'] : 0,
                    $it['name'],
                    (float)$it['price'],
                    (int)$it['quantity'],
                    $subtotal
                ]);
            }

            $pdo->commit();

            jsonResponse([
                'success' => true,
                'message' => 'Order placed successfully! 🍕',
                'order' => [
                    'id' => (int)$orderId,
                    'order_number' => $orderNumber,
                    'final_amount' => $finalAmount,
                    'item_total' => $itemTotal,
                    'discount' => $discount,
                    'delivery_fee' => $deliveryFee,
                    'delivery_address' => $deliveryAddress,
                    'estimated_delivery' => '30-35 mins',
                    'order_status' => 'CONFIRMED'
                ]
            ], 201);

        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Order placement failed: ' . $e->getMessage()], 500);
        }
        break;

    case 'track':
        $orderId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        $orderNum = isset($_GET['order_number']) ? trim($_GET['order_number']) : '';

        if ($orderId > 0) {
            $stmt = $pdo->prepare("SELECT o.*, r.name as restaurant_name, r.image_url as restaurant_image FROM orders o JOIN restaurants r ON o.restaurant_id = r.id WHERE o.id = ?");
            $stmt->execute([$orderId]);
        } else {
            $stmt = $pdo->prepare("SELECT o.*, r.name as restaurant_name, r.image_url as restaurant_image FROM orders o JOIN restaurants r ON o.restaurant_id = r.id WHERE o.order_number = ?");
            $stmt->execute([$orderNum]);
        }

        $order = $stmt->fetch();
        if (!$order) {
            jsonResponse(['success' => false, 'message' => 'Order not found.'], 404);
        }

        // Get items for this order
        $itemStmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
        $itemStmt->execute([$order['id']]);
        $order['items'] = $itemStmt->fetchAll();

        // Simulated delivery tracking stages
        $stages = [
            ['stage' => 1, 'title' => 'Order Placed', 'desc' => 'We have received your order.', 'completed' => true, 'time' => 'Just now'],
            ['stage' => 2, 'title' => 'Order Accepted', 'desc' => $order['restaurant_name'] . ' is preparing your food.', 'completed' => true, 'time' => '2 mins ago'],
            ['stage' => 3, 'title' => 'Delivery Partner Assigned', 'desc' => 'Ramesh Kumar is heading to the restaurant.', 'completed' => true, 'time' => '1 min ago'],
            ['stage' => 4, 'title' => 'Out for Delivery', 'desc' => 'Food picked up! On the way to your doorstep.', 'completed' => false, 'time' => 'Est. 15 mins'],
            ['stage' => 5, 'title' => 'Delivered', 'desc' => 'Delivered with smile. Enjoy your meal!', 'completed' => false, 'time' => 'Pending']
        ];

        jsonResponse([
            'success' => true,
            'order' => $order,
            'delivery_partner' => [
                'name' => 'Ramesh Kumar',
                'phone' => '+91 98450 12345',
                'rating' => 4.9,
                'vehicle' => 'Honda Activa (KA-01-EQ-9874)',
                'avatar' => 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
            ],
            'stages' => $stages
        ]);
        break;

    case 'list':
    default:
        $stmt = $pdo->prepare("
            SELECT o.*, r.name as restaurant_name, r.image_url as restaurant_image, r.cuisine
            FROM orders o
            JOIN restaurants r ON o.restaurant_id = r.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        ");
        $stmt->execute([$userId]);
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
}
