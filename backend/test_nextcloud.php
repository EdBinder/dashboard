<?php

require_once 'vendor/autoload.php';

use App\Services\NextcloudService;

// Simple test script to debug Nextcloud service
echo "Testing NextcloudService...\n";

try {
    // Simulate Laravel environment
    $_ENV['NEXTCLOUD_URL'] = 'https://data.iiiusnc.de';
    $_ENV['NEXTCLOUD_USERNAME'] = 'iiius.institut@gmail.com';
    $_ENV['NEXTCLOUD_PASSWORD'] = 'QjnCy-GTqNj-LM5Jd-2ARq8-Di2MN';
    
    $service = new NextcloudService();
    
    echo "✓ NextcloudService instantiated successfully\n";
    
    // Test connection
    $connected = $service->testConnection();
    echo $connected ? "✓ Nextcloud connection successful\n" : "✗ Nextcloud connection failed\n";
    
    if ($connected) {
        // Try to fetch file
        $filePath = '/IIIUS-Share/Antraege/Antragsliste_Dashboard.xlsx';
        echo "Attempting to fetch file: $filePath\n";
        
        $content = $service->getFileContent($filePath);
        echo "✓ File fetched successfully, size: " . strlen($content) . " bytes\n";
    }
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}