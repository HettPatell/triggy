<?php
/**
 * Swiggy Clone - Database Setup & Health Check Script
 * Visit http://localhost:8000/setup_db.php or http://localhost/swiggy/setup_db.php
 */

require_once __DIR__ . '/config/db.php';

$message = '';
$status = 'info';

try {
    $pdo = getDB();
    
    // Check tables
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver === 'sqlite') {
        $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")->fetchAll(PDO::FETCH_COLUMN);
    } else {
        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    }
    
    $restaurantCount = $pdo->query("SELECT COUNT(*) FROM restaurants")->fetchColumn();
    $itemCount = $pdo->query("SELECT COUNT(*) FROM menu_items")->fetchColumn();
    $userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    
    $status = 'success';
    $message = "Database is connected and healthy! Driver: " . strtoupper($driver);
} catch (Exception $e) {
    $status = 'danger';
    $message = "Database error: " . $e->getMessage();
}

if (isset($_GET['format']) && $_GET['format'] === 'json') {
    jsonResponse([
        'status' => $status,
        'message' => $message,
        'driver' => isset($driver) ? $driver : 'unknown',
        'tables' => isset($tables) ? $tables : [],
        'restaurants' => isset($restaurantCount) ? (int)$restaurantCount : 0,
        'menu_items' => isset($itemCount) ? (int)$itemCount : 0,
        'users' => isset($userCount) ? (int)$userCount : 0
    ]);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Triggy - Database Status</title>
    <link href="https://fonts.googleapis.com/css2?family=Basis+Grotesque+Pro:wght@400;500;700;900&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        body { background: #f4f5f7; color: #282c3f; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
        .card { background: #fff; border-radius: 16px; padding: 36px; max-width: 600px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }
        .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .logo-icon { width: 44px; height: 44px; background: #fc8019; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 24px; }
        .logo-text { font-size: 24px; font-weight: 800; color: #fc8019; letter-spacing: -0.5px; }
        .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 13px; margin-bottom: 20px; }
        .badge-success { background: #e8f7ed; color: #15803d; }
        .badge-danger { background: #fee2e2; color: #b91c1c; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 24px 0; }
        .stat-box { background: #fafafa; border: 1px solid #eaeaea; border-radius: 12px; padding: 16px; text-align: center; }
        .stat-val { font-size: 28px; font-weight: 800; color: #fc8019; }
        .stat-lbl { font-size: 13px; color: #686b78; margin-top: 4px; font-weight: 600; }
        .btn { display: inline-block; width: 100%; background: #fc8019; color: #fff; text-align: center; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; transition: 0.2s ease; border: none; cursor: pointer; }
        .btn:hover { background: #e26f0f; }
        .info-list { list-style: none; margin: 20px 0; border-top: 1px solid #eee; padding-top: 16px; font-size: 14px; }
        .info-list li { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f6f6f6; }
        .info-list li span:last-child { font-weight: 600; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">
            <div class="logo-icon">T</div>
            <div class="logo-text">TRIGGY DB MANAGER</div>
        </div>

        <div class="badge badge-<?= $status ?>">
            <?= htmlspecialchars($message) ?>
        </div>

        <?php if ($status === 'success'): ?>
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-val"><?= $restaurantCount ?></div>
                <div class="stat-lbl">Restaurants</div>
            </div>
            <div class="stat-box">
                <div class="stat-val"><?= $itemCount ?></div>
                <div class="stat-lbl">Menu Items</div>
            </div>
            <div class="stat-box">
                <div class="stat-val"><?= $userCount ?></div>
                <div class="stat-lbl">Users</div>
            </div>
        </div>

        <ul class="info-list">
            <li><span>Active Database Driver:</span> <span><?= strtoupper($driver) ?></span></li>
            <li><span>Demo User Email:</span> <span>rahul@example.com</span></li>
            <li><span>Demo User Password:</span> <span>swiggy123</span></li>
            <li><span>Available Tables:</span> <span><?= count($tables) ?> tables active</span></li>
        </ul>

        <a href="index.html" class="btn">🚀 Open Triggy Food Website</a>
        <?php else: ?>
        <p style="color: #686b78; line-height: 1.6; margin-bottom: 20px;">
            Please check database configuration in <code>config/db.php</code>.
        </p>
        <?php endif; ?>
    </div>
</body>
</html>
