<?php
/**
 * Swiggy Clone - Database Connection Handler
 * Supports both MySQL (default for XAMPP / production) and SQLite (automatic zero-config fallback)
 */

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'swiggy_clone');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');

function getDB() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dbType = 'mysql';
    try {
        // First try connecting to MySQL
        $port = DB_PORT;
        $dsn = "mysql:host=" . DB_HOST . ";port={$port};dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        // If MySQL fails (e.g. database not created or MySQL not running),
        // check if MySQL server is running without the database created yet
        try {
            $rootDsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
            $rootPdo = new PDO($rootDsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $rootPdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            initializeDatabase($pdo, 'mysql');
            return $pdo;
        } catch (Exception $ex) {
            // MySQL server is not running or accessible. Fallback gracefully to SQLite!
            $dbType = 'sqlite';
            $isVercel = !empty(getenv('VERCEL')) || !empty(getenv('AWS_LAMBDA_FUNCTION_NAME'));
            if ($isVercel) {
                $sqlitePath = '/tmp/swiggy.sqlite';
            } else {
                $dbDir = __DIR__ . '/../database';
                if (!is_dir($dbDir)) {
                    mkdir($dbDir, 0777, true);
                }
                $sqlitePath = $dbDir . '/swiggy.sqlite';
            }
            $pdo = new PDO("sqlite:" . $sqlitePath, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            // Enable SQLite foreign keys
            $pdo->exec("PRAGMA foreign_keys = ON;");
            initializeDatabase($pdo, 'sqlite');
        }
    }

    return $pdo;
}

function initializeDatabase($pdo, $driver = 'mysql') {
    // Check if tables already exist
    try {
        if ($driver === 'sqlite') {
            $check = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='restaurants'")->fetch();
        } else {
            $check = $pdo->query("SHOW TABLES LIKE 'restaurants'")->fetch();
        }
        if ($check) {
            return; // Already initialized
        }
    } catch (Exception $e) {}

    // Run seed data script if tables need to be created
    require_once __DIR__ . '/../database/seed_data.php';
    seedDatabase($pdo, $driver);
}

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Global CORS preflight handler
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(200);
    exit;
}
