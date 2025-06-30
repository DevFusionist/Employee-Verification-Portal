<?php
// Start output buffering to prevent header issues
ob_start();

// Set error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if a file was uploaded via POST
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_FILES["imageFile"])) {
    $uploadedFile = $_FILES["imageFile"];

    // Check for upload errors
    if ($uploadedFile["error"] !== UPLOAD_ERR_OK) {
        $errorMessage = "Upload failed with error code: " . $uploadedFile["error"];
        header("Location: index.html?upload=error&message=" . urlencode($errorMessage));
        ob_end_flush();
        exit();
    }

    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (! in_array($uploadedFile["type"], $allowedTypes)) {
        header("Location: index.html?upload=error&message=" . urlencode("Invalid file type. Only images are allowed."));
        ob_end_flush();
        exit();
    }

                                 // Validate file size (5MB max)
    $maxSize = 20 * 1024 * 1024; // 20MB in bytes
    if ($uploadedFile["size"] > $maxSize) {
        header("Location: index.html?upload=error&message=" . urlencode("File too large. Maximum size is 5MB."));
        ob_end_flush();
        exit();
    }

    // Set upload directory
    $uploadDir = "idcards/";

    // Create directory if it doesn't exist
    if (! is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Get original filename and preserve it
    $originalName = $uploadedFile["name"];
    $targetPath   = $uploadDir . $originalName;

    // Check if file already exists
    if (file_exists($targetPath)) {
        header("Location: index.html?upload=error&message=" . urlencode("File already exists. Please rename your file."));
        ob_end_flush();
        exit();
    }

    // Move uploaded file to target directory
    if (move_uploaded_file($uploadedFile["tmp_name"], $targetPath)) {
        // Success - redirect back with success message
        header("Location: index.html?upload=success&filename=" . urlencode($originalName));
        ob_end_flush();
        exit();
    } else {
        // Failed to move file
        header("Location: index.html?upload=error&message=" . urlencode("Failed to save file. Please try again."));
        ob_end_flush();
        exit();
    }
} else {
    // No file uploaded or wrong request method - redirect to main page
    header("Location: index.html");
    ob_end_flush();
    exit();
}
