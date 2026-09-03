<?php
/**
 * Search API - Search dishes and restaurants simultaneously
 */

require_once __DIR__ . '/../config/db.php';

$pdo = getDB();
$query = isset($_GET['q']) ? trim($_GET['q']) : '';

if (strlen($query) < 1) {
    jsonResponse([
        'success' => true,
        'query' => '',
        'restaurants' => [],
        'dishes' => []
    ]);
}

$searchTerm = "%$query%";

// 1. Search Restaurants
$restStmt = $pdo->prepare("
    SELECT * FROM restaurants 
    WHERE (name LIKE ? OR cuisine LIKE ? OR address LIKE ?)
      AND is_active = 1
    ORDER BY rating DESC
    LIMIT 10
");
$restStmt->execute([$searchTerm, $searchTerm, $searchTerm]);
$restaurants = $restStmt->fetchAll();

// 2. Search Menu Items / Dishes
$dishStmt = $pdo->prepare("
    SELECT m.*, r.name as restaurant_name, r.delivery_time_mins, r.rating as restaurant_rating
    FROM menu_items m
    JOIN restaurants r ON m.restaurant_id = r.id
    WHERE (m.name LIKE ? OR m.description LIKE ?)
      AND m.is_available = 1
      AND r.is_active = 1
    ORDER BY m.is_bestseller DESC, r.rating DESC
    LIMIT 20
");
$dishStmt->execute([$searchTerm, $searchTerm]);
$dishes = $dishStmt->fetchAll();

jsonResponse([
    'success' => true,
    'query' => $query,
    'total_restaurants' => count($restaurants),
    'total_dishes' => count($dishes),
    'restaurants' => $restaurants,
    'dishes' => $dishes
]);
