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
     * Fetch file content from Nextcloud via WebDAV
     * 
     * @param string $filePath The path to the file in Nextcloud (e.g., '/Documents/proposals.csv')
     * @return string File content
     * @throws \Exception
     */
    public function getFileContent(string $filePath): string
    {
        try {
            // Nextcloud WebDAV URL structure
            $webdavUrl = rtrim($this->baseUrl, '/') . '/remote.php/dav/files/' . $this->username . $filePath;
            
            Log::info('Fetching file from Nextcloud', [
                'url' => $webdavUrl,
                'file_path' => $filePath
            ]);

            $response = $this->client->get($webdavUrl, [
                'auth' => [$this->username, $this->password],
                'headers' => [
                    'Accept' => '*/*',
                    'User-Agent' => 'Laravel-Dashboard/1.0'
                ]
            ]);

            $content = $response->getBody()->getContents();
            
            Log::info('Successfully fetched file from Nextcloud', [
                'file_size' => strlen($content),
                'file_path' => $filePath
            ]);

            return $content;

        } catch (GuzzleException $e) {
            Log::error('Failed to fetch file from Nextcloud', [
                'error' => $e->getMessage(),
                'file_path' => $filePath,
                'status_code' => $e->getCode()
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
            $webdavUrl = rtrim($this->baseUrl, '/') . '/remote.php/dav/files/' . $this->username . '/';
            
            $response = $this->client->request('PROPFIND', $webdavUrl, [
                'auth' => [$this->username, $this->password],
                'headers' => [
                    'Depth' => '0',
                    'Content-Type' => 'text/xml'
                ]
            ]);

            return $response->getStatusCode() === 207; // WebDAV Multi-Status response
            
        } catch (GuzzleException $e) {
            Log::error('Nextcloud connection test failed', [
                'error' => $e->getMessage(),
                'status_code' => $e->getCode()
            ]);
            
            return false;
        }
    }
}