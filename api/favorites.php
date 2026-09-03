<?php
/**
 * Favorites API (Add, Remove, List Favorites)
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/db.php';

$pdo = getDB();
$userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : (isset($_REQUEST['user_id']) ? (int)$_REQUEST['user_id'] : null);
$action = isset($_GET['action']) ? trim($_GET['action']) : 'list';

$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true) ?: $_POST;

switch ($action) {
    case 'toggle':
        if (!$userId) {
            jsonResponse(['success' => false, 'message' => 'Please login to save favorites.'], 401);
        }

        $itemType = isset($inputData['item_type']) ? trim($inputData['item_type']) : 'restaurant';
        $itemId = isset($inputData['item_id']) ? (int)$inputData['item_id'] : 0;

        if (!$itemId) {
            jsonResponse(['success' => false, 'message' => 'Item ID is required.'], 400);
        }

        // Check if already favorited
        $checkStmt = $pdo->prepare("SELECT id FROM favorites WHERE user_id = ? AND item_type = ? AND item_id = ?");
        $checkStmt->execute([$userId, $itemType, $itemId]);
        $existing = $checkStmt->fetch();

        if ($existing) {
            // Remove
            $delStmt = $pdo->prepare("DELETE FROM favorites WHERE id = ?");
            $delStmt->execute([$existing['id']]);
            $isFavorited = false;
            $msg = 'Removed from favorites';
        } else {
            // Add
            $addStmt = $pdo->prepare("INSERT INTO favorites (user_id, item_type, item_id) VALUES (?, ?, ?)");
            $addStmt->execute([$userId, $itemType, $itemId]);
            $isFavorited = true;
            $msg = 'Added to favorites';
        }

        jsonResponse([
            'success' => true,
            'is_favorited' => $isFavorited,
            'message' => $msg
        ]);
        break;

    case 'list':
    default:
        if (!$userId) {
            jsonResponse(['success' => true, 'favorites' => ['restaurants' => [], 'dishes' => []]]);
        }

        // Fetch favorite restaurants
        $restStmt = $pdo->prepare("
            SELECT r.* FROM restaurants r
            JOIN favorites f ON r.id = f.item_id
            WHERE f.user_id = ? AND f.item_type = 'restaurant'
        ");
        $restStmt->execute([$userId]);
        $favRestaurants = $restStmt->fetchAll();

        // Fetch favorite dishes
        $dishStmt = $pdo->prepare("
            SELECT m.*, r.name as restaurant_name 
            FROM menu_items m
            JOIN restaurants r ON m.restaurant_id = r.id
            JOIN favorites f ON m.id = f.item_id
            WHERE f.user_id = ? AND f.item_type = 'menu_item'
        ");
        $dishStmt->execute([$userId]);
        $favDishes = $dishStmt->fetchAll();

        jsonResponse([
            'success' => true,
            'favorites' => [
                'restaurants' => $favRestaurants,
                'dishes' => $favDishes
            ]
        ]);
        break;
}
