<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class NextcloudService
{
    private Client $client;
    private string $baseUrl;
    private string $username;
    private string $password;
    private ?string $userId = null; // Cache the user ID

    public function __construct()
    {
        $this->baseUrl = env('NEXTCLOUD_URL', 'https://your-nextcloud-server.com');
        $this->username = env('NEXTCLOUD_USERNAME', 'your-username');
        $this->password = env('NEXTCLOUD_PASSWORD', 'your-password');
        
        $this->client = new Client([
            'timeout' => 30,
            'verify' => false, // Set to true in production with proper SSL
        ]);
    }

    /**
     * Get the actual user ID from Nextcloud (which may differ from username)
     * 
     * @return string
     * @throws \Exception
     */
    private function getUserId(): string
    {
        if ($this->userId !== null) {
            return $this->userId; // Return cached user ID
        }

        try {
            $ocsUrl = rtrim($this->baseUrl, '/') . '/ocs/v1.php/cloud/user?format=json';
            
            Log::info('Fetching Nextcloud User ID', [
                'url' => $ocsUrl,
                'username' => $this->username
            ]);
            
            $response = $this->client->get($ocsUrl, [
                'auth' => [$this->username, $this->password],
                'headers' => [
                    'OCS-APIRequest' => 'true',
                    'Accept' => 'application/json'
                ]
            ]);
            
            $data = json_decode($response->getBody()->getContents(), true);
            
            if (isset($data['ocs']['data']['id'])) {
                $this->userId = $data['ocs']['data']['id'];
                
                Log::info('Successfully fetched Nextcloud User ID', [
                    'username' => $this->username,
                    'user_id' => $this->userId
                ]);
                
                return $this->userId;
            }
            
            throw new \Exception('User ID not found in OCS response');
            
        } catch (GuzzleException $e) {
            Log::error('Failed to fetch Nextcloud User ID', [
                'error_message' => $e->getMessage(),
                'username' => $this->username
            ]);
            
            throw new \Exception('Failed to fetch user ID from Nextcloud: ' . $e->getMessage());
        }
    }

    /**
     * Fetch file content from Nextcloud via WebDAV
     * 
     * @param string $filePath The path to the file in Nextcloud (e.g., '/Documents/proposals.csv')
     * @return string File content
     * @throws \Exception
     */
    public function getFileContent(string $filePath): string
    {
        try {
            // Get the actual user ID (which may differ from username)
            $userId = $this->getUserId();
            $encodedUserId = urlencode($userId);
            $webdavUrl = rtrim($this->baseUrl, '/') . '/remote.php/dav/files/' . $encodedUserId . $filePath;
            
            Log::info('Starting Nextcloud WebDAV Request', [
                'url' => $webdavUrl,
                'file_path' => $filePath,
                'username' => $this->username,
                'method' => 'GET'
            ]);

            $startTime = microtime(true);
            $response = $this->client->get($webdavUrl, [
                'auth' => [$this->username, $this->password],
                'headers' => [
                    'Accept' => '*/*',
                    'User-Agent' => 'Laravel-Dashboard/1.0'
                ]
            ]);
            $endTime = microtime(true);

            $content = $response->getBody()->getContents();
            
            Log::info('Nextcloud WebDAV Response Success', [
                'file_size_bytes' => strlen($content),
                'file_path' => $filePath,
                'status_code' => $response->getStatusCode(),
                'response_time_ms' => round(($endTime - $startTime) * 1000, 2),
                'content_preview' => substr($content, 0, 100) . (strlen($content) > 100 ? '...' : '')
            ]);

            return $content;

        } catch (GuzzleException $e) {
            Log::error('Nextcloud WebDAV Request Failed', [
                'error_message' => $e->getMessage(),
                'file_path' => $filePath,
                'status_code' => method_exists($e, 'getResponse') && $e->getResponse() ? $e->getResponse()->getStatusCode() : 'unknown',
                'request_url' => $webdavUrl ?? 'unknown',
                'exception_class' => get_class($e)
            ]);
            
            throw new \Exception('Failed to fetch file from Nextcloud: ' . $e->getMessage());
        }
    }

    /**
     * Check if Nextcloud connection is working
     * 
     * @return bool
     */
    public function testConnection(): bool
    {
        try {
            // Get the actual user ID and encode it for URLs
            $userId = $this->getUserId();
            $encodedUserId = urlencode($userId);
            $webdavUrl = rtrim($this->baseUrl, '/') . '/remote.php/dav/files/' . $encodedUserId . '/';
            
            Log::info('Testing Nextcloud Connection', [
                'url' => $webdavUrl,
                'username' => $this->username,
                'user_id' => $userId,
                'method' => 'PROPFIND'
            ]);
            
            $response = $this->client->request('PROPFIND', $webdavUrl, [
                'auth' => [$this->username, $this->password],
                'headers' => [
                    'Depth' => '0',
                    'Content-Type' => 'text/xml'
                ]
            ]);

            $isConnected = $response->getStatusCode() === 207;
            
            Log::info('Nextcloud Connection Test Result', [
                'connected' => $isConnected,
                'status_code' => $response->getStatusCode(),
                'expected_status' => 207
            ]);

            return $isConnected; // WebDAV Multi-Status response
            
        } catch (GuzzleException $e) {
            Log::error('Nextcloud Connection Test Failed', [
                'error_message' => $e->getMessage(),
                'status_code' => method_exists($e, 'getResponse') && $e->getResponse() ? $e->getResponse()->getStatusCode() : 'unknown',
                'exception_class' => get_class($e)
            ]);
            
            return false;
        }
    }
}