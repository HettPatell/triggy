<?php
/**
 * Dynamic Coupons and Discount API Endpoint
 */

require_once __DIR__ . '/../config/db.php';

$couponsFile = __DIR__ . '/../database/coupons.json';

function getCouponsList($file) {
    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true);
        if (is_array($data)) return $data;
    }
    return [
        [
            'code' => 'FREEDEL',
            'title' => 'FREE DELIVERY',
            'description' => 'Zero delivery fee on any order amount',
            'type' => 'fixed',
            'value' => 35.0,
            'max_discount' => 35.0,
            'min_order' => 99.0,
            'status' => 'ACTIVE'
        ]
    ];
}

function saveCouponsList($file, $coupons) {
    file_put_contents($file, json_encode(array_values($coupons), JSON_PRETTY_PRINT));
}

$action = isset($_GET['action']) ? $_GET['action'] : '';
$couponsList = getCouponsList($couponsFile);

// 1. DELETE COUPON
if ($action === 'delete') {
    $codeToDelete = isset($_GET['code']) ? strtoupper(trim($_GET['code'])) : '';
    if (empty($codeToDelete)) {
        $input = json_decode(file_get_contents('php://input'), true);
        $codeToDelete = isset($input['code']) ? strtoupper(trim($input['code'])) : '';
    }
    $filtered = array_filter($couponsList, function($c) use ($codeToDelete) {
        return strtoupper($c['code']) !== $codeToDelete;
    });
    saveCouponsList($couponsFile, $filtered);
    jsonResponse(['success' => true, 'message' => "Coupon $codeToDelete deleted successfully!"]);
}

// 2. ADD COUPON
if ($action === 'add') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!empty($input['code'])) {
        $code = strtoupper(trim($input['code']));
        // Remove duplicate if exists
        $couponsList = array_filter($couponsList, function($c) use ($code) {
            return strtoupper($c['code']) !== $code;
        });
        $newCoupon = [
            'code' => $code,
            'title' => !empty($input['title']) ? $input['title'] : ($code . ' Discount'),
            'description' => !empty($input['description']) ? $input['description'] : 'Special discount promo',
            'type' => isset($input['type']) ? $input['type'] : 'percentage',
            'value' => isset($input['value']) ? (float)$input['value'] : 20.0,
            'max_discount' => isset($input['max_discount']) ? (float)$input['max_discount'] : 100.0,
            'min_order' => isset($input['min_order']) ? (float)$input['min_order'] : 149.0,
            'status' => 'ACTIVE'
        ];
        $couponsList[] = $newCoupon;
        saveCouponsList($couponsFile, $couponsList);
        jsonResponse(['success' => true, 'message' => "Coupon $code added successfully!", 'coupon' => $newCoupon]);
    }
}

// 3. GET / VALIDATE COUPON
$code = isset($_GET['code']) ? strtoupper(trim($_GET['code'])) : (isset($_POST['code']) ? strtoupper(trim($_POST['code'])) : '');
$total = isset($_GET['total']) ? (float)$_GET['total'] : (isset($_POST['total']) ? (float)$_POST['total'] : 0.0);

if (empty($code)) {
    jsonResponse([
        'success' => true,
        'available_coupons' => array_values($couponsList)
    ]);
}

// Check coupon
$found = null;
foreach ($couponsList as $c) {
    if (strtoupper($c['code']) === $code) {
        $found = $c;
        break;
    }
}

if (!$found) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid or expired coupon code.'
    ], 400);
}

if ($total > 0 && $total < (float)$found['min_order']) {
    jsonResponse([
        'success' => false,
        'message' => 'Minimum order amount for ' . $code . ' is ₹' . $found['min_order']
    ], 400);
}

$discount = 0.0;
if ($found['type'] === 'percentage') {
    $discount = min((float)$found['max_discount'], round(($total * (float)$found['value']) / 100, 2));
} else {
    $discount = min((float)$found['max_discount'], (float)$found['value']);
}

jsonResponse([
    'success' => true,
    'message' => 'Coupon ' . $code . ' applied successfully! You saved ₹' . $discount,
    'code' => $code,
    'discount' => $discount,
    'coupon' => $found
]);
