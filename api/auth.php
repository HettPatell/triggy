<?php
/**
 * Authentication API (Register, Login, Logout, Current User)
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/db.php';

$pdo = getDB();
$action = isset($_GET['action']) ? trim($_GET['action']) : '';

// Get JSON input if sent via POST/PUT
$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true) ?: $_POST;

switch ($action) {
    case 'register':
        $name = isset($inputData['name']) ? trim($inputData['name']) : '';
        $email = isset($inputData['email']) ? trim($inputData['email']) : '';
        $phone = isset($inputData['phone']) ? trim($inputData['phone']) : '';
        $password = isset($inputData['password']) ? trim($inputData['password']) : '';
        $address = isset($inputData['address']) ? trim($inputData['address']) : 'Koramangala, Bangalore';

        if (empty($name) || empty($email) || empty($password)) {
            jsonResponse(['success' => false, 'message' => 'Please provide name, email, and password.'], 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['success' => false, 'message' => 'Invalid email address format.'], 400);
        }

        // Check if user already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR phone = ?");
        $stmt->execute([$email, $phone]);
        if ($stmt->fetch()) {
            jsonResponse(['success' => false, 'message' => 'An account with this email or phone already exists.'], 409);
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $insert = $pdo->prepare("INSERT INTO users (name, email, phone, password_hash, address) VALUES (?, ?, ?, ?, ?)");
        $insert->execute([$name, $email, $phone, $passwordHash, $address]);

        $userId = $pdo->lastInsertId();
        $_SESSION['user_id'] = $userId;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email'] = $email;

        jsonResponse([
            'success' => true,
            'message' => 'Registration successful! Welcome to Swiggy.',
            'user' => [
                'id' => (int)$userId,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'address' => $address
            ]
        ], 201);
        break;

    case 'login':
        $emailOrPhone = isset($inputData['email']) ? trim($inputData['email']) : '';
        $password = isset($inputData['password']) ? trim($inputData['password']) : '';

        if (empty($emailOrPhone) || empty($password)) {
            jsonResponse(['success' => false, 'message' => 'Please enter email/phone and password.'], 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1");
        $stmt->execute([$emailOrPhone, $emailOrPhone]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            jsonResponse(['success' => false, 'message' => 'Invalid email or password.'], 401);
        }

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_email'] = $user['email'];

        jsonResponse([
            'success' => true,
            'message' => 'Logged in successfully!',
            'user' => [
                'id' => (int)$user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'address' => $user['address']
            ]
        ]);
        break;

    case 'logout':
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
        jsonResponse(['success' => true, 'message' => 'Logged out successfully.']);
        break;

    case 'me':
    default:
        $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : (isset($_GET['user_id']) ? (int)$_GET['user_id'] : null);
        if ($userId) {
            $stmt = $pdo->prepare("SELECT id, name, email, phone, address, created_at FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            if ($user) {
                jsonResponse(['logged_in' => true, 'user' => $user]);
            }
        }
        jsonResponse(['logged_in' => false, 'user' => null]);
        break;
}
