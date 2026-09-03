<?php
/**
 * Restaurants and Menu API Endpoint
 */

require_once __DIR__ . '/../config/db.php';

$pdo = getDB();

// Fetch single restaurant with menu
if (isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("SELECT * FROM restaurants WHERE id = ? AND is_active = 1");
    $stmt->execute([$id]);
    $restaurant = $stmt->fetch();

    if (!$restaurant) {
        jsonResponse(['success' => false, 'message' => 'Restaurant not found'], 404);
    }

    // Fetch menu items for this restaurant
    $vegOnly = isset($_GET['veg_only']) && $_GET['veg_only'] == '1';
    $menuSql = "
        SELECT m.*, c.name as category_name 
        FROM menu_items m
        LEFT JOIN categories c ON m.category_id = c.id
        WHERE m.restaurant_id = ? AND m.is_available = 1
    ";
    if ($vegOnly) {
        $menuSql .= " AND m.is_veg = 1";
    }
    $menuSql .= " ORDER BY m.is_bestseller DESC, m.name ASC";

    $menuStmt = $pdo->prepare($menuSql);
    $menuStmt->execute([$id]);
    $menuItems = $menuStmt->fetchAll();

    // Group menu items by category
    $groupedMenu = [];
    foreach ($menuItems as $item) {
        $cat = !empty($item['category_name']) ? $item['category_name'] : 'Recommended';
        if (!isset($groupedMenu[$cat])) {
            $groupedMenu[$cat] = [];
        }
        $groupedMenu[$cat][] = $item;
    }

    jsonResponse([
        'success' => true,
        'restaurant' => $restaurant,
        'menu_items' => $menuItems,
        'menu_by_category' => $groupedMenu
    ]);
}

// Fetch categories
$categories = $pdo->query("SELECT * FROM categories ORDER BY display_order ASC")->fetchAll();

// List restaurants with filtering & sorting
$sql = "SELECT * FROM restaurants WHERE is_active = 1";
$params = [];

// Filter: Pure Veg
if (isset($_GET['veg_only']) && $_GET['veg_only'] == '1') {
    $sql .= " AND is_veg_only = 1";
}

// Filter: Rating
if (isset($_GET['rating']) && is_numeric($_GET['rating'])) {
    $sql .= " AND rating >= ?";
    $params[] = (float)$_GET['rating'];
}

// Filter: Fast Delivery (< 30 mins)
if (isset($_GET['fast_delivery']) && $_GET['fast_delivery'] == '1') {
    $sql .= " AND delivery_time_mins <= 25";
}

// Filter: Cuisine / Category
if (isset($_GET['category']) && !empty($_GET['category'])) {
    $catSlug = trim($_GET['category']);
    $sql .= " AND (cuisine LIKE ? OR id IN (
        SELECT DISTINCT restaurant_id FROM menu_items m 
        JOIN categories c ON m.category_id = c.id 
        WHERE c.slug = ?
    ))";
    $params[] = "%$catSlug%";
    $params[] = $catSlug;
}

// Sorting
$sort = isset($_GET['sort']) ? trim($_GET['sort']) : 'default';
switch ($sort) {
    case 'rating':
        $sql .= " ORDER BY rating DESC";
        break;
    case 'delivery_time':
        $sql .= " ORDER BY delivery_time_mins ASC";
        break;
    case 'price_low':
        $sql .= " ORDER BY price_for_two ASC";
        break;
    case 'price_high':
        $sql .= " ORDER BY price_for_two DESC";
        break;
    default:
        $sql .= " ORDER BY rating DESC, rating_count DESC";
        break;
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$restaurants = $stmt->fetchAll();

jsonResponse([
    'success' => true,
    'total' => count($restaurants),
    'categories' => $categories,
    'restaurants' => $restaurants
]);
